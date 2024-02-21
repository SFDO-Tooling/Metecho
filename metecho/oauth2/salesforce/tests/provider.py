import pytest

from ..provider import CustomSalesforceProvider


@pytest.mark.django_db
def test_get_auth_params(rf, social_app_factory):
    request = rf.get("/")
    app = social_app_factory(
        provider="salesforce",
    )
    provider = CustomSalesforceProvider(request, app)
    result = provider.get_auth_params(request, None)
    assert "prompt" in result and result["prompt"] == "login"


@pytest.mark.django_db
def test_extract_uid(rf, social_app_factory):
    request = rf.get("/")
    app = social_app_factory(
        provider="salesforce",
    )
    provider = CustomSalesforceProvider(request, app)
    result = provider.extract_uid({"organization_id": "ORG", "user_id": "USER"})
    assert result == "ORG/USER"
