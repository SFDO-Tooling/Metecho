"""
These tests are TRULY AWFUL but we're expecting the code in sf_run_flow
to change substantially, and as it stands, it's full of implicit
external calls, so this would be mock-heavy anyway.
"""

from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from requests.exceptions import HTTPError

from ..sf_run_flow import (
    capitalize,
    create_org,
    delete_org,
    deploy_org_settings,
    get_access_token,
    get_devhub_api,
    get_org_details,
    get_org_result,
    mutate_scratch_org,
    refresh_access_token,
    run_flow,
)

PATCH_ROOT = "metashare.api.sf_run_flow"


def test_capitalize():
    assert capitalize("fooBar") == "FooBar"


class TestRefreshAccessToken:
    def test_good(self):
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.jwt_session"))
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
            jwt_session = stack.enter_context(patch(f"{PATCH_ROOT}.jwt_session"))
            jwt_session.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=422)
            )
            stack.enter_context(patch(f"{PATCH_ROOT}.OrgConfig"))

            scratch_org = MagicMock()
            with pytest.raises(HTTPError, match=".*job ID.*"):
                refresh_access_token(
                    config=MagicMock(),
                    org_name=MagicMock(),
                    scratch_org=scratch_org,
                    originating_user_id=None,
                )

            assert scratch_org.remove_scratch_org.called

    def test_bad__no_job(self):
        with ExitStack() as stack:
            jwt_session = stack.enter_context(patch(f"{PATCH_ROOT}.jwt_session"))
            jwt_session.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=422)
            )
            stack.enter_context(patch(f"{PATCH_ROOT}.OrgConfig"))

            scratch_org = MagicMock()
            with pytest.raises(HTTPError, match=".*org still exists*"):
                refresh_access_token(
                    config=MagicMock(),
                    org_name=MagicMock(),
                    scratch_org=scratch_org,
                    originating_user_id=None,
                )

            assert scratch_org.remove_scratch_org.called


def test_get_devhub_api():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.jwt_session"))
        SimpleSalesforce = stack.enter_context(patch(f"{PATCH_ROOT}.SimpleSalesforce"))

        get_devhub_api(devhub_username="devhub_username")

        assert SimpleSalesforce.called


def test_get_org_details():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.os"))
        json = stack.enter_context(patch(f"{PATCH_ROOT}.json"))

        config, definition = get_org_details(
            cci=MagicMock(), org_name=MagicMock(), project_path=""
        )

        assert json.load.called


def test_get_org_result(settings):
    settings.SF_SIGNUP_INSTANCE = "cs68"
    result = get_org_result(
        email=MagicMock(),
        repo_owner=MagicMock(),
        repo_name=MagicMock(),
        repo_branch=MagicMock(),
        scratch_org_config=MagicMock(),
        scratch_org_definition={"edition": MagicMock()},
        cci=MagicMock(),
        devhub_api=MagicMock(),
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


def test_get_access_token():
    with patch(f"{PATCH_ROOT}.SalesforceOAuth2") as SalesforceOAuth2:
        get_access_token(org_result=MagicMock(), scratch_org_config=MagicMock())

        assert SalesforceOAuth2.called


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


def test_create_org_and_run_flow():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.os"))
        stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_devhub_api"))
        get_org_details = stack.enter_context(patch(f"{PATCH_ROOT}.get_org_details"))
        get_org_details.return_value = (MagicMock(), MagicMock())
        stack.enter_context(patch(f"{PATCH_ROOT}.get_org_result"))
        stack.enter_context(patch(f"{PATCH_ROOT}.mutate_scratch_org"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_access_token"))
        stack.enter_context(patch(f"{PATCH_ROOT}.deploy_org_settings"))
        stack.enter_context(patch(f"{PATCH_ROOT}.cd"))

        create_org(
            repo_owner=MagicMock(),
            repo_name=MagicMock(),
            repo_url=MagicMock(),
            repo_branch=MagicMock(),
            user=MagicMock(),
            project_path=MagicMock(),
            scratch_org=MagicMock(),
            originating_user_id=None,
        )
        run_flow(
            cci=MagicMock(),
            org_config=MagicMock(),
            flow_name=MagicMock(),
            project_path=MagicMock(),
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
