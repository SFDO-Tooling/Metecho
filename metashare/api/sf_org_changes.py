import os.path
from collections import defaultdict

import simple_salesforce
from cumulusci.core.config import BaseGlobalConfig, TaskConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.tasks.github.util import CommitDir
from cumulusci.tasks.metadata.package import PackageXmlGenerator
from cumulusci.tasks.salesforce.RetrieveUnpackaged import RetrieveUnpackaged
from cumulusci.tasks.salesforce.sourcetracking import MetadataType
from django.conf import settings

from .gh import (
    extract_owner_and_repo,
    get_repo_info,
    gh_given_user,
    local_github_checkout,
)
from .sf_run_flow import refresh_access_token


def build_package_xml(scratch_org, package_xml_path, desired_changes):
    types = [MetadataType(name, members) for (name, members) in desired_changes.items()]
    api_version = BaseGlobalConfig().project__package__api_version
    package_xml = PackageXmlGenerator(".", api_version, types=types)()
    with open(package_xml_path, "w") as f:
        f.write(package_xml)


def run_retrieve_task(user, scratch_org, project_path, desired_changes):
    repo_url = scratch_org.task.project.repository.repo_url
    org_config = refresh_access_token(
        config=scratch_org.config, org_name="dev", login_url=scratch_org.login_url
    )
    owner, repo = extract_owner_and_repo(repo_url)
    gh = gh_given_user(user)
    repository = gh.repository(owner, repo)
    branch = repository.default_branch
    cci = BaseCumulusCI(
        repo_info={
            "root": project_path,
            "url": repo_url,
            "name": owner,
            "owner": repo,
            "commit": branch,
        }
    )
    package_xml_path = os.path.join(project_path, "src", "package.xml")
    build_package_xml(scratch_org, package_xml_path, desired_changes)
    task_config = TaskConfig(
        {"options": {"path": project_path, "package_xml": package_xml_path}}
    )
    task = RetrieveUnpackaged(cci.project_config, task_config, org_config)
    task()


def commit_changes_to_github(
    *, user, scratch_org, repo_url, branch, desired_changes, commit_message
):
    with local_github_checkout(user, repo_url) as project_path:
        # This won't return anything in-memory, but rather it will emit files which we
        # then copy into a source checkout, and then commit and push all that.
        run_retrieve_task(user, scratch_org, project_path, desired_changes)
        repo = get_repo_info(user, repo_url)
        author = {"name": user.username, "email": user.email}
        CommitDir(repo, author=author)(
            project_path, branch, repo_dir="", commit_message=commit_message
        )


def get_salesforce_connection(*, config, login_url, base_url=""):
    org_name = "dev"
    org_config = refresh_access_token(
        config=config, org_name=org_name, login_url=login_url
    )

    conn = simple_salesforce.Salesforce(
        instance_url=org_config.instance_url,
        session_id=org_config.access_token,
        version=BaseGlobalConfig().project__package__api_version,
    )
    conn.headers.setdefault(
        "Sforce-Call-Options", "client={}".format(settings.SF_CLIENT_ID)
    )
    conn.base_url += base_url

    return conn


def get_latest_revision_numbers(scratch_org):
    conn = get_salesforce_connection(
        config=scratch_org.config, login_url=scratch_org.login_url, base_url="tooling/"
    )

    # Store the results here on the org, and if any of these are > number than earlier
    # version, there are changes.
    # We need to run this right after the setup flow and store that as initial state.
    records = conn.query_all(
        "SELECT MemberName, MemberType, RevisionNum FROM SourceMember "
        "WHERE IsNameObsolete=false"
    ).get("records", [])

    record_dict = defaultdict(lambda: defaultdict(dict))
    for record in records:
        record_dict[record["MemberType"]][record["MemberName"]] = record["RevisionNum"]

    return record_dict


def compare_revisions(old_revision, new_revision):
    ret = defaultdict(list)
    for mt in new_revision.keys():
        for mn in new_revision[mt].keys():
            if new_revision[mt][mn] > old_revision.get(mt, {}).get(mn, -1):
                ret[mt].append(mn)
    return ret
