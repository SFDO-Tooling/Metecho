from unittest import mock

import pytest
from django.core.exceptions import SuspiciousOperation
from sfdo_template_helpers.crypto import fernet_decrypt, fernet_encrypt

from ..views import SalesforceOAuth2Adapter


class TestSalesforceOAuth2Adapter:
    def test_base_url(self, rf):
        request = rf.post("/")
        request.session = {}
        adapter = SalesforceOAuth2Adapter(request)
        assert adapter.base_url == "https://login.salesforce.com"

    def test_base_url__custom_domain(self, rf):
        request = rf.post("/", {"custom_domain": "foo-bar.baz"})
        request.session = {}
        adapter = SalesforceOAuth2Adapter(request)
        assert adapter.base_url == "https://foo-bar.baz.my.salesforce.com"

    def test_base_url__invalid_domain(self, rf):
        request = rf.post("/", {"custom_domain": "google.com?-"})
        request.session = {}
        with pytest.raises(SuspiciousOperation):
            SalesforceOAuth2Adapter(request).base_url

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
        request = rf.post("/")
        request.session = {"socialaccount_state": (None, "some-verifier")}
        adapter = SalesforceOAuth2Adapter(request)
        adapter.get_provider = mock.MagicMock()
        slfr = mock.MagicMock()
        slfr.account.extra_data = {}
        prov_ret = mock.MagicMock()
        prov_ret.sociallogin_from_response.return_value = slfr
        adapter.get_provider.return_value = prov_ret
        token = mock.MagicMock()
        token.token = fernet_encrypt("token")

        ret = adapter.complete_login(
            request, None, token, response={"instance_url": "https://example.com"}
        )
        assert ret.account.extra_data["instance_url"] == "https://example.com"

    def test_parse_token(self):
        adapter = SalesforceOAuth2Adapter(None)
        data = {"access_token": "token", "refresh_token": "token"}

        token = adapter.parse_token(data)
        assert "token" == fernet_decrypt(token.token)

    def test_validate_org_id__invalid(self, rf):
        request = rf.post("/")
        adapter = SalesforceOAuth2Adapter(request)
        with pytest.raises(SuspiciousOperation):
            adapter._validate_org_id("bogus")
