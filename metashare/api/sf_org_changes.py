from cumulusci.salesforce_api.utils import get_simple_salesforce_connection

from .github_context import extract_owner_and_repo, local_github_checkout
from .sf_run_flow import BaseCumulusCI, refresh_access_token


def get_salesforce_connection(
    *,
    repo_url,
    repo_owner,
    repo_name,
    repo_branch,
    user,
    project_path,
    config,
    login_url
):
    org_name = "dev"

    cci = BaseCumulusCI(
        repo_info={
            "root": project_path,
            "url": repo_url,
            "name": repo_name,
            "owner": repo_owner,
            "commit": repo_branch,
        }
    )
    org_config = refresh_access_token(
        config=config, org_name=org_name, login_url=login_url
    )

    conn = get_simple_salesforce_connection(
        cci.project_config, org_config, api_version=None
    )
    conn.base_url += "tooling/"

    return conn


def sf_org_has_changes(*, scratch_org, user):
    repo_url = scratch_org.task.project.repository.repo_url
    repo_owner, repo_name = extract_owner_and_repo(repo_url)
    with local_github_checkout(user, repo_url) as project_path:
        conn = get_salesforce_connection(
            repo_url=repo_url,
            repo_owner=repo_owner,
            repo_name=repo_name,
            repo_branch=scratch_org.task.branch_name,
            user=user,
            project_path=project_path,
            config=scratch_org.config,
            login_url=scratch_org.login_url,
        )

    return conn.query_all(
        "SELECT MemberName, MemberType, RevisionNum FROM SourceMember "
        "WHERE IsNameObsolete=false"
    )
