from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse
from sfdo_template_helpers.crypto import fernet_encrypt

from ..models import SCRATCH_ORG_TYPES


@pytest.mark.django_db
class TestUserView:
    def test_refresh_token_good(self, client, social_account_factory):
        social_account = social_account_factory(
            user=client.user, provider="salesforce-production"
        )
        social_token = social_account.socialtoken_set.first()
        social_token.token_secret = fernet_encrypt(social_token.token_secret)
        social_token.save()
        with patch("metashare.api.views.requests.post") as post:
            response_json = MagicMock(return_value={"access_token": "test"})
            post.return_value = MagicMock(json=response_json)
            response = client.get(reverse("user"))

            assert response.status_code == 200
            assert response.json()["username"].endswith("@example.com")

    def test_refresh_token_bad(self, client, social_account_factory):
        social_account = social_account_factory(
            user=client.user, provider="salesforce-production"
        )
        social_token = social_account.socialtoken_set.first()
        social_token.token_secret = "I am not Fernet encrypted"
        social_token.save()
        with ExitStack() as stack:
            post = stack.enter_context(patch("metashare.api.views.requests.post"))
            fernet_encrypt = stack.enter_context(
                patch("metashare.api.views.fernet_encrypt")
            )
            response_json = MagicMock(return_value={"access_token": "test"})
            post.return_value = MagicMock(json=response_json)
            response = client.get(reverse("user"))

            assert not fernet_encrypt.called
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
    with patch("metashare.api.gh.gh_given_user") as gh_given_user:
        repo = MagicMock()
        repo.url = "test"
        gh = MagicMock()
        gh.repositories.return_value = [repo]
        gh_given_user.return_value = gh

        response = client.post(reverse("user-refresh"))

    assert response.status_code == 202


@pytest.mark.django_db
def test_repository_view(client, repository_factory, git_hub_repository_factory):
    git_hub_repository_factory(
        user=client.user, repo_id=123, repo_url="https://example.com/test-repo.git"
    )
    repo = repository_factory(repo_name="repo", repo_id=123)
    repository_factory(repo_name="repo2", repo_id=456)
    repository_factory(repo_name="repo3", repo_id=None)
    response = client.get(reverse("repository-list"))

    assert response.status_code == 200
    assert response.json() == {
        "count": 1,
        "previous": None,
        "next": None,
        "results": [
            {
                "id": str(repo.id),
                "name": str(repo.name),
                "description": "",
                "is_managed": False,
                "slug": str(repo.slug),
                "old_slugs": [],
                "repo_url": f"https://github.com/{repo.repo_owner}/{repo.repo_name}",
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
        scratch_org_factory(
            org_type=SCRATCH_ORG_TYPES.Dev,
            url="https://example.com",
            delete_queued_at=None,
            currently_capturing_changes=False,
            currently_refreshing_changes=False,
        )
        with patch(
            "metashare.api.jobs.get_unsaved_changes_job"
        ) as get_unsaved_changes_job:
            url = reverse("scratch-org-list")
            response = client.get(url)

            assert response.status_code == 200
            assert get_unsaved_changes_job.delay.called

    def test_retrieve_fetch_changes(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(
            org_type=SCRATCH_ORG_TYPES.Dev,
            url="https://example.com",
            delete_queued_at=None,
            currently_capturing_changes=False,
            currently_refreshing_changes=False,
        )
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

    def test_redirect(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with patch("metashare.api.models.ScratchOrg.get_login_url") as get_login_url:
            get_login_url.return_value = "https://example.com"
            url = reverse("scratch-org-redirect", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 302
