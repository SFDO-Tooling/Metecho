import logging
import string
import traceback
from datetime import timedelta
from pathlib import Path

import requests
from asgiref.sync import async_to_sync
from bs4 import BeautifulSoup
from django.conf import settings
from django.contrib.sites.models import Site
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.text import slugify
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from django_rq import get_scheduler, job
from furl import furl
from github3.exceptions import NotFoundError

from .gh import (
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


def get_user_facing_url(*, path):
    domain = Site.objects.first().domain
    should_be_http = not settings.SECURE_SSL_REDIRECT or domain.startswith("localhost")
    scheme = "http" if should_be_http else "https"
    return furl(f"{scheme}://{domain}").set(path=path).url


def project_create_branch(
    *, user, project, repository, repo_id, originating_user_id, should_finalize=True,
):
    if project.branch_name:
        project_branch_name = project.branch_name
    else:
        branch_prefix = project.repository.branch_prefix
        if branch_prefix:
            prefix = branch_prefix
        elif settings.BRANCH_PREFIX:
            prefix = settings.BRANCH_PREFIX
        else:
            with local_github_checkout(user, repo_id) as repo_root:
                prefix = get_cumulus_prefix(
                    repo_root=repo_root,
                    repo_name=repository.name,
                    repo_url=repository.html_url,
                    repo_owner=repository.owner.login,
                    repo_branch=repository.default_branch,
                    repo_commit=repository.branch(
                        repository.default_branch
                    ).latest_sha(),
                )
        project_branch_name = f"{prefix}{slugify(project.name)}"
        project_branch_name = try_to_make_branch(
            repository,
            new_branch=project_branch_name,
            base_branch=repository.default_branch,
        )
        project.branch_name = project_branch_name
        if should_finalize:
            project.finalize_project_update(originating_user_id=originating_user_id)
    return project_branch_name


def _create_branches_on_github(*, user, repo_id, project, task, originating_user_id):
    """
    Expects to be called in the context of a local github checkout.
    """
    repository = get_repo_info(user, repo_id=repo_id)

    # Make project branch, with latest from project:
    project.refresh_from_db()
    project_branch_name = project_create_branch(
        project=project,
        repository=repository,
        user=user,
        repo_id=repo_id,
        originating_user_id=originating_user_id,
    )
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
        task.origin_sha = repository.branch(project_branch_name).latest_sha()
        task.finalize_task_update(originating_user_id=originating_user_id)

    return task_branch_name


def alert_user_about_expiring_org(*, org, days):
    from .models import User, ScratchOrg

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
        project = task.project
        repo = project.repository
        metecho_link = get_user_facing_url(
            path=["repositories", repo.slug, project.slug, task.slug]
        )

        # email user
        subject = _("Metecho Scratch Org Expiring with Uncommitted Changes")
        body = render_to_string(
            "scratch_org_expiry_email.txt",
            {
                "repo_name": repo.name,
                "project_name": project.name,
                "task_name": task.name,
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
    repository = get_repo_info(user, repo_id=repo_id)
    commit = repository.branch(repo_branch).commit

    scratch_org_config, cci, org_config = create_org(
        repo_owner=repository.owner.login,
        repo_name=repository.name,
        repo_url=repository.html_url,
        repo_branch=repo_branch,
        user=user,
        project_path=project_path,
        scratch_org=scratch_org,
        org_name=scratch_org.task.org_config_name,
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
    scratch_org.save()

    cases = {
        "dev": "dev_org",
        "feature": "dev_org",
        "qa": "qa_org",
        "beta": "install_beta",
        "release": "install_prod",
    }
    flow_name = scratch_org_config.setup_flow or cases[scratch_org.task.org_config_name]

    try:
        run_flow(
            cci=cci,
            org_config=org_config,
            flow_name=flow_name,
            project_path=project_path,
            user=user,
        )
    finally:
        if Path(".cumulusci/logs/cci.log").exists():
            scratch_org.refresh_from_db()
            scratch_org.cci_logs = Path(".cumulusci/logs/cci.log").read_text()
            scratch_org.save()
    scratch_org.refresh_from_db()
    # We don't need to explicitly save the following, because this
    # function is called in a context that will eventually call a
    # finalize_* method, which will save the model.
    scratch_org.last_modified_at = now()
    scratch_org.latest_revision_numbers = get_latest_revision_numbers(
        scratch_org, originating_user_id=originating_user_id,
    )
    scratch_org.is_created = True

    scheduler = get_scheduler("default")
    days = settings.DAYS_BEFORE_ORG_EXPIRY_TO_ALERT
    before_expiry = scratch_org.expires_at - timedelta(days=days)
    scratch_org.expiry_job_id = scheduler.enqueue_at(
        before_expiry, alert_user_about_expiring_org, org=scratch_org, days=days,
    ).id


def create_branches_on_github_then_create_scratch_org(
    *, scratch_org, originating_user_id
):
    scratch_org.refresh_from_db()
    user = scratch_org.owner
    task = scratch_org.task
    project = task.project

    try:
        repo_id = task.get_repo_id(user)
        commit_ish = _create_branches_on_github(
            user=user,
            repo_id=repo_id,
            project=project,
            task=task,
            originating_user_id=originating_user_id,
        )
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


def refresh_scratch_org(scratch_org, *, originating_user_id):
    try:
        scratch_org.refresh_from_db()
        user = scratch_org.owner
        repo_id = scratch_org.task.get_repo_id(user)
        commit_ish = scratch_org.task.branch_name
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
        repo_id = scratch_org.task.get_repo_id(user)
        commit_ish = scratch_org.task.branch_name
        with local_github_checkout(user, repo_id, commit_ish) as repo_root:
            scratch_org.valid_target_directories, _ = get_valid_target_directories(
                user, scratch_org, repo_root,
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
        repo_id = scratch_org.task.get_repo_id(user)
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
        scratch_org.task.add_ms_git_sha(commit.sha)
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
    alert_assigned_dev,
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
            alert_assigned_dev=alert_assigned_dev,
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
                scratch_org, originating_user_id=originating_user_id,
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
    user.refresh_repositories()


refresh_github_repositories_for_user_job = job(refresh_github_repositories_for_user)


def get_social_image(*, repository, user):
    try:
        repo_id = repository.get_repo_id(user)
        repo = get_repo_info(user, repo_id=repo_id)
        soup = BeautifulSoup(requests.get(repo.html_url).content, "html.parser")
        og_image = soup.find("meta", property="og:image").attrs.get("content", "")
    except Exception:  # pragma: nocover
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        repository.refresh_from_db()
        repository.repo_image_url = og_image
        repository.finalize_get_social_image()


get_social_image_job = job(get_social_image)


# This avoids partially-applied saving:
@transaction.atomic
def refresh_commits(*, repository, branch_name, originating_user_id):
    """
    This should only run when we're notified of a force-commit. It's the
    nuclear option.
    """
    from .models import Task

    user = repository.get_a_matching_user()
    if user is None:
        logger.warning(f"No matching user for repository {repository.pk}")
        return
    repo_id = repository.get_repo_id(user)
    repo = get_repo_info(user, repo_id=repo_id)
    # We get this as a GitHubIterator, but we want to slice it later, so
    # we will convert it to a list.
    # We limit it to 1000 commits to avoid hammering the API, and on the
    # assumption that we will find the origin of the task branch within
    # that limit.
    commits = list(repo.commits(repo.branch(branch_name).latest_sha(), number=1000))

    tasks = Task.objects.filter(project__repository=repository, branch_name=branch_name)
    for task in tasks:
        origin_sha_index = [commit.sha for commit in commits].index(task.origin_sha)
        task.commits = [
            normalize_commit(commit) for commit in commits[:origin_sha_index]
        ]
        task.update_has_unmerged_commits(user=user)
        task.update_review_valid()
        task.finalize_task_update(originating_user_id=originating_user_id)


refresh_commits_job = job(refresh_commits)


def populate_github_users(repository, *, originating_user_id):
    try:
        user = repository.get_a_matching_user()
        if user is None:
            logger.warning(f"No matching user for repository {repository.pk}")
            return
        repo_id = repository.get_repo_id(user)
        repo = get_repo_info(user, repo_id=repo_id)
        repository.refresh_from_db()
        repository.github_users = list(
            sorted(
                [
                    {
                        "id": str(collaborator.id),
                        "login": collaborator.login,
                        "avatar_url": collaborator.avatar_url,
                    }
                    for collaborator in repo.collaborators()
                ],
                key=lambda x: x["login"].lower(),
            )
        )
    except Exception as e:
        repository.finalize_populate_github_users(
            error=e, originating_user_id=originating_user_id
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        repository.finalize_populate_github_users(
            originating_user_id=originating_user_id
        )


populate_github_users_job = job(populate_github_users)


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
            raise TaskReviewIntegrityError(_("Cannot submit review for this task."))

        repo_id = task.get_repo_id(user)
        repository = get_repo_info(user, repo_id=repo_id)
        pr = repository.pull_request(task.pr_number)

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

        target_url = get_user_facing_url(
            path=[
                "repositories",
                task.project.repository.slug,
                task.project.slug,
                task.slug,
            ]
        )

        # We filter notes to string.printable to avoid problems
        # GitHub has with emoji in status descriptions
        printable = set(string.printable)
        filtered_notes = "".join(filter(lambda c: c in printable, notes))
        repository.create_status(
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


def create_gh_branch_for_new_project(project, *, user):
    try:
        project.refresh_from_db()
        repo_id = project.get_repo_id(user)
        repository = get_repo_info(user, repo_id=repo_id)

        if project.branch_name:
            try:
                head = repository.branch(project.branch_name).commit.sha
            except NotFoundError:
                try_to_make_branch(
                    repository,
                    new_branch=project.branch_name,
                    base_branch=repository.default_branch,
                )
            else:
                base = repository.branch(repository.default_branch).commit.sha
                project.has_unmerged_commits = (
                    repository.compare_commits(base, head).ahead_by > 0
                )
                # Check if has PR
                try:
                    head_str = f"{repository.owner}:{project.branch_name}"
                    # Defaults to descending order, so we'll find
                    # the most recent one, if there is one to be
                    # found:
                    pr = next(
                        repository.pull_requests(
                            state="all", head=head_str, base=repository.default_branch
                        )
                    )
                    # Check PR status
                    project.pr_number = pr.number
                    project.pr_is_merged = pr.merged_at is not None
                    project.pr_is_open = pr.closed_at is None and pr.merged_at is None
                except StopIteration:
                    pass
        else:
            project_create_branch(
                project=project,
                repository=repository,
                repo_id=repo_id,
                user=user,
                originating_user_id=str(user.id),
                should_finalize=False,
            )
    except Exception:
        project.refresh_from_db()
        project.branch_name = ""
        project.pr_number = None
        project.pr_is_merged = False
        project.pr_is_open = False
        project.has_unmerged_commits = False
        project.finalize_project_update(originating_user_id=str(user.id))
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        project.finalize_project_update(originating_user_id=str(user.id))


create_gh_branch_for_new_project_job = job(create_gh_branch_for_new_project)


def available_task_org_config_names(project, *, user):
    try:
        project.refresh_from_db()
        repo_id = project.get_repo_id(user)
        repository = get_repo_info(user, repo_id=repo_id)
        with local_github_checkout(user, repo_id) as repo_root:
            config = get_project_config(
                repo_root=repo_root,
                repo_name=repository.name,
                repo_url=repository.html_url,
                repo_owner=repository.owner.login,
                repo_branch=project.branch_name,
                repo_commit=repository.branch(project.branch_name).latest_sha(),
            )
            project.available_task_org_config_names = [
                {"key": key, **value} for key, value in config.orgs__scratch.items()
            ]
    except Exception:
        project.finalize_available_task_org_config_names(
            originating_user_id=str(user.id)
        )
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        project.finalize_available_task_org_config_names(
            originating_user_id=str(user.id)
        )


available_task_org_config_names_job = job(available_task_org_config_names)
