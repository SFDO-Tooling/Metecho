from allauth.socialaccount.providers.salesforce.provider import SalesforceProvider


class CustomSalesforceProvider(SalesforceProvider):
    package = "metashare.oauth2.salesforce"

    def get_auth_params(self, request, action):
        ret = super().get_auth_params(request, action)
        # This will ensure that even if you're logged in to Salesforce,
        # you'll be prompted to choose an identity to auth as:
        ret["prompt"] = "login"
        return ret

    def extract_uid(self, data):
        # The SalesforceProvider in allauth assumes that user_id is unique,
        # but it can be the same between multiple sandboxes that were
        # copied from the same production org. So we need to add the org id
        # too to disambiguate.
        return "{}/{}".format(data["organization_id"], data["user_id"])


provider_classes = [CustomSalesforceProvider]
