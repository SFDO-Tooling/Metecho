from ..provider import CustomSalesforceProvider
from allauth.socialaccount.models import SocialApp
import pytest

@pytest.fixture
def dummy_app():
    app = SocialApp.objects.create(
        provider=CustomSalesforceProvider.id,
            name=CustomSalesforceProvider.id,
            client_id="app123id",
            key=CustomSalesforceProvider.id,
            secret="dummy",
    )
    return app

@pytest.mark.django_db
def test_get_auth_params(rf, dummy_app):
    request = rf.get("/")
    result = CustomSalesforceProvider(request, dummy_app).get_auth_params(request, None)
    assert "prompt" in result and result["prompt"] == "login"

@pytest.mark.django_db
def test_extract_uid(rf, dummy_app):
    request = rf.get("/")
    provider = CustomSalesforceProvider(request, dummy_app)
    result = provider.extract_uid({"organization_id": "ORG", "user_id": "USER"})
    assert result == "ORG/USER"
