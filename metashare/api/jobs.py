from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.runtime import BaseCumulusCI
from django_rq import job

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
