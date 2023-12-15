from ..provider import CustomSalesforceProvider
import pytest


@pytest.mark.django_db
def test_get_auth_params(rf, social_app_factory):
    request = rf.get("/")
    app = social_app_factory(
        name=CustomSalesforceProvider.id,
        provider=CustomSalesforceProvider.id,
    )
    result = CustomSalesforceProvider(request, app).get_auth_params(request, None)
    assert "prompt" in result and result["prompt"] == "login"


@pytest.mark.django_db
def test_extract_uid(rf, social_app_factory):
    request = rf.get("/")
    app = social_app_factory(
        name=CustomSalesforceProvider.id,
        provider=CustomSalesforceProvider.id,
    )
    provider = CustomSalesforceProvider(request, app)
    result = provider.extract_uid({"organization_id": "ORG", "user_id": "USER"})
    assert result == "ORG/USER"
