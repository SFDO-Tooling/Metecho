import logging
import traceback

from asgiref.sync import async_to_sync
from django.utils.text import slugify
from django.utils.timezone import now
from django_rq import job

from . import sf_org_changes as sf_changes
from . import sf_run_flow as sf_flow
from .gh import (
    extract_owner_and_repo,
    get_cumulus_prefix,
    gh_given_user,
    local_github_checkout,
    try_to_make_branch,
)
from .push import report_scratch_org_error

logger = logging.getLogger(__name__)


def _create_branches_on_github(*, user, repo_url, project, task, repo_root):
    """
    Expects to be called in the context of a local github checkout.
    """
    gh = gh_given_user(user)
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
        project_branch_name = try_to_make_branch(
            repository,
            new_branch=project_branch_name,
            base_branch=repository.default_branch,
        )
        project.branch_name = project_branch_name
        project.finalize_branch_update()

    # Make task branch, with latest from task:
    task.refresh_from_db()
    if task.branch_name:
        task_branch_name = task.branch_name
    else:
        task_branch_name = try_to_make_branch(
            repository,
            new_branch=f"{project_branch_name}__{slugify(task.name)}",
            base_branch=project_branch_name,
        )
        task.branch_name = task_branch_name
        task.finalize_branch_update()

    return task_branch_name


def _create_org_and_run_flow(scratch_org, *, user, repo_url, repo_branch, project_path):
    from .models import SCRATCH_ORG_TYPES

    cases = {SCRATCH_ORG_TYPES.Dev: "dev_org", SCRATCH_ORG_TYPES.QA: "qa_org"}

    gh = gh_given_user(user)
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
    scratch_org.refresh_from_db()
    scratch_org.url = org_config.instance_url
    scratch_org.last_modified_at = now()
    scratch_org.expires_at = org_config.expires
    scratch_org.latest_commit = commit.sha
    scratch_org.latest_commit_url = commit.html_url
    scratch_org.latest_commit_at = commit.commit.author.get("date", None)
    scratch_org.config = org_config.config
    scratch_org.login_url = login_url
    scratch_org.latest_revision_numbers = sf_changes.get_latest_revision_numbers(
        scratch_org
    )


def create_branches_on_github_then_create_scratch_org(
    *, project, repo_url, scratch_org, task, user
):
    try:
        with local_github_checkout(user, repo_url) as repo_root:
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
    except Exception as e:
        scratch_org.finalize_provision(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_provision()


create_branches_on_github_then_create_scratch_org_job = job(
    create_branches_on_github_then_create_scratch_org
)


def get_unsaved_changes(scratch_org):
    try:
        scratch_org.refresh_from_db()
        old_revision_numbers = scratch_org.latest_revision_numbers
        new_revision_numbers = sf_changes.get_latest_revision_numbers(scratch_org)
        unsaved_changes = sf_changes.compare_revisions(
            old_revision_numbers, new_revision_numbers
        )
        scratch_org.refresh_from_db()
        scratch_org.unsaved_changes = unsaved_changes
        scratch_org.latest_revision_numbers = new_revision_numbers
    except Exception as e:
        scratch_org.refresh_from_db()
        scratch_org.finalize_get_unsaved_changes(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_get_unsaved_changes()


get_unsaved_changes_job = job(get_unsaved_changes)


def commit_changes_from_org(scratch_org, user, desired_changes, commit_message):
    repo_url = scratch_org.task.project.repository.repo_url
    branch = scratch_org.task.branch_name

    try:
        sf_changes.commit_changes_to_github(
            user=user,
            scratch_org=scratch_org,
            repo_url=repo_url,
            branch=branch,
            desired_changes=desired_changes,
            commit_message=commit_message,
        )

        # Update
        gh = gh_given_user(user)
        owner, repo = extract_owner_and_repo(repo_url)
        repository = gh.repository(owner, repo)
        commit = repository.branch(branch).commit

        scratch_org.refresh_from_db()
        scratch_org.last_modified_at = now()
        scratch_org.latest_commit = commit.sha
        scratch_org.latest_commit_url = commit.html_url
        scratch_org.latest_commit_at = commit.commit.author.get("date", None)
        scratch_org.latest_revision_numbers = sf_changes.get_latest_revision_numbers(
            scratch_org
        )
    except Exception as e:
        scratch_org.refresh_from_db()
        scratch_org.finalize_commit_changes(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_commit_changes()


commit_changes_from_org_job = job(commit_changes_from_org)


def delete_scratch_org(scratch_org):
    try:
        sf_flow.delete_scratch_org(scratch_org)
        scratch_org.delete()
    except Exception as e:
        scratch_org.refresh_from_db()
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
