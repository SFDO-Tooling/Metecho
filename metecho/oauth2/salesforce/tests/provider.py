from ..provider import CustomSalesforceProvider


def test_get_auth_params(rf):
    request = rf.get("/")
    result = CustomSalesforceProvider(request).get_auth_params(request, None)
    assert "prompt" in result and result["prompt"] == "login"


def test_extract_uid(rf):
    request = rf.get("/")
    provider = CustomSalesforceProvider(request)
    result = provider.extract_uid({"organization_id": "ORG", "user_id": "USER"})
    assert result == "ORG/USER"
