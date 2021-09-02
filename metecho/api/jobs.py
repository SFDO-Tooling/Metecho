import contextlib
import logging
import string
import traceback
from datetime import timedelta
from pathlib import Path

import requests
from asgiref.sync import async_to_sync
from bs4 import BeautifulSoup
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.text import slugify
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from django_rq import get_scheduler, job
from github3.exceptions import NotFoundError
from github3.github import GitHub
from github3.repos.repo import Repository

from .email_utils import get_user_facing_url
from .gh import (
    get_all_org_repos,
    get_cached_user,
    get_cumulus_prefix,
    get_project_config,
    get_repo_info,
    local_github_checkout,
    normalize_commit,
    try_to_make_branch,
)
from .models import TASK_REVIEW_STATUS
from .push import report_scratch_org_error
from .sf_org_changes import (
    commit_changes_to_github,
    compare_revisions,
    get_latest_revision_numbers,
    get_valid_target_directories,
)
from .sf_run_flow import create_org, delete_org, run_flow

logger = logging.getLogger(__name__)


class TaskReviewIntegrityError(Exception):
    pass


@contextlib.contextmanager
def creating_gh_branch(instance):
    instance.currently_creating_branch = True
    instance.save()
    instance.notify_changed(originating_user_id=None)
    try:
        yield
    finally:
        instance.currently_creating_branch = False


def get_branch_prefix(user, repository: Repository):
    if settings.BRANCH_PREFIX:
        return settings.BRANCH_PREFIX
    with local_github_checkout(user, repository.id) as repo_root:
        return get_cumulus_prefix(
            repo_root=repo_root,
            repo_name=repository.name,
            repo_url=repository.html_url,
            repo_owner=repository.owner.login,
            repo_branch=repository.default_branch,
            repo_commit=repository.branch(repository.default_branch).latest_sha(),
        )


def epic_create_branch(
    *,
    user,
    epic,
    repository,
    originating_user_id,
    should_finalize=True,
):
    if epic.branch_name:
        epic_branch_name = epic.branch_name
    else:
        prefix = epic.project.branch_prefix or get_branch_prefix(user, repository)
        epic_branch_name = f"{prefix}{slugify(epic.name)}"
        with creating_gh_branch(epic):
            latest_sha = repository.branch(repository.default_branch).latest_sha()
            epic_branch_name = try_to_make_branch(
                repository, new_branch=epic_branch_name, base_sha=latest_sha
            )
        epic.branch_name = epic_branch_name
        epic.latest_sha = latest_sha
        if should_finalize:
            epic.finalize_epic_update(originating_user_id=originating_user_id)
    return epic_branch_name


def _create_branches_on_github(
    *, user, repo_id, epic=None, task=None, task_sha=None, originating_user_id=None
):
    if not (epic or task):
        raise ValueError("At least one of Task or Epic is required")

    repository = get_repo_info(user, repo_id=repo_id)
    epic_branch_name = None

    if epic:
        # Make epic branch, with latest from epic:
        epic.refresh_from_db()
        epic_branch_name = epic_create_branch(
            epic=epic,
            repository=repository,
            user=user,
            originating_user_id=originating_user_id,
        )
        if not task:
            return epic_branch_name

    # Make task branch, with custom commit or falling back to latest from epic:
    task.refresh_from_db()
    if task.branch_name:
        return task.branch_name

    with creating_gh_branch(task):
        if epic_branch_name:
            base_branch_name = epic_branch_name
            prefix = f"{epic_branch_name}__"
        else:
            base_branch_name = repository.default_branch
            prefix = get_branch_prefix(user, repository)
        latest_sha = task_sha or repository.branch(base_branch_name).latest_sha()
        task_branch_name = try_to_make_branch(
            repository,
            new_branch=f"{prefix}{slugify(task.name)}",
            base_sha=latest_sha,
        )
    task.branch_name = task_branch_name
    task.origin_sha = latest_sha
    task.finalize_task_update(originating_user_id=originating_user_id)

    return task_branch_name


