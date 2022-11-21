"""
These tests are TRULY AWFUL but we're expecting the code in sf_run_flow
to change substantially, and as it stands, it's full of implicit
external calls, so this would be mock-heavy anyway.
"""
import responses
from contextlib import ExitStack
from unittest.mock import MagicMock, patch
from requests.exceptions import InvalidSchema
import pytest
from requests.exceptions import HTTPError
from cumulusci.core.config.scratch_org_config import ScratchOrgConfig
from cumulusci.oauth.client import OAuth2Client

from requests.exceptions import ConnectionError
from metecho.exceptions import SubcommandException

from ..sf_run_flow import (
    ScratchOrgError,
    capitalize,
    create_org,
    delete_org,
    deploy_org_settings,
    get_access_token,
    get_devhub_api,
    get_org_details,
    get_org_result,
    is_org_good,
    mutate_scratch_org,
    poll_for_scratch_org_completion,
    refresh_access_token,
    run_flow,
)

PATCH_ROOT = "metecho.api.sf_run_flow"


@pytest.mark.django_db
def test_is_org_good(scratch_org_factory):
    with patch("metecho.api.sf_run_flow.OrgConfig") as OrgConfig:
        OrgConfig.side_effect = HTTPError()
        assert not is_org_good(scratch_org_factory())


def test_capitalize():
    assert capitalize("fooBar") == "FooBar"


class TestRefreshAccessToken:
    def test_good(self):
        with ExitStack() as stack:
            OrgConfig = stack.enter_context(patch(f"{PATCH_ROOT}.OrgConfig"))

            refresh_access_token(
                config=MagicMock(),
                org_name=MagicMock(),
                scratch_org=MagicMock(),
                originating_user_id=None,
            )

            assert OrgConfig.called

    def test_bad(self):
        with ExitStack() as stack:
            get_current_job = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_current_job")
            )
            get_current_job.return_value = MagicMock(id=123)
            OrgConfig = stack.enter_context(patch(f"{PATCH_ROOT}.OrgConfig"))
            OrgConfig.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=400)
            )

            scratch_org = MagicMock()
            with pytest.raises(ScratchOrgError, match=".*job ID.*"):
                refresh_access_token(
                    config=MagicMock(),
                    org_name=MagicMock(),
                    scratch_org=scratch_org,
                    originating_user_id=None,
                )

            assert scratch_org.remove_scratch_org.called

    def test_bad__no_job(self):
        with ExitStack() as stack:
            OrgConfig = stack.enter_context(patch(f"{PATCH_ROOT}.OrgConfig"))
            OrgConfig.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=400)
            )

            scratch_org = MagicMock()
            with pytest.raises(ScratchOrgError, match=".*Org still exists*"):
                refresh_access_token(
                    config=MagicMock(),
                    org_name=MagicMock(),
                    scratch_org=scratch_org,
                    originating_user_id=None,
                )

            assert scratch_org.remove_scratch_org.called


class TestGetDevhubApi:
    def test_good(self):
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.jwt_session"))
            SimpleSalesforce = stack.enter_context(
                patch(f"{PATCH_ROOT}.SimpleSalesforce")
            )

            get_devhub_api(devhub_username="devhub_username")

            assert SimpleSalesforce.called

    def test_bad(self):
        with ExitStack() as stack:
            jwt_session = stack.enter_context(patch(f"{PATCH_ROOT}.jwt_session"))
            jwt_session.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=400)
            )

            scratch_org = MagicMock()
            with pytest.raises(ScratchOrgError, match=".*Org still exists*"):
                get_devhub_api(
                    devhub_username="devhub_username", scratch_org=scratch_org
                )

            assert scratch_org.remove_scratch_org.called

    def test_bad_no_org(self):
        with ExitStack() as stack:
            jwt_session = stack.enter_context(patch(f"{PATCH_ROOT}.jwt_session"))
            jwt_session.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=400)
            )

            with pytest.raises(HTTPError, match="Error message."):
                get_devhub_api(devhub_username="devhub_username")


def test_get_org_details():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.os"))
        json = stack.enter_context(patch(f"{PATCH_ROOT}.json"))

        config, definition = get_org_details(
            cci=MagicMock(), org_name=MagicMock(), project_path=""
        )

        assert json.load.called


def test_get_org_result(settings):
    devhub_api = MagicMock()
    devhub_api.ScratchOrgInfo.describe.return_value = {
        "fields": [{"name": "FooField", "createable": True}]
    }

    result = get_org_result(
        email=MagicMock(),
        repo_owner=MagicMock(),
        repo_name=MagicMock(),
        repo_branch=MagicMock(),
        scratch_org_config=MagicMock(),
        scratch_org_definition={
            "features": ["Communities", "MarketingUser"],
            "description": "foo",
            "template": "0TTxxxxxxxxxxxx",
            "fooField": "barValue",
            "settings": {"FooSettings": {"UseFoo": True}},
        },
        cci=MagicMock(),
        devhub_api=devhub_api,
    )

    assert result


