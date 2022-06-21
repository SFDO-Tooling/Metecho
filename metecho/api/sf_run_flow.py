import contextlib
import json
import logging
import os
import shutil
import subprocess
import time
from datetime import datetime

from cumulusci.core.config import OrgConfig, TaskConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.oauth.client import OAuth2Client, OAuth2ClientConfig
from cumulusci.oauth.salesforce import jwt_session
from cumulusci.tasks.salesforce.org_settings import DeployOrgSettings
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django_rq import get_scheduler
from rq import get_current_job
from simple_salesforce import Salesforce as SimpleSalesforce

logger = logging.getLogger(__name__)

# Salesforce connected app
# Assign these locally, for brevity:
SF_CALLBACK_URL = settings.SFDX_CLIENT_CALLBACK_URL
SF_CLIENT_KEY = settings.SFDX_HUB_KEY
SF_CLIENT_ID = settings.SFDX_CLIENT_ID
SF_CLIENT_SECRET = settings.SFDX_CLIENT_SECRET
SFDX_SIGNUP_INSTANCE = settings.SFDX_SIGNUP_INSTANCE

DURATION_DAYS = 30

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
    <version>47.0</version>
</Package>"""


class ScratchOrgError(Exception):
    pass


@contextlib.contextmanager
def delete_org_on_error(scratch_org=None, originating_user_id=None):
    try:
        yield
    except Exception as err:
        if not scratch_org:
            raise err
        if get_current_job():
            job_id = get_current_job().id
            # This error is user-facing, and so for makemessages to
            # pick it up correctly, we need it to be a single,
            # unbroken, string literal (even though adjacent string
            # literals should be parsed by the AST into a single
            # string literal and picked up by makemessages, but
            # that's a gripe for another day). We have relatively
            # few errors that propagate directly from the backend
            # like this, but when we do, this is the pattern we
            # should use.
            #
            # This is also why we repeat the first sentence.
            error_msg = _(
                f"Are you certain that the Org still exists? If you need support, your job ID is {job_id}."  # noqa: B950
            )
        else:
            error_msg = _(f"Are you certain that the Org still exists? {err.args[0]}")

        error = ScratchOrgError(error_msg)
        scratch_org.remove_scratch_org(error, originating_user_id=originating_user_id)
        raise error


def capitalize(s):
    """
    Just capitalize first letter (different from .title, as it preserves
    the rest of the case).
    e.g. accountSettings -> AccountSettings
    """
    return s[0].upper() + s[1:]


def is_org_good(org):
    """Check whether we can still get a valid access token for the org.

    (Most likely reason for not being able to is that the org was deleted.)
    """
    config = org.config
    org_name = org.org_config_name
    try:
        org_config = OrgConfig(config, org_name)
        org_config.refresh_oauth_token(None)
        return "access_token" in org_config.config
    except Exception:
        return False


def refresh_access_token(
    *,
    scratch_org,
    config,
    org_name,
    keychain=None,
    originating_user_id=None,
):
    """
    Construct a new OrgConfig because ScratchOrgConfig tries to use sfdx
    which we don't want now -- this is a total hack which I'll try to
    smooth over with some improvements in CumulusCI
    """
    with delete_org_on_error(
        scratch_org=scratch_org, originating_user_id=originating_user_id
    ):
        org_config = OrgConfig(config, org_name, keychain=keychain)
        org_config.refresh_oauth_token(keychain, is_sandbox=True)
        return org_config


def get_devhub_api(*, devhub_username, scratch_org=None):
    """
    Get an access token (session) for the specified dev hub username.
    This only works if the user has already authorized the connected app
    via an interactive login flow, such as the django-allauth login.
    """
    with delete_org_on_error(scratch_org=scratch_org):
        jwt = jwt_session(SF_CLIENT_ID, SF_CLIENT_KEY, devhub_username)
        return SimpleSalesforce(
            instance_url=jwt["instance_url"],
            session_id=jwt["access_token"],
            client_id="Metecho",
            version="49.0",
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
    # https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_scratchorginfo.htm  # noqa: B950

    scratch_org_definition = {k.lower(): v for k, v in scratch_org_definition.items()}
    features = scratch_org_definition.get("features", [])
    # Map between fields in the scratch org definition and fields on the ScratchOrgInfo object.
    # Start with fields that have special handling outside the .json.
    create_args = {
        "adminemail": email,
        "connectedappconsumerkey": SF_CLIENT_ID,
        "connectedappcallbackurl": SF_CALLBACK_URL,
        "description": f"{repo_owner}/{repo_name} {repo_branch}",
        # Override whatever is in scratch_org_config.days:
        "durationdays": DURATION_DAYS,
        "features": ";".join(features) if isinstance(features, list) else features,
        "namespace": (
            cci.project_config.project__package__namespace
            if scratch_org_config.namespaced
            else None
        ),
    }
    # Loop over remaining fields from the ScratchOrgInfo schema and map to
    # data from the org definition.
    fields = [
        f["name"]
        for f in devhub_api.ScratchOrgInfo.describe()["fields"]
        if f["createable"] and f["name"].lower() not in create_args
    ]

    # Note that the special fields `objectSettings` and `settings`
    # are not in the ScratchOrgInfo schema.
    for field in fields:
        field_name = field.lower()
        if field_name in scratch_org_definition:
            create_args[field_name] = scratch_org_definition[field_name]

    # Lastly, populate default items.
    create_args.setdefault("orgname", "Metecho Task Org")
    create_args.setdefault("hassampledata", False)

    if SFDX_SIGNUP_INSTANCE:  # pragma: nocover
        create_args["Instance"] = SFDX_SIGNUP_INSTANCE
    response = devhub_api.ScratchOrgInfo.create(create_args)

    # Get details and update scratch org config
    return devhub_api.ScratchOrgInfo.get(response["id"])


def poll_for_scratch_org_completion(devhub_api, org_result):
    total_time_waiting = 0
    # Don't allow waiting more than the default job timeout.
    while (
        org_result["Status"] in ["New", "Creating"]
        and total_time_waiting < settings.MAXIMUM_JOB_LENGTH
    ):
        time.sleep(10)
        total_time_waiting += 10
        org_result = devhub_api.ScratchOrgInfo.get(org_result["Id"])

    if org_result["Status"] != "Active":
        error = org_result["ErrorCode"] or _("Org creation timed out")
        raise ScratchOrgError(f"Scratch org creation failed: {error}")

    return org_result


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
            "days": DURATION_DAYS,
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
    oauth_config = OAuth2ClientConfig(
        client_id=SF_CLIENT_ID,
        client_secret=SF_CLIENT_SECRET,
        redirect_uri=SF_CALLBACK_URL,
        auth_uri=f"{scratch_org_config.instance_url}/services/oauth2/authorize",
        token_uri=f"{scratch_org_config.instance_url}/services/oauth2/token",
        scope="web full refresh_token",
    )
    oauth = OAuth2Client(oauth_config)
    auth_result = oauth.auth_code_grant(org_result["AuthCode"]).json()
    scratch_org_config.config["access_token"] = scratch_org_config._scratch_info[
        "access_token"
    ] = auth_result["access_token"]


def deploy_org_settings(
    *, cci, org_name, scratch_org_config, scratch_org, originating_user_id
):
    """Do a Metadata API deployment to configure org settings
    as specified in the scratch org definition file.
    """
    org_config = refresh_access_token(
        scratch_org=scratch_org,
        config=scratch_org_config.config,
        org_name=org_name,
        keychain=cci.keychain,
        originating_user_id=originating_user_id,
    )
    path = os.path.join(cci.project_config.repo_root, scratch_org_config.config_file)
    task_config = TaskConfig({"options": {"definition_file": path}})
    task = DeployOrgSettings(cci.project_config, task_config, org_config)
    task()
    return org_config


def create_org(
    *,
    repo_owner,
    repo_name,
    repo_url,
    repo_branch,
    user,
    project_path,
    scratch_org,
    org_name,
    originating_user_id,
    sf_username=None,
):
    """Create a new scratch org"""
    devhub_username = sf_username or user.sf_username
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
        devhub_username=devhub_username, scratch_org=scratch_org
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
    )
    org_result = poll_for_scratch_org_completion(devhub_api, org_result)
    mutate_scratch_org(
        scratch_org_config=scratch_org_config, org_result=org_result, email=email
    )
    get_access_token(org_result=org_result, scratch_org_config=scratch_org_config)
    org_config = deploy_org_settings(
        cci=cci,
        org_name=org_name,
        scratch_org_config=scratch_org_config,
        scratch_org=scratch_org,
        originating_user_id=originating_user_id,
    )

    return (scratch_org_config, cci, org_config)


def run_flow(*, cci, org_config, flow_name, project_path, user):
    """Run a flow on a scratch org"""
    # Run flow in a subprocess so we can control the environment
    gh_token = user.gh_token
    command = shutil.which("cci")
    args = [command, "flow", "run", flow_name, "--org", "dev"]
    env = {
        "CUMULUSCI_KEYCHAIN_CLASS": "cumulusci.core.keychain.EnvironmentProjectKeychain",
        # We need to set the "scratch" flag to true because some flows check for it,
        # but we need the org config to NOT be a ScratchOrgConfig which tries to use sfdx
        "CUMULUSCI_SCRATCH_ORG_CLASS": "cumulusci.core.config.OrgConfig",
        "CUMULUSCI_DISABLE_REFRESH": "1",
        "CUMULUSCI_ORG_dev": json.dumps(
            {
                "org_id": org_config.org_id,
                "id": org_config.id,
                "instance_url": org_config.instance_url,
                "access_token": org_config.access_token,
                "scratch": True,
            }
        ),
        "GITHUB_TOKEN": gh_token,
        # needed by sfdx
        "HOME": project_path,
        "PATH": os.environ["PATH"],
    }
    p = subprocess.Popen(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.PIPE,
        close_fds=True,
        env=env,
        cwd=project_path,
    )
    orig_stdout, _ = p.communicate()
    if p.returncode:
        p = subprocess.run(
            [command, "error", "info"], capture_output=True, env={"HOME": project_path}
        )
        traceback = p.stdout.decode("utf-8")
        logger.warning(traceback)
        raise Exception(
            _last_line(traceback) or _last_line(orig_stdout.decode("utf-8"))
        )


def delete_org(scratch_org):
    """Delete a scratch org by deleting its ActiveScratchOrg record
    in the Dev Hub org."""
    devhub_username = scratch_org.owner_sf_username
    org_id = scratch_org.config["org_id"]
    devhub_api = get_devhub_api(
        devhub_username=devhub_username, scratch_org=scratch_org
    )

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

    if scratch_org.expiry_job_id:
        scheduler = get_scheduler("default")
        scheduler.cancel(scratch_org.expiry_job_id)


def _last_line(s: str) -> str:
    lines = [line for line in s.splitlines() if line.strip()]
    return lines[-1] if lines else ""
