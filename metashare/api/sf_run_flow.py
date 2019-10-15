import json
import os
from datetime import datetime
from unittest.mock import Mock

from cumulusci.core.config import OrgConfig, TaskConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.oauth.salesforce import SalesforceOAuth2, jwt_session
from cumulusci.tasks.salesforce.org_settings import DeployOrgSettings
from cumulusci.utils import cd
from django.conf import settings
from simple_salesforce import Salesforce as SimpleSalesforce

# Salesforce connected app
# Assign these locally, for brevity:
SF_CALLBACK_URL = settings.SF_CALLBACK_URL
SF_CLIENT_KEY = settings.SF_CLIENT_KEY
SF_CLIENT_ID = settings.SF_CLIENT_ID
SF_CLIENT_SECRET = settings.SF_CLIENT_SECRET

# Deploy org settings metadata -- this should get moved into CumulusCI
SETTINGS_XML_t = """<?xml version="1.0" encoding="UTF-8"?>
<{settingsName} xmlns="http://soap.sforce.com/2006/04/metadata">
    {values}
</{settingsName}>"""
ORGPREF_t = """<preferences>
    <settingName>{name}</settingName>
    <settingValue>{value}</settingValue>
</preferences>"""
PACKAGE_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>Settings</name>
    </types>
    <version>46.0</version>
