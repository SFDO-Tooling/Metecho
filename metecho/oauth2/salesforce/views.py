import logging
import re

import requests
from allauth.socialaccount.providers.salesforce.views import (
    SalesforceOAuth2Adapter as SalesforceOAuth2BaseAdapter,
)
from django.core.exceptions import SuspiciousOperation
from sfdo_template_helpers.crypto import fernet_decrypt, fernet_encrypt

from metecho.api.constants import ORGANIZATION_DETAILS

from ..views import (
    LoggingOAuth2CallbackView,
    LoggingOAuth2LoginView,
    ensure_socialapp_in_db,
)

logger = logging.getLogger(__name__)
ORGID_RE = re.compile(r"^00D[a-zA-Z0-9]{15}$")
CUSTOM_DOMAIN_RE = re.compile(r"^[a-zA-Z0-9.-]+$")


class SalesforcePermissionsError(Exception):
    pass


class SalesforceOAuth2Adapter(SalesforceOAuth2BaseAdapter):
    @property
    def base_url(self):
        custom_domain = self.request.POST.get(
            "custom_domain", self.request.session.get("custom_domain")
        )
        if custom_domain and not CUSTOM_DOMAIN_RE.match(custom_domain):
            raise SuspiciousOperation("Invalid custom domain")
        self.request.session["custom_domain"] = custom_domain
        if custom_domain == "login" or not custom_domain:
            base_url = "https://login.salesforce.com"
        else:
            base_url = "https://{}.my.salesforce.com".format(custom_domain)
        return base_url

    def get_org_details(self, extra_data, token):
        headers = {"Authorization": f"Bearer {token}"}

        # Confirm canModifyAllData:
        org_info_url = (extra_data["urls"]["rest"] + "connect/organization").format(
            version="44.0"
        )
        resp = requests.get(org_info_url, headers=headers)
        resp.raise_for_status()

        # Also contains resp.json()["name"], but not ["type"], so it's
        # insufficient to just call this endpoint.
        if not resp.json()["userSettings"]["canModifyAllData"]:  # pragma: nocover
            raise SalesforcePermissionsError

        # Get org name and type:
        org_id = extra_data["organization_id"]
        self._validate_org_id(org_id)
        org_url = (extra_data["urls"]["sobjects"] + "Organization/{org_id}").format(
            version="44.0", org_id=org_id
        )
        resp = requests.get(org_url, headers=headers)
        resp.raise_for_status()
        return resp.json()

    def complete_login(self, request, app, token, **kwargs):
        # make sure token is attached to a SocialApp in the db
        ensure_socialapp_in_db(token)

        token = fernet_decrypt(token.token)
        headers = {"Authorization": f"Bearer {token}"}
        verifier = request.session["socialaccount_state"][1]
        logger.info(
            "Calling back to Salesforce to complete login.",
            extra={"tag": "oauth", "context": {"verifier": verifier}},
        )
        resp = requests.get(self.userinfo_url, headers=headers)
        resp.raise_for_status()
        extra_data = resp.json()
        instance_url = kwargs.get("response", {}).get("instance_url", None)
        ret = self.get_provider().sociallogin_from_response(request, extra_data)
        ret.account.extra_data["instance_url"] = instance_url
        try:
            org_details = self.get_org_details(extra_data, token)
        except (
            requests.HTTPError,
            KeyError,
            SalesforcePermissionsError,
        ):  # pragma: nocover
            org_details = None

        ret.account.extra_data[ORGANIZATION_DETAILS] = org_details
        return ret

    def parse_token(self, data):
        """Wrap OAuth2Base.parse_token to encrypt tokens for storage.

        Called from OAuth2CallbackView"""
        data["access_token"] = fernet_encrypt(data["access_token"])
        data["refresh_token"] = fernet_encrypt(data["refresh_token"])
        return super().parse_token(data)

    def _validate_org_id(self, org_id):
        if not ORGID_RE.match(org_id):
            raise SuspiciousOperation("Invalid org Id")


oauth2_login = LoggingOAuth2LoginView.adapter_view(SalesforceOAuth2Adapter)
oauth2_callback = LoggingOAuth2CallbackView.adapter_view(SalesforceOAuth2Adapter)
