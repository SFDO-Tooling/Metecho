from cumulusci.core.config import BaseGlobalConfig, BaseProjectConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.salesforce_api.utils import get_simple_salesforce_connection

from .github_context import extract_owner_and_repo, local_github_checkout
from .sf_run_flow import refresh_access_token

# class DbBaseProjectConfig(BaseProjectConfig):
#     pass


# class DbBaseCumulusCI(BaseCumulusCI):
#     project_config_class = DbBaseProjectConfig


def get_salesforce_connection(
    *,
    repo_url,
    repo_owner,
    repo_name,
    repo_branch,
    user,
    # project_path,
    config,
    login_url,
    base_url="",
):
    org_name = "dev"

    cci = BaseCumulusCI(
        repo_info={
            # "root": project_path,
            "url": repo_url,
            "name": repo_name,
            "owner": repo_owner,
            "commit": repo_branch,
        },
        config=config,
    )
    org_config = refresh_access_token(
        config=config, org_name=org_name, login_url=login_url
    )

    conn = get_simple_salesforce_connection(
        cci.project_config, org_config, api_version=None
    )
    conn.base_url += base_url

    return conn


def get_latest_revision_numbers(*, scratch_org, user):
    repo_url = scratch_org.task.project.repository.repo_url
    repo_owner, repo_name = extract_owner_and_repo(repo_url)
    # with local_github_checkout(user, repo_url) as project_path:
    conn = get_salesforce_connection(
        repo_url=repo_url,
        repo_owner=repo_owner,
        repo_name=repo_name,
        repo_branch=scratch_org.task.branch_name,
        user=user,
        # project_path=project_path,
        config=scratch_org.config,
        login_url=scratch_org.login_url,
        base_url="tooling/",
    )

    # Store the results here on the org, and if any of these are > number than earlier
    # version, there are changes.
    # We need to run this right after the setup flow and store that as initial state.
    records = conn.query_all(
        "SELECT MemberName, MemberType, RevisionNum FROM SourceMember "
        "WHERE IsNameObsolete=false"
    ).get("records", [])

    records = {record["MemberName"]: record["RevisionNum"] for record in records}

    return records

    # To get the actual changes, we need to use


def compare_revisions(old_revision, new_revision):
    for key in new_revision.keys():
        if new_revision[key] > old_revision.get(key, -1):
            return True
    return False
