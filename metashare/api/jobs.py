import contextlib
import logging
import traceback

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from cumulusci.core.config import BaseProjectConfig, ScratchOrgConfig
from cumulusci.core.runtime import BaseCumulusCI
from django.utils.text import slugify
from django.utils.timezone import now
from django_rq import job
from github3 import login
from github3.exceptions import UnprocessableEntity

from .github_context import (
    extract_owner_and_repo,
    get_cumulus_prefix,
    local_github_checkout,
)

logger = logging.getLogger(__name__)


def report_scratch_org_error(instance, message):
    from .serializers import ScratchOrgSerializer

    message = {
        "type": "SCRATCH_ORG_PROVISION_FAILED",
        "payload": {"message": message, "model": ScratchOrgSerializer(instance).data},
    }
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = "{model}.{id}".format(model=model_name, id=id)
    channel_layer = get_channel_layer()
    sent_message = {"type": "notify", "group": group_name, "content": message}
    async_to_sync(channel_layer.group_send(group_name, sent_message))


@contextlib.contextmanager
def report_errors_on(scratch_org):
    try:
        yield
    except Exception as e:
        report_scratch_org_error(scratch_org, str(e))
        tb = traceback.format_exc()
        logger.error(tb)
        raise


class MetadeployProjectConfig(BaseProjectConfig):
    def __init__(
        self, *args, repo_root=None, repo_url=None, commit_ish=None, **kwargs
    ):  # pragma: nocover

        owner, repo_name = extract_owner_and_repo(repo_url)

        repo_info = {
            "root": repo_root,
            "url": repo_url,
            "name": repo_name,
            "owner": owner,
            "commit": commit_ish,
        }

        super().__init__(*args, repo_info=repo_info, **kwargs)


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig


def create_scratch_org(*, scratch_org, user, repo_url, commit_ish):
    """
    Expects to be called in the context of a local github checkout.
    """
    gh = login(token=user.gh_token)
    owner, repo = extract_owner_and_repo(repo_url)
    repository = gh.repository(owner, repo)
    branch = repository.branch(commit_ish)
    latest_commit = branch.latest_sha()
    # We can't use the urlt objects in repository because they build API urls:
    latest_commit_url = f"{repository.html_url}/commit/{latest_commit}"

    with report_errors_on(scratch_org):
        org = ScratchOrgConfig({"config_file": "orgs/dev.json", "scratch": True}, "dev")
        org.create_org()
        scratch_org.url = org.instance_url
        scratch_org.last_modified_at = now()
        scratch_org.expires_at = org.expires
        scratch_org.latest_commit = latest_commit
        scratch_org.latest_commit_url = latest_commit_url
        scratch_org.save()


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
    prefix = get_cumulus_prefix(
        repo_root=repo_root,
        repo_name="Repo Name",
        repo_url=repo_url,
        repo_owner=owner,
        repo_branch=repository.default_branch,
        repo_commit=repository.branch(repository.default_branch).latest_sha(),
    )
    project_branch_name = f"{prefix}{slugify(project.name)}"
    if project.branch_name:
        project_branch_name = project.branch_name
    else:
        project_branch_name = try_to_make_branch(
            repository,
            new_branch=project_branch_name,
            base_branch=repository.default_branch,
        )
        project.branch_name = project_branch_name

    # Make task branch:
    if not task.branch_name:
        task_branch_name = try_to_make_branch(
            repository,
            new_branch=f"{project_branch_name}__{slugify(task.name)}",
            base_branch=project_branch_name,
        )
        task.branch_name = task_branch_name

    project.save()
    task.save()


@job
def create_branches_on_github_then_create_scratch_org_job(
    *, project, repo_url, scratch_org, task, user, commit_ish
):  # pragma: nocover
    with local_github_checkout(user, repo_url, commit_ish) as repo_root:
        create_branches_on_github(
            user=user,
            repo_url=repo_url,
            project=project,
            task=task,
            repo_root=repo_root,
        )
        create_scratch_org(
            scratch_org=scratch_org, user=user, repo_url=repo_url, commit_ish=commit_ish
        )