def test_mutate_scratch_org():
    scratch_org_config = MagicMock()
    mutate_scratch_org(
        scratch_org_config=scratch_org_config,
        org_result={"LoginUrl": None, "ScratchOrg": None, "SignupUsername": None},
        email=MagicMock(),
    )

    assert scratch_org_config.config.update.called


def test_get_access_token(mocker):
    OAuth2Client = mocker.patch(f"{PATCH_ROOT}.OAuth2Client")
    mocker.patch(f"{PATCH_ROOT}.OAuth2ClientConfig")
    get_access_token(
        org_result=mocker.MagicMock(),
        scratch_org_config=mocker.MagicMock(),
    )

    assert OAuth2Client.called


@pytest.mark.django_db
@patch("metecho.api.sf_run_flow.time.sleep")
@patch("metecho.api.sf_run_flow.settings.MAXIMUM_JOB_LENGTH", 9)
def test_get_access_token_dns_delay_garbage_url(sleep, mocker):
    scratch_org_config = ScratchOrgConfig(
        name="dev",
        config={
            "access_token": 123,
            "instance_url": "garbage://tesdfgfdsfg54w36st.co345654356tm",
        },
    )
    real_auth_code_grant = OAuth2Client.auth_code_grant
    call_count = 0
    mocker.patch("metecho.api.sf_run_flow.is_network_error", False)

    def fake_auth_code_grant(self, config):
        nonlocal call_count
        call_count += 1
        return real_auth_code_grant(self, config)

    mocker.patch.object(
        OAuth2Client,
        "auth_code_grant",
        fake_auth_code_grant,
    )
    mocker.auth_code_grant = "123"
    auth_token_endpoint = f"'{scratch_org_config.instance_url}/services/oauth2/token'"
    expected_result = f"No connection adapters were found for {auth_token_endpoint}"
    with pytest.raises(
        InvalidSchema,
        match=expected_result,
    ):
        get_access_token(
            org_result={"AuthCode": "123"},
            scratch_org_config=scratch_org_config,
        )

    assert call_count == 1


@responses.activate
@pytest.mark.django_db
@patch("metecho.api.sf_run_flow.time.sleep")
@patch("metecho.api.sf_run_flow.settings.MAXIMUM_JOB_LENGTH", 9)
def test_get_access_token_dns_delay_raises_error(sleep, mocker):
    scratch_org_config = ScratchOrgConfig(
        name="dev",
        config={
            "access_token": 123,
            "instance_url": "https://test.com",
        },
    )
    real_auth_code_grant = OAuth2Client.auth_code_grant
    call_count = 0

    def fake_auth_code_grant(self, config):
        nonlocal call_count
        call_count += 1
        return real_auth_code_grant(self, config)

    mocker.patch.object(
        OAuth2Client,
        "auth_code_grant",
        fake_auth_code_grant,
    )
    mocker.auth_code_grant = "123"
    with pytest.raises(
        ConnectionError,
        match="Connection refused by Responses - the call doesn't match any registered mock.",
    ):
        get_access_token(
            org_result={"AuthCode": "123"},
            scratch_org_config=scratch_org_config,
        )

    assert call_count == 1


@pytest.mark.django_db
@patch("metecho.api.sf_run_flow.time.sleep")
@patch("metecho.api.sf_run_flow.settings.MAXIMUM_JOB_LENGTH", 11)
def test_get_access_token_dns_delay(sleep, mocker):
    """Prove test is looping for DNS delays"""
    scratch_org_config = ScratchOrgConfig(
        name="dev",
        config={
            "access_token": 123,
            "instance_url": "https://tesdfgfdsfg54w36st.co345654356tm",
        },
    )
    real_auth_code_grant = OAuth2Client.auth_code_grant
    call_count = 0

    def fake_auth_code_grant(self, config):
        nonlocal call_count
        call_count += 1
        return real_auth_code_grant(self, config)

    mocker.patch.object(
        OAuth2Client,
        "auth_code_grant",
        fake_auth_code_grant,
    )
    mocker.auth_code_grant = "123"
    with pytest.raises(ScratchOrgError):

        get_access_token(
            org_result={"AuthCode": "123"},
            scratch_org_config=scratch_org_config,
        )
    assert call_count == 2


