import contextlib
import logging
import traceback

from asgiref.sync import async_to_sync
from django.utils.text import slugify
from django.utils.timezone import now
from django_rq import job
from github3 import login
from github3.exceptions import UnprocessableEntity

from . import sf_org_changes as sf_changes
from . import sf_run_flow as sf_flow
from .github_context import (
    extract_owner_and_repo,
    get_cumulus_prefix,
    local_github_checkout,
)
from .push import push_message_about_instance

logger = logging.getLogger(__name__)


async def report_scratch_org_error(instance, err, type_):
    from .serializers import ScratchOrgSerializer

    # @jgerigmeyer asked for the error to be unwrapped in the case that
    # there's only one, which is the most common case, per this
    # discussion:
    # https://github.com/SFDO-Tooling/MetaShare/pull/149#discussion_r327308563
    try:
        message = err.content
        if isinstance(message, list) and len(message) == 1:
            message = message[0]
        if isinstance(message, dict):
            message = message.get("message", message)
        message = str(message)
    except AttributeError:
        message = str(err)

    message = {
        "type": type_,
        "payload": {"message": message, "model": ScratchOrgSerializer(instance).data},
    }
    await push_message_about_instance(instance, message)


@contextlib.contextmanager
def mark_refreshing_changes(scratch_org):
    scratch_org.currently_refreshing_changes = True
    scratch_org.save()
    try:
        yield
    except Exception:
        scratch_org.unsaved_changes = {}
        raise
    finally:
        scratch_org.currently_refreshing_changes = False
        scratch_org.save()


@contextlib.contextmanager
def mark_capturing_changes(scratch_org):
    scratch_org.currently_capturing_changes = True
    scratch_org.save()
    try:
        yield
    finally:
        scratch_org.currently_capturing_changes = False
        scratch_org.save()


@contextlib.contextmanager
def report_errors_on_provision(scratch_org):
    try:
        yield
    except Exception as e:
        async_to_sync(report_scratch_org_error)(
            scratch_org, e, "SCRATCH_ORG_PROVISION_FAILED"
        )
        tb = traceback.format_exc()
        logger.error(tb)
        scratch_org.delete()
        raise


