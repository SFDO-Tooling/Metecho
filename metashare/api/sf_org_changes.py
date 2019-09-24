import simple_salesforce
from cumulusci.core.config import BaseGlobalConfig
from django.conf import settings

from .sf_run_flow import refresh_access_token


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

    records = {
        f"{record['MemberType']}:{record['MemberName']}": record["RevisionNum"]
        for record in records
    }

    return records


def compare_revisions(old_revision, new_revision):
    for key in new_revision.keys():
        if new_revision[key] > old_revision.get(key, -1):
            return True
    return False