class TestDeployOrgSettings:
    def test_org_preference_settings(self):
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.os"))
            stack.enter_context(patch(f"{PATCH_ROOT}.open"))
            stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))
            stack.enter_context(patch(f"{PATCH_ROOT}.TaskConfig"))
            DeployOrgSettings = stack.enter_context(
                patch(f"{PATCH_ROOT}.DeployOrgSettings")
            )

            section_setting = MagicMock()
            settings = MagicMock()
            scratch_org_definition = MagicMock()

            section_setting.items.return_value = [(MagicMock(), MagicMock())]
            settings.items.return_value = [("orgPreferenceSettings", section_setting)]
            scratch_org_definition.get.return_value = settings

            deploy_org_settings(
                cci=MagicMock(),
                org_name=MagicMock(),
                scratch_org_config=MagicMock(),
                scratch_org=MagicMock(),
                originating_user_id=None,
            )
            assert DeployOrgSettings.called


@pytest.mark.django_db
class TestRunFlow:
    def test_create_org_and_run_flow__exception(self, user_factory, epic_factory):
        user = user_factory()
        org_config = MagicMock(
            org_id="org_id",
            id="https://test.salesforce.com/id/ORGID/USERID",
            instance_url="instance_url",
            access_token="access_token",
            config_name="dev",
        )
        epic = epic_factory()
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.os"))
            subprocess = stack.enter_context(patch(f"{PATCH_ROOT}.subprocess"))
            Popen = MagicMock()
            Popen.communicate.return_value = (MagicMock(), MagicMock())
            subprocess.Popen.return_value = Popen
            stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
            stack.enter_context(patch(f"{PATCH_ROOT}.get_devhub_api"))
            get_org_details = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_org_details")
            )
            get_org_details.return_value = (MagicMock(), MagicMock())
            stack.enter_context(patch(f"{PATCH_ROOT}.get_org_result"))
            stack.enter_context(patch(f"{PATCH_ROOT}.mutate_scratch_org"))
            stack.enter_context(patch(f"{PATCH_ROOT}.poll_for_scratch_org_completion"))
            stack.enter_context(patch(f"{PATCH_ROOT}.get_access_token"))
            stack.enter_context(patch(f"{PATCH_ROOT}.deploy_org_settings"))

            create_org(
                repo_owner=MagicMock(),
                repo_name=MagicMock(),
                repo_url=MagicMock(),
                repo_branch=MagicMock(),
                user=MagicMock(),
                project_path=MagicMock(),
                scratch_org=MagicMock(),
                org_name="dev",
                originating_user_id=None,
            )
            with pytest.raises(SubcommandException):
                run_flow(
                    cci=MagicMock(),
                    org_config=org_config,
                    flow_name=MagicMock(),
                    project_path=epic,
                    user=user,
                )


@pytest.mark.django_db
def test_delete_org(scratch_org_factory):
    scratch_org = scratch_org_factory(
        config={"org_id": "some-id"}, expiry_job_id="abcd1234"
    )
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.os"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_scheduler"))
        devhub_api = MagicMock()
        get_devhub_api = stack.enter_context(patch(f"{PATCH_ROOT}.get_devhub_api"))
        get_devhub_api.return_value = devhub_api
        devhub_api.query.return_value = {"records": [{"Id": "some-id"}]}

        delete_org(scratch_org)

        assert devhub_api.ActiveScratchOrg.delete.called


@patch("metecho.api.sf_run_flow.time.sleep")
def test_poll_for_scratch_org_completion__success(sleep):
    scratch_org_info_id = "2SR4p000000DTAaGAO"
    devhub_api = MagicMock()
    initial_result = {
        "Id": scratch_org_info_id,
        "Status": "Creating",
        "ErrorCode": None,
    }
    end_result = {"Id": scratch_org_info_id, "Status": "Active", "ErrorCode": None}
    devhub_api.ScratchOrgInfo.get.side_effect = [initial_result, end_result]

    org_result = poll_for_scratch_org_completion(devhub_api, initial_result)
    assert org_result == end_result


@patch("metecho.api.sf_run_flow.time.sleep")
def test_poll_for_scratch_org_completion__failure(sleep):
    scratch_org_info_id = "2SR4p000000DTAaGAO"
    devhub_api = MagicMock()
    initial_result = {
        "Id": scratch_org_info_id,
        "Status": "Creating",
        "ErrorCode": None,
    }
    end_result = {"Id": scratch_org_info_id, "Status": "Failed", "ErrorCode": "Foo"}
    devhub_api.ScratchOrgInfo.get.side_effect = [initial_result, end_result]

    with pytest.raises(ScratchOrgError, match="Scratch org creation failed"):
        poll_for_scratch_org_completion(devhub_api, initial_result)
