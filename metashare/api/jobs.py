from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.runtime import BaseCumulusCI
from django_rq import job
from github3 import login

from .sf_scratch_orgs import extract_user_and_repo, make_scratch_org


class MetadeployProjectConfig(BaseProjectConfig):
    def __init__(
        self, *args, repo_root=None, repo_url=None, commit_ish=None, **kwargs
    ):  # pragma: nocover

        user, repo_name = extract_user_and_repo(repo_url)

        repo_info = {
            "root": repo_root,
            "url": repo_url,
            "name": repo_name,
            "owner": user,
            "commit": commit_ish,
        }

        super().__init__(*args, repo_info=repo_info, **kwargs)


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig


def create_scratch_org(scratch_org, *, user, repo_url, commit_ish):
    # We will eventually use scratch_org and user, but not yet.
    make_scratch_org(repo_url, commit_ish)


create_scratch_org_job = job(create_scratch_org)


def create_branches_on_github(*, user, repo_url, project_branch_name, task_branch_name):
    gh = login(token=user.gh_token)
    user, repo = extract_user_and_repo(repo_url)
    repository = gh.repository(user, repo)
    # Make project branch:
    repository.create_branch_ref(
        project_branch_name, repository.branch(repository.default_branch).latest_sha()
    )
    # Make task branch:
    repository.create_branch_ref(
        task_branch_name, repository.branch(project_branch_name).latest_sha()
    )


create_branches_on_github_job = job(create_branches_on_github)
