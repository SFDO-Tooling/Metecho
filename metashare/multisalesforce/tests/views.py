from unittest import mock

import pytest
from django.core.exceptions import SuspiciousOperation
from sfdo_template_helpers.crypto import fernet_decrypt, fernet_encrypt

from ..views import (
    LoggingOAuth2CallbackView,
    LoggingOAuth2LoginView,
    SalesforceOAuth2CustomAdapter,
    SalesforceOAuth2Mixin,
)


def test_SalesforceOAuth2CustomAdapter_base_url(rf):
    request = rf.get("/?custom_domain=foo-bar.baz")
    request.session = {}
    adapter = SalesforceOAuth2CustomAdapter(request)
    assert adapter.base_url == "https://foo-bar.baz.my.salesforce.com"


def test_SalesforceOAuth2CustomAdapter__invalid_domain(rf):
    request = rf.get("/?custom_domain=google.com?-")
    request.session = {}
    with pytest.raises(SuspiciousOperation):
        SalesforceOAuth2CustomAdapter(request).base_url


class TestSalesforceOAuth2Mixin:
    def test_complete_login(self, mocker, rf):
        # This is a mess of terrible mocking and I do not like it.
        # This is really just to exercise the mixin, and confirm that it
        # assigns instance_url
        get = mocker.patch("requests.get")
        userinfo_mock = mock.MagicMock()
        userinfo_mock.json.return_value = {
            "organization_id": "00D000000000001EAA",
            "urls": mock.MagicMock(),
        }
        get.side_effect = [userinfo_mock, mock.MagicMock(), mock.MagicMock()]
        adapter = SalesforceOAuth2Mixin()
        adapter.userinfo_url = None
        adapter.get_provider = mock.MagicMock()
        slfr = mock.MagicMock()
        slfr.account.extra_data = {}
        prov_ret = mock.MagicMock()
        prov_ret.sociallogin_from_response.return_value = slfr
        adapter.get_provider.return_value = prov_ret
        request = rf.get("/")
        request.session = {"socialaccount_state": (None, "some-verifier")}
        token = mock.MagicMock()
        token.token = fernet_encrypt("token")

        ret = adapter.complete_login(
            request, None, token, response={"instance_url": "https://example.com"}
        )
        assert ret.account.extra_data["instance_url"] == "https://example.com"

    def test_parse_token(self):
        adapter = SalesforceOAuth2CustomAdapter(request=None)
        data = {"access_token": "token", "refresh_token": "token"}

        token = adapter.parse_token(data)
        assert "token" == fernet_decrypt(token.token)

    def test_validate_org_id__invalid(self):
        adapter = SalesforceOAuth2Mixin()
        with pytest.raises(SuspiciousOperation):
            adapter._validate_org_id("bogus")


class TestLoggingOAuth2LoginView:
    def test_dispatch(self, rf, mocker):
        mocker.patch(
            "metashare.multisalesforce.views.OAuth2LoginView.dispatch"
        )
        logger = mocker.patch(
            "metashare.multisalesforce.views.logger.info"
        )
        request = rf.get("/")
        request.session = {"socialaccount_state": (None, "some-verifier")}

        LoggingOAuth2LoginView().dispatch(request)

        assert logger.called


class TestLoggingOAuth2CallbackView:
    def test_dispatch(self, rf, mocker):
        mocker.patch(
            "metashare.multisalesforce.views.OAuth2CallbackView.dispatch"
        )
        logger = mocker.patch(
            "metashare.multisalesforce.views.logger.info"
        )
        request = rf.get("/")
        request.session = {"state": "some-verifier"}

        LoggingOAuth2CallbackView().dispatch(request)

        assert logger.called