def alert_user_about_expiring_org(*, org, days):
    from .models import ScratchOrg, User

    # if scratch org is there
    try:
        org.refresh_from_db()
        user = org.owner
        user.refresh_from_db()
    except (ScratchOrg.DoesNotExist, User.DoesNotExist):  # pragma: nocover
        # This should never be reachable under normal circumstances, but
        # if it should exceptionally occur, the correct thing to do is
        # bail:
        return
    if org.deleted_at is not None:
        return

    # and has unsaved changes
    get_unsaved_changes(org, originating_user_id=None)
    if org.unsaved_changes:
        task = org.task
        metecho_link = get_user_facing_url(path=task.get_absolute_url())

        # email user
        subject = _("Metecho Scratch Org Expiring with Uncommitted Changes")
        body = render_to_string(
            "scratch_org_expiry_email.txt",
            {
                "task_name": task.full_name,
                "days": days,
                "expiry_date": org.expires_at,
                "user_name": user.username,
                "metecho_link": metecho_link,
            },
        )
        user.notify(subject, body)


def _create_org_and_run_flow(
    scratch_org,
    *,
    user,
    repo_id,
    repo_branch,
    project_path,
    originating_user_id,
    sf_username=None,
):
    """
    Expects to be called in the context of a local github checkout.
    """
    repository = get_repo_info(user, repo_id=repo_id)
    commit = repository.branch(repo_branch).commit
    org_config_name = scratch_org.org_config_name

    scratch_org_config, cci, org_config = create_org(
        repo_owner=repository.owner.login,
        repo_name=repository.name,
        repo_url=repository.html_url,
        repo_branch=repo_branch,
        user=user,
        project_path=project_path,
        scratch_org=scratch_org,
        org_name=org_config_name,
        originating_user_id=originating_user_id,
        sf_username=sf_username,
    )
    scratch_org.refresh_from_db()
    # Save these values on org creation so that we have what we need to
    # delete the org later, even if the initial flow run fails.
    scratch_org.valid_target_directories, _ = get_valid_target_directories(
        user, scratch_org, project_path
    )
    scratch_org.url = scratch_org_config.instance_url
    scratch_org.expires_at = scratch_org_config.expires
    scratch_org.latest_commit = commit.sha
    scratch_org.latest_commit_url = commit.html_url
    scratch_org.latest_commit_at = commit.commit.author.get("date", None)
    scratch_org.config = scratch_org_config.config
    scratch_org.owner_sf_username = sf_username or user.sf_username
    scratch_org.owner_gh_username = user.username
    scratch_org.owner_gh_id = user.github_id
    scratch_org.save()

    cases = {
        "dev": "dev_org",
        "feature": "dev_org",
        "qa": "qa_org",
        "beta": "install_beta",
        "release": "install_prod",
    }
    flow_name = scratch_org_config.setup_flow or cases[org_config_name]

    try:
        run_flow(
            cci=cci,
            org_config=org_config,
            flow_name=flow_name,
            project_path=project_path,
            user=user,
        )
    finally:
        log_path = Path(project_path, ".cumulusci/logs/cci.log")
        if log_path.exists():
            scratch_org.refresh_from_db()
            scratch_org.cci_log = log_path.read_text()
            scratch_org.save()
    scratch_org.refresh_from_db()
    # We don't need to explicitly save the following, because this
    # function is called in a context that will eventually call a
    # finalize_* method, which will save the model.
    scratch_org.last_modified_at = now()
    scratch_org.latest_revision_numbers = get_latest_revision_numbers(
        scratch_org,
        originating_user_id=originating_user_id,
    )
    scratch_org.is_created = True

    scheduler = get_scheduler("default")
    days = settings.DAYS_BEFORE_ORG_EXPIRY_TO_ALERT
    before_expiry = scratch_org.expires_at - timedelta(days=days)
    scratch_org.expiry_job_id = scheduler.enqueue_at(
        before_expiry,
        alert_user_about_expiring_org,
        org=scratch_org,
        days=days,
    ).id


def create_branches_on_github_then_create_scratch_org(
    *, scratch_org, originating_user_id
):
    scratch_org.refresh_from_db()
    user = scratch_org.owner
    task = scratch_org.task
    epic = scratch_org.epic
    parent = scratch_org.parent

    try:
        repo_id = parent.get_repo_id()
        commit_ish = parent.branch_name
        if (task or epic) and not commit_ish:
            commit_ish = _create_branches_on_github(
                user=user,
                repo_id=repo_id,
                epic=task.epic if task else epic,
                task=task,
                originating_user_id=originating_user_id,
            )
        if commit_ish and not task and not parent.latest_sha:
            repository = get_repo_info(user, repo_id=repo_id)
            parent.latest_sha = repository.branch(commit_ish).latest_sha()
            parent.save()
            parent.notify_changed(originating_user_id=originating_user_id)
        with local_github_checkout(user, repo_id, commit_ish) as repo_root:
            _create_org_and_run_flow(
                scratch_org,
                user=user,
                repo_id=repo_id,
                repo_branch=commit_ish,
                project_path=repo_root,
                originating_user_id=originating_user_id,
            )
    except Exception as e:
        scratch_org.finalize_provision(error=e, originating_user_id=originating_user_id)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_provision(originating_user_id=originating_user_id)


