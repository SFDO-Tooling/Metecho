import logging
import traceback

from asgiref.sync import async_to_sync
from django.db import transaction
from django.utils.text import slugify
from django.utils.timezone import now
from django_rq import job

from .gh import (
    get_cumulus_prefix,
    get_repo_info,
    local_github_checkout,
    try_to_make_branch,
)
from .push import report_scratch_org_error
from .sf_org_changes import (
    commit_changes_to_github,
    compare_revisions,
    get_latest_revision_numbers,
)
from .sf_run_flow import create_org, delete_org, run_flow

logger = logging.getLogger(__name__)


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
        task.finalize_task_update()

    return task_branch_name


def _create_org_and_run_flow(scratch_org, *, user, repo_id, repo_branch, project_path):
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
    scratch_org.owner_sf_id = user.sf_username
    scratch_org.save()
    run_flow(
        cci=cci,
        org_config=org_config,
        flow_name=cases[scratch_org.org_type],
        project_path=project_path,
    )
    scratch_org.refresh_from_db()
    scratch_org.last_modified_at = now()
    scratch_org.latest_revision_numbers = get_latest_revision_numbers(scratch_org)


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
    task, user, *, title, critical_changes, additional_changes, issues, notes
):
    try:
        repo_id = task.project.repository.get_repo_id(user)
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
        pr = repository.create_pull(
            title=title, base=task.project.branch_name, head=task.branch_name, body=body
        )
        task.refresh_from_db()
        task.pr_number = pr.number
    except Exception as e:
        task.refresh_from_db()
        task.finalize_create_pr(e)
        tb = traceback.format_exc()
        logger.error(tb)
        raise
    else:
        task.finalize_create_pr()


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


def _commit_to_json(commit):
    return {
        "sha": commit.sha,
        "author": {
            "avatar_url": commit.author.avatar_url if commit.author else "",
            "login": commit.author.login if commit.author else "",
        },
        "committer": {
            "avatar_url": commit.committer.avatar_url if commit.committer else "",
            "login": commit.committer.login if commit.committer else "",
        },
        "message": commit.message,
    }


# This avoids partially-applied saving:
@transaction.atomic
def refresh_commits(*, user, repository):
    repo = get_repo_info(user, repository.repo_id)

    projects = repository.projects.filter(branch_name__isnull=False)
    for project in projects:
        branch = repo.branch(project.branch_name)
        project.commits = [
            _commit_to_json(commit) for commit in repo.commits(sha=branch.latest_sha())
        ]
        project.save()
        project.finalize_branch_update()

        tasks = project.tasks.filter(branch_name__isnull=False)
        for task in tasks:
            branch = repo.branch(task.branch_name)
            task.commits = [
                _commit_to_json(commit)
                for commit in repo.commits(sha=branch.latest_sha())
            ]
            task.save()
            task.finalize_branch_update()


refresh_commits_job = job(refresh_commits)
