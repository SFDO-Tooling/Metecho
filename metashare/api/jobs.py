import logging
import string
import traceback
from datetime import timedelta

from asgiref.sync import async_to_sync
from django.conf import settings
from django.contrib.sites.models import Site
from django.core.mail import send_mail
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.text import slugify
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from django_rq import get_scheduler, job
from furl import furl

from .gh import (
    get_cumulus_prefix,
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


def _create_branches_on_github(*, user, repo_id, project, task):
    """
    Expects to be called in the context of a local github checkout.
    """
    repository = get_repo_info(user, repo_id=repo_id)

    # Make project branch, with latest from project:
    project.refresh_from_db()
    if project.branch_name:
        project_branch_name = project.branch_name
    else:
        with local_github_checkout(user, repo_id) as repo_root:
            prefix = get_cumulus_prefix(
                repo_root=repo_root,
                repo_name=repository.name,
                repo_url=repository.html_url,
                repo_owner=repository.owner.login,
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
        project.finalize_project_update()

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
        task.finalize_task_update()

    return task_branch_name


def alert_user_about_expiring_org(*, org, days):
    from .models import User, ScratchOrg

    # if scratch org is there
    try:
        org.refresh_from_db()
        user = org.owner
        user.refresh_from_db()
    except (ScratchOrg.DoesNotExist, User.DoesNotExist):
        return

    # and has unsaved changes
    get_unsaved_changes(org)
    if org.unsaved_changes:
        task = org.task
        project = task.project
        repo = project.repository
        metashare_link = get_user_facing_url(
            path=["repositories", repo.slug, project.slug, task.slug]
        )

        # email user
        send_mail(
            _("MetaShare Scratch Org Expiring with Uncommitted Changes"),
            render_to_string(
                "scratch_org_expiry_email.txt",
                {
                    "repo_name": repo.name,
                    "project_name": project.name,
                    "task_name": task.name,
                    "days": days,
                    "expiry_date": org.expires_at,
                    "user_name": user.username,
                    "metashare_link": metashare_link,
                },
            ),
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


def _create_org_and_run_flow(
    scratch_org, *, user, repo_id, repo_branch, project_path, sf_username=None
):
    from .models import SCRATCH_ORG_TYPES

    cases = {SCRATCH_ORG_TYPES.Dev: "dev_org", SCRATCH_ORG_TYPES.QA: "qa_org"}

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
        sf_username=sf_username,
    )
    scratch_org.refresh_from_db()
    # Save these values on org creation so that we have what we need to
    # delete the org later, even if the initial flow run fails.
    scratch_org.url = scratch_org_config.instance_url
    scratch_org.expires_at = scratch_org_config.expires
    scratch_org.latest_commit = commit.sha
    scratch_org.latest_commit_url = commit.html_url
    scratch_org.latest_commit_at = commit.commit.author.get("date", None)
    scratch_org.config = scratch_org_config.config
    scratch_org.owner_sf_username = sf_username or user.sf_username
    scratch_org.owner_gh_username = user.username
    scratch_org.save()
    run_flow(
        cci=cci,
        org_config=org_config,
        flow_name=cases[scratch_org.org_type],
        project_path=project_path,
    )
    scratch_org.refresh_from_db()
    # We don't need to explicitly save the following, because this
    # function is called in a context that will eventually call a
    # finalize_* method, which will save the model.
    scratch_org.last_modified_at = now()
    scratch_org.latest_revision_numbers = get_latest_revision_numbers(scratch_org)

    scheduler = get_scheduler("default")
    days = settings.DAYS_BEFORE_ORG_EXPIRY_TO_ALERT
    before_expiry = scratch_org.expires_at - timedelta(days=days)
    scratch_org.expiry_job_id = scheduler.enqueue_at(
        before_expiry, alert_user_about_expiring_org, org=scratch_org, days=days,
    ).id


def create_branches_on_github_then_create_scratch_org(*, scratch_org):
    scratch_org.refresh_from_db()
    user = scratch_org.owner
    task = scratch_org.task
    project = task.project

    try:
        repo_id = project.repository.get_repo_id(user)
        commit_ish = _create_branches_on_github(
            user=user, repo_id=repo_id, project=project, task=task
        )
        with local_github_checkout(user, repo_id, commit_ish) as repo_root:
            _create_org_and_run_flow(
                scratch_org,
                user=user,
                repo_id=repo_id,
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


def refresh_scratch_org(scratch_org):
    try:
        scratch_org.refresh_from_db()
        user = scratch_org.owner
        repo_id = scratch_org.task.project.repository.get_repo_id(user)
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
                sf_username=sf_username,
            )
    except Exception as e:
        scratch_org.refresh_from_db()
        scratch_org.finalize_refresh_org(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_refresh_org()


refresh_scratch_org_job = job(refresh_scratch_org)


def get_unsaved_changes(scratch_org):
    try:
        scratch_org.refresh_from_db()
        old_revision_numbers = scratch_org.latest_revision_numbers
        new_revision_numbers = get_latest_revision_numbers(scratch_org)
        unsaved_changes = compare_revisions(old_revision_numbers, new_revision_numbers)
        scratch_org.refresh_from_db()
        scratch_org.unsaved_changes = unsaved_changes
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
    scratch_org.refresh_from_db()
    branch = scratch_org.task.branch_name

    try:
        repo_id = scratch_org.task.project.repository.get_repo_id(user)
        commit_changes_to_github(
            user=user,
            scratch_org=scratch_org,
            repo_id=repo_id,
            branch=branch,
            desired_changes=desired_changes,
            commit_message=commit_message,
        )

        # Update
        repository = get_repo_info(user, repo_id=repo_id)
        commit = repository.branch(branch).commit

        scratch_org.task.refresh_from_db()
        scratch_org.task.add_ms_git_sha(commit.sha)
        scratch_org.task.has_unmerged_commits = True
        scratch_org.task.finalize_task_update()

        scratch_org.refresh_from_db()
        scratch_org.last_modified_at = now()
        scratch_org.latest_commit = commit.sha
        scratch_org.latest_commit_url = commit.html_url
        scratch_org.latest_commit_at = commit.commit.author.get("date", None)

        # Update scratch_org.latest_revision_numbers with appropriate
        # numbers for the values in desired_changes.
        latest_revision_numbers = get_latest_revision_numbers(scratch_org)
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
        scratch_org.finalize_commit_changes(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        scratch_org.finalize_commit_changes()


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
    except Exception as e:
        instance.refresh_from_db()
        instance.finalize_create_pr(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        instance.finalize_create_pr()


create_pr_job = job(create_pr)


def delete_scratch_org(scratch_org):
    try:
        delete_org(scratch_org)
        scratch_org.delete()
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
                scratch_org
            )
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


# This avoids partially-applied saving:
@transaction.atomic
def refresh_commits(*, repository, branch_name):
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
        task.update_review_valid()
        task.finalize_task_update()


refresh_commits_job = job(refresh_commits)


def populate_github_users(repository):
    try:
        user = repository.get_a_matching_user()
        if user is None:
            logger.warning(f"No matching user for repository {repository.pk}")
            return
        repo_id = repository.get_repo_id(user)
        repo = get_repo_info(user, repo_id=repo_id)
        repository.refresh_from_db()
        repository.github_users = [
            {
                "id": str(collaborator.id),
                "login": collaborator.login,
                "avatar_url": collaborator.avatar_url,
            }
            for collaborator in repo.collaborators()
        ]
    except Exception as e:
        repository.refresh_from_db()
        repository.finalize_populate_github_users(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        repository.finalize_populate_github_users()


populate_github_users_job = job(populate_github_users)


def submit_review(*, user, task, data):
    try:
        review_sha = None
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

        repo_id = task.project.repository.get_repo_id(user)
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
            context="MetaShare Review",
        )
        if notes:
            # We always COMMENT so as not to change the PR's status:
            pr.create_review(notes, event="COMMENT")
    except Exception as e:
        task.refresh_from_db()
        task.finalize_submit_review(now(), err=e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        task.refresh_from_db()
        task.finalize_submit_review(
            now(), sha=review_sha, status=status, delete_org=delete_org, org=org,
        )


submit_review_job = job(submit_review)