</Package>"""


def capitalize(s):
    """
    Just capitalize first letter (different from .title, as it preserves
    the rest of the case).
    e.g. accountSettings -> AccountSettings
    """
    return s[0].upper() + s[1:]


def refresh_access_token(*, config, org_name):
    """
    Construct a new OrgConfig because ScratchOrgConfig tries to use sfdx
    which we don't want now -- this is a total hack which I'll try to
    smooth over with some improvements in CumulusCI
    """
    org_config = OrgConfig(config, org_name)
    org_config.refresh_oauth_token = Mock()
    info = jwt_session(
        SF_CLIENT_ID, SF_CLIENT_KEY, org_config.username, org_config.instance_url
    )
    org_config.config["access_token"] = info["access_token"]
    return org_config


def get_devhub_api(*, devhub_username):
    """
    Get an access token (session) for the specified dev hub username.
    This only works if the user has already authorized the connected app
    via an interactive login flow, such as the django-allauth login.
    """
    jwt = jwt_session(SF_CLIENT_ID, SF_CLIENT_KEY, devhub_username)
    return SimpleSalesforce(
        instance_url=jwt["instance_url"],
        session_id=jwt["access_token"],
        client_id="MetaShare",
        version="46.0",
    )


def get_org_details(*, cci, org_name, project_path):
    """Obtain details needed to create a scratch org.

    Returns scratch_org_config
    (from the project's cumulusci.yml)
    and scratch_org_definition
    (the sfdx *.org file with JSON specifying what kind of org to create)
    """
    scratch_org_config = cci.keychain.get_org(org_name)
    scratch_org_definition_path = os.path.join(
        project_path, scratch_org_config.config_file
    )
    with open(scratch_org_definition_path, "r") as f:
        scratch_org_definition = json.load(f)

    return (scratch_org_config, scratch_org_definition)


def get_org_result(
    *,
    email,
    repo_owner,
    repo_name,
    repo_branch,
    scratch_org_config,
    scratch_org_definition,
    cci,
    devhub_api,
):
    """Create a new scratch org using the ScratchOrgInfo object in the Dev Hub org,
    and get the result."""
    # Schema for ScratchOrgInfo object:
    # https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_scratchorginfo.htm
    create_args = {
        "AdminEmail": email,
        "ConnectedAppConsumerKey": SF_CLIENT_ID,
        "ConnectedAppCallbackUrl": SF_CALLBACK_URL,
        "Description": f"{repo_owner}/{repo_name} {repo_branch}",
        "DurationDays": scratch_org_config.days,
        "Edition": scratch_org_definition["edition"],
        "Features": ";".join(scratch_org_definition.get("features", [])),
        "HasSampleData": scratch_org_definition.get("hasSampleData", False),
        "Namespace": (
            cci.project_config.project__package__namespace
            if scratch_org_config.namespaced
            else None
        ),
        "OrgName": scratch_org_definition.get("orgName", "MetaShare Task Org"),
        # should really flesh this out to pass the other
        # optional fields from the scratch org definition file,
        # but this will work for a start
    }
    if settings.SF_SIGNUP_INSTANCE:
        create_args["Instance"] = settings.SF_SIGNUP_INSTANCE
    response = devhub_api.ScratchOrgInfo.create(create_args)

    # Get details and update scratch org config
    return devhub_api.ScratchOrgInfo.get(response["id"])


def mutate_scratch_org(*, scratch_org_config, org_result, email):
    """Updates the org config for a new scratch org with details
    from its ScratchOrgInfo"""
    scratch_org_config._scratch_info = {
        "instance_url": org_result["LoginUrl"],
        "org_id": org_result["ScratchOrg"],
        "username": org_result["SignupUsername"],
    }
    scratch_org_config.config.update(scratch_org_config._scratch_info)
    scratch_org_config.config.update(
        {
            "date_created": datetime.now(),
            "created": True,
            "email": email,
            "scratch": True,
            "is_sandbox": True,
        }
    )


def get_access_token(*, org_result, scratch_org_config):
    """Trades the AuthCode from a ScratchOrgInfo for an org access token,
    and stores it in the org config.

    The AuthCode is short-lived so this is only useful immediately after
    the scratch org is created. This must be completed once in order for future
    access tokens to be obtained using the JWT token flow.
    """
    oauth = SalesforceOAuth2(
        SF_CLIENT_ID, SF_CLIENT_SECRET, SF_CALLBACK_URL, scratch_org_config.instance_url
    )
    auth_result = oauth.get_token(org_result["AuthCode"]).json()
    scratch_org_config.config["access_token"] = scratch_org_config._scratch_info[
        "access_token"
    ] = auth_result["access_token"]


def deploy_org_settings(*, cci, org_config, org_name, scratch_org_config):
    """Do a Metadata API deployment to configure org settings
    as specified in the scratch org definition file.
    """
    org_config = refresh_access_token(
        config=scratch_org_config.config, org_name=org_name
    )
    path = os.path.join(cci.project_config.repo_root, scratch_org_config.config_file)
    task_config = TaskConfig({"options": {"definition_file": path}})
    task = DeployOrgSettings(cci.project_config, task_config, org_config)
    task()
    return org_config


def create_org_and_run_flow(
    *, repo_owner, repo_name, repo_url, repo_branch, user, flow_name, project_path
):
    """Create a new scratch org and run a flow"""
    org_name = "dev"
    devhub_username = user.sf_username
    email = user.email  # TODO: check that this is reliably right.

    cci = BaseCumulusCI(
        repo_info={
            "root": project_path,
            "url": repo_url,
            "name": repo_name,
            "owner": repo_owner,
            "commit": repo_branch,
        }
    )
    devhub_api = get_devhub_api(devhub_username=devhub_username)
    scratch_org_config, scratch_org_definition = get_org_details(
        cci=cci, org_name=org_name, project_path=project_path
    )
    org_result = get_org_result(
        email=email,
        repo_owner=repo_owner,
        repo_name=repo_name,
        repo_branch=repo_branch,
        scratch_org_config=scratch_org_config,
        scratch_org_definition=scratch_org_definition,
        cci=cci,
        devhub_api=devhub_api,
    )
    mutate_scratch_org(
        scratch_org_config=scratch_org_config, org_result=org_result, email=email
    )
    get_access_token(org_result=org_result, scratch_org_config=scratch_org_config)
    org_config = deploy_org_settings(
        cci=cci,
        org_config=scratch_org_config,
        org_name=org_name,
        scratch_org_config=scratch_org_config,
    )

    # ---
    # Scratch org construction is done but we haven't run a flow
    # yet. This is the point where you would want to serialize
    # scratch_org_config.config to store in the database for use
    # later. Then reconstitute by running construct_org_config
    # ---

    # Run flow (takes care of getting a new access token)
    flow = cci.get_flow(flow_name)
    with cd(project_path):
        flow.run(org_config)

    return scratch_org_config


def delete_scratch_org(scratch_org):
    """Delete a scratch org by deleting its ActiveScratchOrg record
    in the Dev Hub org."""
    devhub_username = scratch_org.owner.sf_username
    org_id = scratch_org.config["org_id"]

    devhub_api = get_devhub_api(devhub_username=devhub_username)

    records = (
        devhub_api.query(
            f"SELECT Id FROM ActiveScratchOrg WHERE ScratchOrg='{org_id}'"
        ).get("records")
        # the above could return an empty list, so we have to use an or:
        or [{}]
    )[0]
    active_scratch_org_id = records.get("Id")
    if active_scratch_org_id:
        devhub_api.ActiveScratchOrg.delete(active_scratch_org_id)