create_branches_on_github_then_create_scratch_org_job = job(
    create_branches_on_github_then_create_scratch_org
)


def convert_to_dev_org(scratch_org, *, task, originating_user_id=None):
    """
    Convert an Epic playground org into a Task Dev org
    """
    try:
        task.refresh_from_db()
        scratch_org.refresh_from_db()
        _create_branches_on_github(
            user=scratch_org.owner,
            repo_id=task.get_repo_id(),
            epic=task.epic,
            task=task,
            task_sha=scratch_org.latest_commit,
            originating_user_id=originating_user_id,
        )
    except Exception as e:
        task.refresh_from_db()
        scratch_org.refresh_from_db()
        scratch_org.finalize_convert_to_dev_org(
            task, error=e, originating_user_id=originating_user_id
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_convert_to_dev_org(
            task, originating_user_id=originating_user_id
        )


convert_to_dev_org_job = job(convert_to_dev_org)


def refresh_scratch_org(scratch_org, *, originating_user_id):
    try:
        scratch_org.refresh_from_db()
        user = scratch_org.owner
        repo_id = scratch_org.parent.get_repo_id()
        commit_ish = scratch_org.parent.branch_name
        sf_username = scratch_org.owner_sf_username

        delete_org(scratch_org)

        with local_github_checkout(user, repo_id, commit_ish) as repo_root:
            _create_org_and_run_flow(
                scratch_org,
                user=user,
                repo_id=repo_id,
                repo_branch=commit_ish,
                project_path=repo_root,
                originating_user_id=originating_user_id,
                sf_username=sf_username,
            )
    except Exception as e:
        scratch_org.refresh_from_db()
        scratch_org.finalize_refresh_org(
            error=e, originating_user_id=originating_user_id
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_refresh_org(originating_user_id=originating_user_id)


refresh_scratch_org_job = job(refresh_scratch_org)


def get_unsaved_changes(scratch_org, *, originating_user_id):
    try:
        scratch_org.refresh_from_db()
        old_revision_numbers = scratch_org.latest_revision_numbers
        new_revision_numbers = get_latest_revision_numbers(
            scratch_org, originating_user_id=originating_user_id
        )
        unsaved_changes = compare_revisions(old_revision_numbers, new_revision_numbers)
        user = scratch_org.owner
        repo_id = scratch_org.parent.get_repo_id()
        commit_ish = scratch_org.parent.branch_name
        with local_github_checkout(user, repo_id, commit_ish) as repo_root:
            scratch_org.valid_target_directories, _ = get_valid_target_directories(
                user,
                scratch_org,
                repo_root,
            )
        scratch_org.unsaved_changes = unsaved_changes
    except Exception as e:
        scratch_org.refresh_from_db()
        scratch_org.finalize_get_unsaved_changes(
            error=e, originating_user_id=originating_user_id
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_get_unsaved_changes(
            originating_user_id=originating_user_id
        )


get_unsaved_changes_job = job(get_unsaved_changes)


def commit_changes_from_org(
    *,
    scratch_org,
    user,
    desired_changes,
    commit_message,
    target_directory,
    originating_user_id,
):
    scratch_org.refresh_from_db()
    branch = scratch_org.task.branch_name

    try:
        repo_id = scratch_org.task.get_repo_id()
        commit_changes_to_github(
            user=user,
            scratch_org=scratch_org,
            repo_id=repo_id,
            branch=branch,
            desired_changes=desired_changes,
            commit_message=commit_message,
            target_directory=target_directory,
            originating_user_id=originating_user_id,
        )

        # Update
        repository = get_repo_info(user, repo_id=repo_id)
        commit = repository.branch(branch).commit

        scratch_org.task.refresh_from_db()
        scratch_org.task.add_metecho_git_sha(commit.sha)
        scratch_org.task.has_unmerged_commits = True
        scratch_org.task.finalize_task_update(originating_user_id=originating_user_id)

        scratch_org.refresh_from_db()
        scratch_org.last_modified_at = now()
        scratch_org.latest_commit = commit.sha
        scratch_org.latest_commit_url = commit.html_url
        scratch_org.latest_commit_at = commit.commit.author.get("date", None)

        # Update scratch_org.latest_revision_numbers with appropriate
        # numbers for the values in desired_changes.
        latest_revision_numbers = get_latest_revision_numbers(
            scratch_org, originating_user_id=originating_user_id
        )
        for member_type in desired_changes.keys():
            for member_name in desired_changes[member_type]:
                try:
                    member_type_dict = scratch_org.latest_revision_numbers[member_type]
                except KeyError:
                    member_type_dict = scratch_org.latest_revision_numbers[
                        member_type
                    ] = {}

                # Mutate the scratch_org.latest_revision_numbers dict
                # in-place:
                member_type_dict[member_name] = latest_revision_numbers[member_type][
                    member_name
                ]

        # Finally, update scratch_org.unsaved_changes
        scratch_org.unsaved_changes = compare_revisions(
            scratch_org.latest_revision_numbers, latest_revision_numbers
        )
    except Exception as e:
        scratch_org.refresh_from_db()
        scratch_org.finalize_commit_changes(
            error=e, originating_user_id=originating_user_id
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_commit_changes(originating_user_id=originating_user_id)


commit_changes_from_org_job = job(commit_changes_from_org)


def create_pr(
    instance,
    user,
    *,
    repo_id,
    base,
    head,
    title,
    critical_changes,
    additional_changes,
    issues,
    notes,
    alert_assigned_qa,
    originating_user_id,
):
    try:
        repository = get_repo_info(user, repo_id=repo_id)
        sections = [
            notes,
            "# Critical Changes",
            critical_changes,
            "# Changes",
            additional_changes,
            "# Issues Closed",
            issues,
        ]
        body = "\n\n".join([section for section in sections if section])
        pr = repository.create_pull(title=title, base=base, head=head, body=body)
        instance.refresh_from_db()
        instance.pr_number = pr.number
        instance.pr_is_open = True
        instance.pr_is_merged = False
    except Exception as e:
        instance.refresh_from_db()
        instance.finalize_create_pr(error=e, originating_user_id=originating_user_id)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        instance.finalize_create_pr(
            alert_assigned_qa=alert_assigned_qa,
            originating_user_id=originating_user_id,
        )


create_pr_job = job(create_pr)


def delete_scratch_org(scratch_org, *, originating_user_id):
    try:
        delete_org(scratch_org)
        scratch_org.refresh_from_db()
        scratch_org.delete(originating_user_id=originating_user_id)
    except Exception as e:
        scratch_org.refresh_from_db()
        scratch_org.delete_queued_at = None
        # If the scratch org has no `last_modified_at` or
        # `latest_revision_numbers`, it was being deleted after an
        # unsuccessful initial flow run. In that case, fill in those
        # values so it's not in an in-between state.
        if not scratch_org.last_modified_at:
            scratch_org.last_modified_at = now()
        if not scratch_org.latest_revision_numbers:
            scratch_org.latest_revision_numbers = get_latest_revision_numbers(
                scratch_org,
                originating_user_id=originating_user_id,
            )
        scratch_org.save()
        async_to_sync(report_scratch_org_error)(
            scratch_org,
            error=e,
            type_="SCRATCH_ORG_DELETE_FAILED",
            originating_user_id=originating_user_id,
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise


delete_scratch_org_job = job(delete_scratch_org)


def refresh_github_repositories_for_user(user):
    from .models import GitHubRepository

    try:
        repos = get_all_org_repos(user)
        with transaction.atomic():
            GitHubRepository.objects.filter(user=user).delete()
            GitHubRepository.objects.bulk_create(
                [
                    GitHubRepository(
                        user=user,
                        repo_id=repo.id,
                        repo_url=repo.html_url,
                        permissions=repo.permissions,
                    )
                    for repo in repos
                ]
            )
    except Exception as e:
        user.finalize_refresh_repositories(error=e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        user.finalize_refresh_repositories()


refresh_github_repositories_for_user_job = job(refresh_github_repositories_for_user)


def get_social_image(*, project):
    try:
        repo = get_repo_info(
            None, repo_owner=project.repo_owner, repo_name=project.repo_name
        )
        soup = BeautifulSoup(requests.get(repo.html_url).content, "html.parser")
        og_image = soup.find("meta", property="og:image").attrs.get("content", "")
    except Exception:  # pragma: nocover
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        # Save the image only if it was manually set by the repository owner. GitHub
        # seems to store only manually-set images under this domain:
        if og_image.startswith("https://repository-images.githubusercontent.com/"):
            project.refresh_from_db()
            project.repo_image_url = og_image
            project.finalize_get_social_image()


get_social_image_job = job(get_social_image)


# This avoids partially-applied saving:
@transaction.atomic
def refresh_commits(*, project, branch_name, originating_user_id):
    """
    This should only run when we're notified of a force-commit. It's the
    nuclear option.
    """
    from .models import Epic, Task

    repo = get_repo_info(
        None, repo_owner=project.repo_owner, repo_name=project.repo_name
    )
    # We get this as a GitHubIterator, but we want to slice it later, so
    # we will convert it to a list.
    # We limit it to 1000 commits to avoid hammering the API, and on the
    # assumption that we will find the origin of the task branch within
    # that limit.
    commits = list(repo.commits(repo.branch(branch_name).latest_sha(), number=1000))

    if project.branch_name == branch_name:
        project.latest_sha = commits[0].sha if commits else ""
        project.finalize_project_update(originating_user_id=originating_user_id)

    epics = Epic.objects.filter(project=project, branch_name=branch_name)
    for epic in epics:
        epic.latest_sha = commits[0].sha if commits else ""
        epic.finalize_epic_update(originating_user_id=originating_user_id)

    tasks = Task.objects.filter(epic__project=project, branch_name=branch_name)
    for task in tasks:
        origin_sha_index = [commit.sha for commit in commits].index(task.origin_sha)
        task.commits = [
            normalize_commit(commit) for commit in commits[:origin_sha_index]
        ]
        task.update_has_unmerged_commits()
        task.update_review_valid()
        task.finalize_task_update(originating_user_id=originating_user_id)


refresh_commits_job = job(refresh_commits)


def refresh_github_users(project, *, originating_user_id):
    try:
        project.refresh_from_db()
        repo = get_repo_info(
            None, repo_owner=project.repo_owner, repo_name=project.repo_name
        )
        project.github_users = list(
            sorted(
                [
                    {
                        "id": str(collaborator.id),
                        "login": collaborator.login,
                        "avatar_url": collaborator.avatar_url,
                        "permissions": collaborator.permissions,
                    }
                    for collaborator in repo.collaborators()
                ],
                key=lambda x: x["login"].lower(),
            )
        )

        # Retrieve additional information for each user by querying GitHub
        gh = GitHub(repo)
        expanded_users = []
        for user in project.github_users:
            try:
                full_user = get_cached_user(gh, user["login"])
                expanded = {**user, "name": full_user.name}
            except Exception:
                logger.exception(f"Failed to expand GitHub user {user['login']}")
                expanded = user
            expanded_users.append(expanded)
        project.github_users = expanded_users

    except Exception as e:
        project.finalize_refresh_github_users(
            error=e, originating_user_id=originating_user_id
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        project.finalize_refresh_github_users(originating_user_id=originating_user_id)


refresh_github_users_job = job(refresh_github_users)


def submit_review(*, user, task, data, originating_user_id):
    try:
        review_sha = ""
        org = data["org"]
        notes = data["notes"]
        status = data["status"]
        delete_org = data["delete_org"]

        task.refresh_from_db()
        if org:
            review_sha = org.latest_commit
        elif task.review_valid:
            review_sha = task.review_sha

        if not (task.pr_is_open and review_sha):
            raise TaskReviewIntegrityError(_("Cannot submit review for this Task."))

        repo_id = task.get_repo_id()
        repo_as_user = get_repo_info(user, repo_id=repo_id)
        repo_as_app = get_repo_info(
            None,
            repo_owner=task.root_project.repo_owner,
            repo_name=task.root_project.repo_name,
            repo_id=repo_id,
        )
        pr = repo_as_user.pull_request(task.pr_number)

        # The values in this dict are the valid values for the
        # `state` arg to repository.create_status. We are not
        # currently using all of them, because some of them make no
        # sense for our system to add to GitHub.
        state_for_status = {
            # "": "pending",
            # "": "error",
            TASK_REVIEW_STATUS.Approved: "success",
            TASK_REVIEW_STATUS["Changes requested"]: "failure",
        }.get(status)

        target_url = get_user_facing_url(path=task.get_absolute_url())

        # We filter notes to string.printable to avoid problems
        # GitHub has with emoji in status descriptions
        printable = set(string.printable)
        filtered_notes = "".join(filter(lambda c: c in printable, notes))
        repo_as_app.create_status(
            review_sha,
            state_for_status,
            target_url=target_url,
            description=filtered_notes[:25],
            context="Metecho Review",
        )
        if notes:
            # We always COMMENT so as not to change the PR's status:
            pr.create_review(notes, event="COMMENT")
    except Exception as e:
        task.refresh_from_db()
        task.finalize_submit_review(
            now(), error=e, originating_user_id=originating_user_id
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        task.refresh_from_db()
        task.finalize_submit_review(
            now(),
            sha=review_sha,
            status=status,
            delete_org=delete_org,
            org=org,
            originating_user_id=originating_user_id,
        )


submit_review_job = job(submit_review)


def create_gh_branch_for_new_epic(epic, *, user):
    try:
        epic.refresh_from_db()
        repo_id = epic.get_repo_id()
        repository = get_repo_info(user, repo_id=repo_id)

        if epic.branch_name:
            try:
                head = repository.branch(epic.branch_name).commit.sha
            except NotFoundError:
                latest_sha = repository.branch(repository.default_branch).latest_sha()
                with creating_gh_branch(epic):
                    try_to_make_branch(
                        repository, new_branch=epic.branch_name, base_sha=latest_sha
                    )
                    epic.latest_sha = latest_sha
            else:
                epic.latest_sha = head
                base = repository.branch(repository.default_branch).commit.sha
                epic.has_unmerged_commits = (
                    repository.compare_commits(base, head).ahead_by > 0
                )
                # Check if has PR
                try:
                    head_str = f"{repository.owner}:{epic.branch_name}"
                    # Defaults to descending order, so we'll find
                    # the most recent one, if there is one to be
                    # found:
                    pr = next(
                        repository.pull_requests(
                            state="all", head=head_str, base=repository.default_branch
                        )
                    )
                    # Check PR status
                    epic.pr_number = pr.number
                    epic.pr_is_merged = pr.merged_at is not None
                    epic.pr_is_open = pr.closed_at is None and pr.merged_at is None
                except StopIteration:
                    pass
        else:
            epic_create_branch(
                epic=epic,
                repository=repository,
                user=user,
                originating_user_id=str(user.id),
                should_finalize=False,
            )
    except Exception:
        epic.refresh_from_db()
        epic.branch_name = ""
        epic.latest_sha = ""
        epic.pr_number = None
        epic.pr_is_merged = False
        epic.pr_is_open = False
        epic.has_unmerged_commits = False
        epic.finalize_epic_update(originating_user_id=str(user.id))
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        epic.finalize_epic_update(originating_user_id=str(user.id))


create_gh_branch_for_new_epic_job = job(create_gh_branch_for_new_epic)


def available_org_config_names(project, *, user):
    try:
        project.refresh_from_db()
        repo_id = project.get_repo_id()
        repo = get_repo_info(
            None,
            repo_owner=project.repo_owner,
            repo_name=project.repo_name,
        )
        with local_github_checkout(user, repo_id) as repo_root:
            config = get_project_config(
                repo_root=repo_root,
                repo_name=repo.name,
                repo_url=repo.html_url,
                repo_owner=repo.owner.login,
                repo_branch=repo.default_branch,
                repo_commit=repo.branch(repo.default_branch).latest_sha(),
            )
            project.org_config_names = [
                {"key": key, **value} for key, value in config.orgs__scratch.items()
            ]
    except Exception:
        project.finalize_available_org_config_names(
            originating_user_id=str(user.id) if user else None
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        project.finalize_available_org_config_names(
            originating_user_id=str(user.id) if user else None
        )


available_org_config_names_job = job(available_org_config_names)


def user_reassign(scratch_org, *, new_user, originating_user_id):
    try:
        scratch_org.refresh_from_db()
        scratch_org.owner = new_user
        org_config = scratch_org.get_refreshed_org_config()
        username = org_config.username
        org_config.salesforce_client.User.update(
            f"Username/{username}",
            {"Email": new_user.email},
        )
    except Exception as err:
        scratch_org.finalize_reassign(
            error=err, originating_user_id=originating_user_id
        )
    else:
        scratch_org.finalize_reassign(originating_user_id=originating_user_id)


user_reassign_job = job(user_reassign)
