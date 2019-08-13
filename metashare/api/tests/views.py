from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_user_view(client):
    response = client.get(reverse("user"))

    assert response.status_code == 200
    assert response.json()["username"].endswith("@example.com")


@pytest.mark.django_db
def test_user_refresh_view(client):
    with patch("metashare.api.gh.login") as login:
        repo = MagicMock()
        repo.url = "test"
        gh = MagicMock()
        gh.repositories.return_value = [repo]
        login.return_value = gh

        response = client.post(reverse("user-refresh"))

    assert response.status_code == 204


@pytest.mark.django_db
def test_repository_view(client, repository_factory, git_hub_repository_factory):
    git_hub_repository_factory(
        user=client.user, url="https://example.com/test-repo.git"
    )
    repository = repository_factory(repo_url="https://example.com/test-repo.git")
    repository_factory(repo_url="https://example.com/test-repo2.git")
    response = client.get(reverse("repository-list"))

    assert response.status_code == 200
    assert response.json() == {
        "count": 1,
        "previous": None,
        "next": None,
        "results": [
            {
                "id": str(repository.id),
                "description": "",
                "is_managed": False,
                "name": str(repository.name),
                "repo_url": "https://example.com/test-repo.git",
                "slug": str(repository.slug),
                "old_slugs": [],
            }
        ],
    }