@contextlib.contextmanager
def report_errors_on_fetch_changes(scratch_org):
    try:
        yield
    except Exception as e:
        async_to_sync(report_scratch_org_error)(
            scratch_org, e, "SCRATCH_ORG_FETCH_CHANGES_FAILED"
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise


@contextlib.contextmanager
def report_errors_on_commit_changes(scratch_org):
    try:
        yield
    except Exception as e:
        async_to_sync(report_scratch_org_error)(
            scratch_org, e, "SCRATCH_ORG_COMMIT_CHANGES_FAILED"
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise


def _try_to_make_branch(repository, *, new_branch, base_branch):
    branch_name = new_branch
    counter = 0
    while True:
        try:
            latest_sha = repository.branch(base_branch).latest_sha()
            repository.create_branch_ref(branch_name, latest_sha)
            return branch_name
        except UnprocessableEntity as err:
            if err.msg == "Reference already exists":
                counter += 1
                branch_name = f"{new_branch}-{counter}"
            else:
                raise


def _create_branches_on_github(*, user, repo_url, project, task, repo_root):
    """
    Expects to be called in the context of a local github checkout.
    """
    gh = login(token=user.gh_token)
    owner, repo = extract_owner_and_repo(repo_url)
    repository = gh.repository(owner, repo)

    # Make project branch, with latest from project:
    project.refresh_from_db()
    if project.branch_name:
        project_branch_name = project.branch_name
    else:
        prefix = get_cumulus_prefix(
            repo_root=repo_root,
            repo_name=repository.name,
            repo_url=repo_url,
            repo_owner=owner,
            repo_branch=repository.default_branch,
            repo_commit=repository.branch(repository.default_branch).latest_sha(),
        )
        project_branch_name = f"{prefix}{slugify(project.name)}"
        project_branch_name = _try_to_make_branch(
            repository,
            new_branch=project_branch_name,
            base_branch=repository.default_branch,
        )
        project.branch_name = project_branch_name
        project.save()

    # Make task branch, with latest from task:
    task.refresh_from_db()
    if task.branch_name:
        task_branch_name = task.branch_name
    else:
        task_branch_name = _try_to_make_branch(
            repository,
            new_branch=f"{project_branch_name}__{slugify(task.name)}",
            base_branch=project_branch_name,
        )
        task.branch_name = task_branch_name
        task.save()

    return task_branch_name


def _create_org_and_run_flow(scratch_org, *, user, repo_url, repo_branch, project_path):
    from .models import SCRATCH_ORG_TYPES

    cases = {SCRATCH_ORG_TYPES.Dev: "dev_org", SCRATCH_ORG_TYPES.QA: "qa_org"}

    gh = login(token=user.gh_token)
    owner, repo = extract_owner_and_repo(repo_url)
    repository = gh.repository(owner, repo)
    commit = repository.branch(repo_branch).commit

    owner, repo = extract_owner_and_repo(repo_url)
    org_config, login_url = sf_flow.create_org_and_run_flow(
        repo_owner=owner,
        repo_name=repo,
        repo_branch=repo_branch,
        user=user,
        flow_name=cases[scratch_org.org_type],
        project_path=project_path,
    )
    scratch_org.url = org_config.instance_url
    scratch_org.last_modified_at = now()
    scratch_org.expires_at = org_config.expires
    scratch_org.latest_commit = commit.sha
    scratch_org.latest_commit_url = commit.html_url
    scratch_org.latest_commit_at = commit.commit.author.get("date", None)
    scratch_org.config = org_config.config
    scratch_org.login_url = login_url
    scratch_org.save()


def create_branches_on_github_then_create_scratch_org(
    *, project, repo_url, scratch_org, task, user
):
    with contextlib.ExitStack() as stack:
        repo_root = stack.enter_context(local_github_checkout(user, repo_url))
        stack.enter_context(report_errors_on_provision(scratch_org))

        commit_ish = _create_branches_on_github(
            user=user,
            repo_url=repo_url,
            project=project,
            task=task,
            repo_root=repo_root,
        )
        _create_org_and_run_flow(
            scratch_org,
            user=user,
            repo_url=repo_url,
            repo_branch=commit_ish,
            project_path=repo_root,
        )
        scratch_org.latest_revision_numbers = sf_changes.get_latest_revision_numbers(
            scratch_org
        )
        scratch_org.save()


create_branches_on_github_then_create_scratch_org_job = job(
    create_branches_on_github_then_create_scratch_org
)


def get_unsaved_changes(scratch_org):
    with contextlib.ExitStack() as stack:
        stack.enter_context(report_errors_on_fetch_changes(scratch_org))
        stack.enter_context(mark_refreshing_changes(scratch_org))

        old_revision_numbers = scratch_org.latest_revision_numbers
        new_revision_numbers = sf_changes.get_latest_revision_numbers(scratch_org)
        unsaved_changes = sf_changes.compare_revisions(
            old_revision_numbers, new_revision_numbers
        )
        if unsaved_changes:
            scratch_org.latest_revision_numbers = new_revision_numbers
            scratch_org.unsaved_changes = unsaved_changes


get_unsaved_changes_job = job(get_unsaved_changes)


def commit_changes_from_org(scratch_org, user, desired_changes, commit_message):
    from .serializers import ScratchOrgSerializer

    repo_url = scratch_org.task.project.repository.repo_url
    branch = scratch_org.task.branch_name

    with contextlib.ExitStack() as stack:
        stack.enter_context(report_errors_on_commit_changes(scratch_org))
        stack.enter_context(mark_capturing_changes(scratch_org))

        sf_changes.commit_changes_to_github(
            user=user,
            scratch_org=scratch_org,
            repo_url=repo_url,
            branch=branch,
            desired_changes=desired_changes,
            commit_message=commit_message,
        )

        # Update
        gh = login(token=user.gh_token)
        owner, repo = extract_owner_and_repo(repo_url)
        repository = gh.repository(owner, repo)
        commit = repository.branch(branch).commit

        scratch_org.last_modified_at = now()
        scratch_org.latest_commit = commit.sha
        scratch_org.latest_commit_url = commit.html_url
        scratch_org.latest_commit_at = commit.commit.author.get("date", None)
        scratch_org.latest_revision_numbers = sf_changes.get_latest_revision_numbers(
            scratch_org
        )
        scratch_org.save()

    async_to_sync(push_message_about_instance)(
        scratch_org,
        {
            "type": "GITHUB_CHANGES_COMMITTED",
            "payload": ScratchOrgSerializer(scratch_org).data,
        },
    )


commit_changes_from_org_job = job(commit_changes_from_org)


def delete_scratch_org(scratch_org):
    try:
        sf_flow.delete_scratch_org(scratch_org)
        scratch_org.delete()
    except Exception as e:
        scratch_org.delete_queued_at = None
        scratch_org.save()
        async_to_sync(report_scratch_org_error)(
            scratch_org, e, "SCRATCH_ORG_DELETE_FAILED"
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise


delete_scratch_org_job = job(delete_scratch_org)


def refresh_github_repositories_for_user(user):
    user.refresh_repositories()


refresh_github_repositories_for_user_job = job(refresh_github_repositories_for_user)
