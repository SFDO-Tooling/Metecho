from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_user_view(client):
    response = client.get(reverse("user"))

    assert response.status_code == 200
    assert response.json()["username"].endswith("@example.com")


@pytest.mark.django_db
def test_user_disconnect_view(client):
    response = client.post(reverse("user-disconnect-sf"))

    assert not client.user.socialaccount_set.filter(
        provider__startswith="salesforce-"
    ).exists()
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

    assert response.status_code == 202


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


@pytest.mark.django_db
class TestScratchOrgView:
    def test_commit_happy_path(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(org_type="Dev")
        with patch(
            "metashare.api.jobs.commit_changes_from_org_job"
        ) as commit_changes_from_org_job:
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {"commit_message": "Test message", "changes": {}},
                format="json",
            )
            assert response.status_code == 202
            assert commit_changes_from_org_job.delay.called

    def test_commit_sad_path(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(org_type="Dev")
        with patch(
            "metashare.api.jobs.commit_changes_from_org_job"
        ) as commit_changes_from_org_job:
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {"changes": {}},
                format="json",
            )
            assert response.status_code == 422
            assert not commit_changes_from_org_job.delay.called

    def test_list_fetch_changes(self, client, scratch_org_factory):
        scratch_org_factory()
        with patch(
            "metashare.api.jobs.get_unsaved_changes_job"
        ) as get_unsaved_changes_job:
            url = reverse("scratch-org-list")
            response = client.get(url)

            assert response.status_code == 200
            assert get_unsaved_changes_job.delay.called

    def test_retrieve_fetch_changes(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with patch(
            "metashare.api.jobs.get_unsaved_changes_job"
        ) as get_unsaved_changes_job:
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 200
            assert get_unsaved_changes_job.delay.called

    def test_queue_delete(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with patch("metashare.api.models.ScratchOrg.queue_delete"):
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.delete(url)

            assert response.status_code == 204
