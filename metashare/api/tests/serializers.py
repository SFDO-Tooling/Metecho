import pytest

from ..serializers import ProductSerializer


@pytest.mark.django_db
class TestProductSerializer:
    def test_validate_repo_url(self):
        serializer = ProductSerializer(
            data={
                "name": "Test name",
                "repo_url": "http://github.com/test/repo.git",
                "description": "",
                "is_managed": False,
            }
        )
        assert not serializer.is_valid()
        assert "repo_url" in serializer.errors
