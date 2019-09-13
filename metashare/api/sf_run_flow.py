import json
import os
from calendar import timegm
from datetime import datetime
from unittest.mock import Mock
from urllib.parse import urljoin

import jwt as pyjwt
import requests
from allauth.socialaccount.models import SocialApp
from cumulusci.core.config import OrgConfig, TaskConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.oauth.salesforce import SalesforceOAuth2
from cumulusci.tasks.salesforce import Deploy
from cumulusci.utils import cd, temporary_dir
from simple_salesforce import Salesforce as SimpleSalesforce

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
    response.raise_for_status()
    return response.json()


# Salesforce connected app
# Load this at module load, as it's stable, and this minimizes IO
SF_CALLBACK_URL = "http://localhost:8080/accounts/salesforce-production/login/callback/"
with open("/server.key") as f:
    SF_CLIENT_KEY = f.read()


def refresh_access_token(*, config, org_name, login_url, sf_client_id):
    """
    Construct a new OrgConfig because ScratchOrgConfig tries to use sfdx
    which we don't want now -- this is a total hack which I'll try to
    smooth over with some improvements in CumulusCI
    """
    org_config = OrgConfig(config, org_name)
    org_config.refresh_oauth_token = Mock()
    info = jwt_session(
        sf_client_id, SF_CLIENT_KEY, org_config.username, login_url, is_sandbox=True
    )
    org_config.config["access_token"] = info["access_token"]
    return org_config


def get_devhub_api(*, devhub_username, sf_client_id):
    """
    Get an access token (session) for the specified dev hub username.
    This only works if the user has already authorized the connected app
    via an interactive login flow, such as the django-allauth login.
    """
    jwt = jwt_session(sf_client_id, SF_CLIENT_KEY, devhub_username)
    return SimpleSalesforce(
        instance_url=jwt["instance_url"],
        session_id=jwt["access_token"],
        client_id="MetaShare",
        version="46.0",
    )


def get_org_details(*, cci, org_name, project_path):
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
    sf_client_id,
):
    # Schema for ScratchOrgInfo object:
    # https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_scratchorginfo.htm
    response = devhub_api.ScratchOrgInfo.create(
        {
            "AdminEmail": email,
            "ConnectedAppConsumerKey": sf_client_id,
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
    )

    # Get details and update scratch org config
    return devhub_api.ScratchOrgInfo.get(response["id"])


def mutate_scratch_org(*, scratch_org_config, org_result, email):
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
    signup_instance = org_result["SignupInstance"]
    return f"https://{signup_instance}.salesforce.com"


def get_access_token(
    *, login_url, org_result, scratch_org_config, sf_client_id, sf_client_secret
):
    oauth = SalesforceOAuth2(sf_client_id, sf_client_secret, SF_CALLBACK_URL, login_url)
    auth_result = oauth.get_token(org_result["AuthCode"]).json()
    scratch_org_config.config["access_token"] = scratch_org_config._scratch_info[
        "access_token"
    ] = auth_result["access_token"]


def deploy_org_settings(
    *,
    cci,
    login_url,
    org_config,
    org_name,
    scratch_org_config,
    scratch_org_definition,
    sf_client_id,
):
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
                config=scratch_org_config.config,
                org_name=org_name,
                login_url=login_url,
                sf_client_id=sf_client_id,
            )

            task_config = TaskConfig({"options": {"path": path}})
            task = Deploy(cci.project_config, task_config, org_config)
            task()
            return org_config
    return org_config


def create_org_and_run_flow(
    *, repo_owner, repo_name, repo_branch, user, flow_name, project_path
):
    # TODO: Should this come from env, even if that mirrors the DB contents?
    sa = SocialApp.objects.filter(provider__startswith="salesforce").first()
    sf_client_id = sa.client_id
    sf_client_secret = sa.secret
    # Update environment with some keys CumulusCI uses
    # TODO: Should this be in a context manager so as not to leak across
    # runs?
    os.environ.update(
        {
            # Salesforce connected app
            "SFDX_CLIENT_ID": sf_client_id,
            "SFDX_HUB_KEY": SF_CLIENT_KEY,
            # GitHub App
            "GITHUB_APP_ID": "",
            "GITHUB_APP_KEY": """""",
        }
    )

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
    devhub_api = get_devhub_api(
        devhub_username=devhub_username, sf_client_id=sf_client_id
    )
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
        sf_client_id=sf_client_id,
    )
    mutate_scratch_org(
        scratch_org_config=scratch_org_config, org_result=org_result, email=email
    )
    login_url = get_login_url(org_result)
    get_access_token(
        login_url=login_url,
        org_result=org_result,
        scratch_org_config=scratch_org_config,
        sf_client_id=sf_client_id,
        sf_client_secret=sf_client_secret,
    )
    org_config = deploy_org_settings(
        cci=cci,
        login_url=login_url,
        org_config=scratch_org_config,
        org_name=org_name,
        scratch_org_config=scratch_org_config,
        scratch_org_definition=scratch_org_definition,
        sf_client_id=sf_client_id,
    )

    # ---
    # Scratch org construction is done but we haven't run a flow
    # yet. This is the point where you would want to serialize
    # scratch_org_config.config to store in the database for use
    # later. Then reconstitute by running construc_org_config
    # ---

    # Run flow (takes care of getting a new access token)
    flow = cci.get_flow(flow_name)
    with cd(project_path):
        flow.run(org_config)

    return scratch_org_config


def delete_scratch_org(scratch_org):
    # TODO: Actually try this out

    # Update environment with some keys CumulusCI uses
    # TODO: Should this be in a context manager so as not to leak across
    # runs?
    os.environ.update(
        {
            # Salesforce connected app
            "SFDX_CLIENT_ID": "placeholder",  # SF_CLIENT_ID,
            "SFDX_HUB_KEY": SF_CLIENT_KEY,
        }
    )

    devhub_username = scratch_org.owner.sf_username
    org_id = scratch_org.config["Id"]  # TODO: Is this remotely right?

    devhub_api = get_devhub_api(devhub_username=devhub_username)
    active_scratch_org_id = devhub_api.query(
        f"SELECT Id FROM ActiveScratchOrg WHERE ScratchOrg='{org_id}'"
    )["records"][0]["Id"]
    if active_scratch_org_id:
        devhub_api.ActiveScratchOrg.delete(active_scratch_org_id)
