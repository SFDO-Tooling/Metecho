import json
import os
from calendar import timegm
from datetime import datetime
from unittest.mock import Mock
from urllib.parse import urljoin

import jwt as pyjwt
import requests
from cumulusci.core.config import OrgConfig, TaskConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.oauth.salesforce import SalesforceOAuth2
from cumulusci.tasks.salesforce import Deploy
from cumulusci.utils import cd, temporary_dir
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


# This is copied from cumulusci.oauth.salesforce but we need a fix.
def jwt_session(client_id, private_key, username, url=None, is_sandbox=False):
    """Complete the JWT Token Oauth flow to obtain an access token for an org.

    :param client_id: Client Id for the connected app
    :param private_key: Private key used to sign the connected app's certificate
    :param username: Username to authenticate as
    :param url: Base URL of the instance hosting the org
    (e.g. https://na40.salesforce.com)
    :param is_sandbox: True if the org is a sandbox or scratch org
    """
    if url is None:
        url = "https://login.salesforce.com"
    aud = (
        "https://test.salesforce.com" if is_sandbox else "https://login.salesforce.com"
    )

    payload = {
        "alg": "RS256",
        "iss": client_id,
        "sub": username,
        "aud": aud,  # jwt aud is NOT mydomain
        "exp": timegm(datetime.utcnow().utctimetuple()),
    }
    encoded_jwt = pyjwt.encode(payload, private_key, algorithm="RS256")
    data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": encoded_jwt,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    auth_url = urljoin(url, "services/oauth2/token")
    response = requests.post(url=auth_url, data=data, headers=headers)
    try:
        response.raise_for_status()
    except Exception as err:
        # We need to add a detailed error message on to the exception:
        raise err.__class__(f"{err.args[0]}: {response.text}")
    return response.json()


def refresh_access_token(*, config, org_name, login_url):
    """
    Construct a new OrgConfig because ScratchOrgConfig tries to use sfdx
    which we don't want now -- this is a total hack which I'll try to
    smooth over with some improvements in CumulusCI
    """
    org_config = OrgConfig(config, org_name)
    org_config.refresh_oauth_token = Mock()
    info = jwt_session(
        SF_CLIENT_ID, SF_CLIENT_KEY, org_config.username, login_url, is_sandbox=True
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
    response = devhub_api.ScratchOrgInfo.create(
        {
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
            "SignupInstance": "cs68",
            # should really flesh this out to pass the other
            # optional fields from the scratch org definition file,
            # but this will work for a start
        }
    )

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


def get_login_url(org_result):
    """Get the base login/auth URL for a new scratch org from its ScratchOrgInfo"""
    signup_instance = org_result["SignupInstance"]
    return f"https://{signup_instance}.salesforce.com"


def get_access_token(*, login_url, org_result, scratch_org_config):
    """Trades the AuthCode from a ScratchOrgInfo for an org access token,
    and stores it in the org config.

    The AuthCode is short-lived so this is only useful immediately after
    the scratch org is created. This must be completed once in order for future
    access tokens to be obtained using the JWT token flow.
    """
    oauth = SalesforceOAuth2(SF_CLIENT_ID, SF_CLIENT_SECRET, SF_CALLBACK_URL, login_url)
    auth_result = oauth.get_token(org_result["AuthCode"]).json()
    scratch_org_config.config["access_token"] = scratch_org_config._scratch_info[
        "access_token"
    ] = auth_result["access_token"]


def deploy_org_settings(
    *, cci, login_url, org_config, org_name, scratch_org_config, scratch_org_definition
):
    """Do a Metadata API deployment to configure org settings
    as specified in the scratch org definition file.
    """
    settings = scratch_org_definition.get("settings", {})
    if settings:
        with temporary_dir() as path:
            os.mkdir("settings")
            for section, section_settings in settings.items():
                settings_name = capitalize(section)
                if section == "orgPreferenceSettings":
                    values = "\n    ".join(
                        ORGPREF_t.format(name=capitalize(k), value=v)
                        for k, v in section_settings.items()
                    )
                else:
                    values = "\n    ".join(
                        f"<{k}>{v}</{k}>" for k, v in section_settings.items()
                    )
                # e.g. AccountSettings -> settings/Account.settings
                settings_file = os.path.join(
                    "settings", settings_name[: -len("Settings")] + ".settings"
                )
                with open(settings_file, "w") as f:
                    f.write(
                        SETTINGS_XML_t.format(settingsName=settings_name, values=values)
                    )
            with open("package.xml", "w") as f:
                f.write(PACKAGE_XML)

            org_config = refresh_access_token(
                config=scratch_org_config.config, org_name=org_name, login_url=login_url
            )

            task_config = TaskConfig({"options": {"path": path}})
            task = Deploy(cci.project_config, task_config, org_config)
            task()
            return org_config
    return org_config


def create_org_and_run_flow(
    *, repo_owner, repo_name, repo_branch, user, flow_name, project_path
):
    """Create a new scratch org and run a flow"""
    repo_url = f"https://github.com/{repo_owner}/{repo_name}"
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
    login_url = get_login_url(org_result)
    get_access_token(
        login_url=login_url,
        org_result=org_result,
        scratch_org_config=scratch_org_config,
    )
    org_config = deploy_org_settings(
        cci=cci,
        login_url=login_url,
        org_config=scratch_org_config,
        org_name=org_name,
        scratch_org_config=scratch_org_config,
        scratch_org_definition=scratch_org_definition,
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

    return scratch_org_config, login_url


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
