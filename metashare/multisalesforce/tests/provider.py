from ..provider import ProviderMixin


def test_get_auth_params():
    class ParentClass:
        def get_auth_params(self, request, action):
            return {}

    class ChildClass(ProviderMixin, ParentClass):
        pass

    result = ChildClass().get_auth_params(None, None)
    assert "prompt" in result and result["prompt"] == "login"


def test_extract_uid():
    provider = ProviderMixin()
    result = provider.extract_uid({"organization_id": "ORG", "user_id": "USER"})
    assert result == "ORG/USER"
