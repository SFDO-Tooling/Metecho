import contextlib
import logging
import traceback

from asgiref.sync import async_to_sync
from cumulusci.core import flowrunner
from cumulusci.core.config import ScratchOrgConfig
from django.utils.text import slugify
from django.utils.timezone import now
from django_rq import job
from github3 import login
from github3.exceptions import UnprocessableEntity

from .custom_cci_configs import MetaShareCCI
from .github_context import (
    extract_owner_and_repo,
    get_cumulus_prefix,
    local_github_checkout,
)
from .push import push_message_about_instance

logger = logging.getLogger(__name__)


async def report_scratch_org_error(instance, message):
    from .serializers import ScratchOrgSerializer

    message = {
        "type": "SCRATCH_ORG_PROVISION_FAILED",
        "payload": {"message": message, "model": ScratchOrgSerializer(instance).data},
    }
    await push_message_about_instance(instance, message)


@contextlib.contextmanager
def report_errors_on(scratch_org):
    try:
        yield
    except Exception as e:
        async_to_sync(report_scratch_org_error)(scratch_org, str(e))
        tb = traceback.format_exc()
        logger.error(tb)
        scratch_org.delete()
        raise


def create_scratch_org(*, scratch_org, user, repo_url, commit_ish):
    """
    Expects to be called in the context of a local github checkout.
    """
    gh = login(token=user.gh_token)
    owner, repo = extract_owner_and_repo(repo_url)
    repository = gh.repository(owner, repo)
    branch = repository.branch(commit_ish)
    commit = branch.commit
    latest_commit = commit.sha
    latest_commit_url = commit.html_url
    latest_commit_at = commit.commit.author.get("date", None)

    with report_errors_on(scratch_org):
        org_config = ScratchOrgConfig(
            {"config_file": "orgs/dev.json", "scratch": True}, "dev"
        )
        org_config.create_org()
        # We just need to access this property to pull down info from SF
        # as a side-effect.
        org_config.scratch_info
        # TODO: We should actually just save all of org_config.config as
        # json to the model, and use it to re-hydrate the
        # ScratchOrgConfig as-needed.
        scratch_org.url = org_config.instance_url
        scratch_org.last_modified_at = now()
        scratch_org.expires_at = org_config.expires
        scratch_org.latest_commit = latest_commit
        scratch_org.latest_commit_url = latest_commit_url
        scratch_org.latest_commit_at = latest_commit_at
        scratch_org.config = org_config.config
        scratch_org.save()

        return org_config


def try_to_make_branch(repository, *, new_branch, base_branch):
    branch_name = new_branch
    counter = 0
    while True:
        try:
            latest_sha = repository.branch(base_branch).latest_sha()
            repository.create_branch_ref(branch_name, latest_sha)
            return branch_name
        except UnprocessableEntity:
            counter += 1
            branch_name = f"{new_branch}-{counter}"


def create_branches_on_github(*, user, repo_url, project, task, repo_root):
    """
    Expects to be called in the context of a local github checkout.
    """
    gh = login(token=user.gh_token)
    owner, repo = extract_owner_and_repo(repo_url)
    repository = gh.repository(owner, repo)

    # Make project branch:
    if project.branch_name:
        project_branch_name = project.branch_name
    else:
        prefix = get_cumulus_prefix(
            repo_root=repo_root,
            repo_name="Repo Name",  # A placeholder, not used.
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

    # Make task branch:
    if task.branch_name:
        task_branch_name = task.branch_name
    else:
        task_branch_name = try_to_make_branch(
            repository,
            new_branch=f"{project_branch_name}__{slugify(task.name)}",
            base_branch=project_branch_name,
        )
        task.branch_name = task_branch_name

    project.save()
    task.save()

    return task_branch_name


def run_appropriate_flow(
    scratch_org, *, user, repo_root, repo_url, repo_branch, org_config
):
    # TODO: I hope this function is right, but I am not whether it is or
    # how to meaningfully test it!
    from .models import SCRATCH_ORG_TYPES

    cases = {SCRATCH_ORG_TYPES.Dev: "dev_org", SCRATCH_ORG_TYPES.QA: "qa_org"}

    gh = login(token=user.gh_token)
    owner, repo = extract_owner_and_repo(repo_url)
    repository = gh.repository(owner, repo)
    cci = MetaShareCCI(
        repo_root=repo_root,
        repo_name="Repo Name",  # A placeholder, not used.
        repo_url=repo_url,
        repo_owner=owner,
        repo_branch=repo_branch,
        repo_commit=repository.branch(repo_branch).latest_sha(),
    )
    flow_config = cci.get_flow(cases[scratch_org.org_type])
    flowrunner.FlowCoordinator(cci.project_config, flow_config).run(org_config)


def create_branches_on_github_then_create_scratch_org(
    *, project, repo_url, scratch_org, task, user
):
    with local_github_checkout(user, repo_url) as repo_root:
        commit_ish = create_branches_on_github(
            user=user,
            repo_url=repo_url,
            project=project,
            task=task,
            repo_root=repo_root,
        )
        org_config = create_scratch_org(
            scratch_org=scratch_org, user=user, repo_url=repo_url, commit_ish=commit_ish
        )
        run_appropriate_flow(
            scratch_org,
            user=user,
            repo_root=repo_root,
            repo_url=repo_url,
            repo_branch=task.branch_name,
            org_config=org_config,
        )


create_branches_on_github_then_create_scratch_org_job = job(
    create_branches_on_github_then_create_scratch_org
)
