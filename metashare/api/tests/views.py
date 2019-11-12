from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse

from ..models import SCRATCH_ORG_TYPES


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
        scratch_org = scratch_org_factory(org_type="Dev", owner=client.user)
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

    def test_commit_sad_path__422(self, client, scratch_org_factory):
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

    def test_commit_sad_path__403(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(org_type="Dev")
        with patch(
            "metashare.api.jobs.commit_changes_from_org_job"
        ) as commit_changes_from_org_job:
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {"commit_message": "Test message", "changes": {}},
                format="json",
            )
            assert response.status_code == 403
            assert not commit_changes_from_org_job.delay.called

    def test_list_fetch_changes(self, client, scratch_org_factory):
        scratch_org_factory(
            org_type=SCRATCH_ORG_TYPES.Dev,
            url="https://example.com",
            delete_queued_at=None,
            currently_capturing_changes=False,
            currently_refreshing_changes=False,
            owner=client.user,
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
            owner=client.user,
        )
        with patch(
            "metashare.api.jobs.get_unsaved_changes_job"
        ) as get_unsaved_changes_job:
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 200
            assert get_unsaved_changes_job.delay.called

    def test_create(self, client, task_factory, social_account_factory):
        task = task_factory()
        social_account_factory(
            user=client.user,
            provider="salesforce-production",
            extra_data={"preferred_username": "test-username"},
        )
        url = reverse("scratch-org-list")
        with ExitStack() as stack:
            stack.enter_context(
                patch("metashare.api.views.viewsets.ModelViewSet.perform_create")
            )
            get_devhub_api = stack.enter_context(
                patch("metashare.api.models.get_devhub_api")
            )
            resp = {"foo": "bar"}
            sf_client = MagicMock()
            sf_client.restful.return_value = resp
            get_devhub_api.return_value = sf_client

            response = client.post(url, {"task": str(task.id), "org_type": "Dev"})

        assert response.status_code == 201, response.content

    def test_create__bad(self, client, task_factory, social_account_factory):
        task = task_factory()
        social_account_factory(
            user=client.user,
            provider="salesforce-production",
            extra_data={"preferred_username": "test-username"},
        )
        url = reverse("scratch-org-list")
        with ExitStack() as stack:
            stack.enter_context(
                patch("metashare.api.views.viewsets.ModelViewSet.perform_create")
            )
            get_devhub_api = stack.enter_context(
                patch("metashare.api.models.get_devhub_api")
            )
            sf_client = MagicMock()
            sf_client.restful.return_value = None
            get_devhub_api.return_value = sf_client

            response = client.post(url, {"task": str(task.id), "org_type": "Dev"})

        assert response.status_code == 403, response.content

    def test_queue_delete(self, client, scratch_org_factory, social_account_factory):
        social_account_factory(
            user=client.user,
            provider="salesforce-production",
            extra_data={"preferred_username": "test-username"},
        )
        scratch_org = scratch_org_factory(owner_sf_id="test-username")
        with patch("metashare.api.models.ScratchOrg.queue_delete"):
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.delete(url)

            assert response.status_code == 204

    def test_queue_delete__bad(
        self, client, scratch_org_factory, social_account_factory
    ):
        social_account_factory(
            user=client.user,
            provider="salesforce-production",
            extra_data={"preferred_username": "test-username"},
        )
        scratch_org = scratch_org_factory(owner_sf_id="other-test-username")
        with patch("metashare.api.models.ScratchOrg.queue_delete"):
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.delete(url)

            assert response.status_code == 403

    def test_redirect__good(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(owner=client.user)
        with patch("metashare.api.models.ScratchOrg.get_login_url") as get_login_url:
            get_login_url.return_value = "https://example.com"
            url = reverse("scratch-org-redirect", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 302

    def test_redirect__bad(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with patch("metashare.api.models.ScratchOrg.get_login_url") as get_login_url:
            get_login_url.return_value = "https://example.com"
            url = reverse("scratch-org-redirect", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 403


@pytest.mark.django_db
class TestTaskView:
    def test_create_pr(self, client, task_factory):
        task = task_factory()
        with patch("metashare.api.models.Task.queue_create_pr"):
            url = reverse("task-create-pr", kwargs={"pk": str(task.id)})
            response = client.post(
                url,
                {
                    "title": "My PR",
                    "critical_changes": "",
                    "additional_changes": "",
                    "issues": "",
                    "notes": "",
                },
                format="json",
            )

            assert response.status_code == 202, response.json()

    def test_create_pr__error(self, client, task_factory):
        task = task_factory()
        with patch("metashare.api.models.Task.queue_create_pr"):
            url = reverse("task-create-pr", kwargs={"pk": str(task.id)})
            response = client.post(url, {}, format="json")

            assert response.status_code == 422

    def test_create_pr__bad(self, client, task_factory):
        task = task_factory(pr_number=123)
        with patch("metashare.api.models.Task.queue_create_pr"):
            url = reverse("task-create-pr", kwargs={"pk": str(task.id)})
            response = client.post(
                url,
                {
                    "title": "My PR",
                    "critical_changes": "",
                    "additional_changes": "",
                    "issues": "",
                    "notes": "",
                },
                format="json",
            )

            assert response.status_code == 400
