import json
from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse
from github3.exceptions import ResponseError

from ..models import SCRATCH_ORG_TYPES


@pytest.mark.django_db
def test_user_view(client):
    response = client.get(reverse("user"))

    assert response.status_code == 200
    assert response.json()["username"].endswith("@example.com")


@pytest.mark.django_db
def test_user_disconnect_view(client):
    response = client.post(reverse("user-disconnect-sf"))

    assert not client.user.socialaccount_set.filter(provider="salesforce").exists()
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
class TestRepositoryView:
    def test_refresh_github_users(
        self, client, repository_factory, git_hub_repository_factory
    ):
        git_hub_repository_factory(user=client.user, repo_id=123)
        repository = repository_factory(repo_id=123)
        with patch(
            "metashare.api.jobs.populate_github_users_job"
        ) as populate_github_users_job:
            response = client.post(
                reverse(
                    "repository-refresh-github-users", kwargs={"pk": str(repository.pk)}
                )
            )

            assert response.status_code == 202
            assert populate_github_users_job.delay.called

    def test_get_queryset(self, client, repository_factory, git_hub_repository_factory):
        git_hub_repository_factory(
            user=client.user, repo_id=123, repo_url="https://example.com/test-repo.git"
        )
        repo = repository_factory(repo_name="repo", repo_id=123)
        repository_factory(repo_name="repo2", repo_id=456)
        repository_factory(repo_name="repo3", repo_id=None)
        with patch("metashare.api.model_mixins.get_repo_info") as get_repo_info:
            get_repo_info.return_value = MagicMock(id=789)
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
                    "description_rendered": "",
                    "is_managed": False,
                    "slug": str(repo.slug),
                    "old_slugs": [],
                    "repo_url": (
                        f"https://github.com/{repo.repo_owner}/{repo.repo_name}"
                    ),
                    "github_users": [],
                }
            ],
        }

    def test_get_queryset__bad(
        self, client, repository_factory, git_hub_repository_factory
    ):
        git_hub_repository_factory(
            user=client.user, repo_id=123, repo_url="https://example.com/test-repo.git"
        )
        repo = repository_factory(repo_name="repo", repo_id=123)
        repository_factory(repo_name="repo2", repo_id=456)
        repository_factory(repo_name="repo3", repo_id=None)
        with patch("metashare.api.model_mixins.get_repo_info") as get_repo_info:
            get_repo_info.side_effect = ResponseError(MagicMock())
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
                    "description_rendered": "",
                    "is_managed": False,
                    "slug": str(repo.slug),
                    "old_slugs": [],
                    "repo_url": (
                        f"https://github.com/{repo.repo_owner}/{repo.repo_name}"
                    ),
                    "github_users": [],
                }
            ],
        }


@pytest.mark.django_db
class TestHookView:
    def test_202__push_not_forced(
        self,
        settings,
        client,
        repository_factory,
        git_hub_repository_factory,
        project_factory,
        task_factory,
    ):
        settings.GITHUB_HOOK_SECRET = b""
        repo = repository_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123)
        project = project_factory(repository=repo, branch_name="test-project")
        task = task_factory(project=project, branch_name="test-task")
        with patch("metashare.api.jobs.refresh_commits_job") as refresh_commits_job:
            response = client.post(
                reverse("hook"),
                json.dumps(
                    {
                        "ref": "refs/heads/test-task",
                        "forced": False,
                        "repository": {"id": 123},
                        "commits": [
                            {
                                "id": "123",
                                "author": {
                                    "name": "Test",
                                    "email": "test@example.com",
                                    "username": "test123",
                                },
                                "timestamp": "2019-11-20 21:32:53.668260+00:00",
                                "message": "Message",
                                "url": "https://github.com/test/user/foo",
                            }
                        ],
                        "sender": {
                            "login": "test123",
                            "avatar_url": "https://avatar_url/",
                        },
                    }
                ),
                content_type="application/json",
                # The sha1 hexdigest of the request body x the secret
                # key above:
                HTTP_X_HUB_SIGNATURE="sha1=6a5d470ca262a2522635f1adb71a13b18446dd54",
                HTTP_X_GITHUB_EVENT="push",
            )
            assert response.status_code == 202, response.content
            assert not refresh_commits_job.delay.called
            task.refresh_from_db()
            assert len(task.commits) == 1

    def test_400__no_handler(
        self, settings, client,
    ):
        settings.GITHUB_HOOK_SECRET = b""
        response = client.post(
            reverse("hook"),
            json.dumps({}),
            content_type="application/json",
            # The sha1 hexdigest of the request body x the secret
            # key above:
            HTTP_X_HUB_SIGNATURE="sha1=9b9585ab4f87eff122c8cd8e6fd94d358ed56f22",
            HTTP_X_GITHUB_EVENT="some unknown event",
        )
        assert response.status_code == 400, response.content

    def test_202__push_forced(
        self, settings, client, repository_factory, git_hub_repository_factory
    ):
        settings.GITHUB_HOOK_SECRET = b""
        repository_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123)
        with patch("metashare.api.jobs.refresh_commits_job") as refresh_commits_job:
            response = client.post(
                reverse("hook"),
                json.dumps(
                    {
                        "ref": "refs/heads/master",
                        "forced": True,
                        "repository": {"id": 123},
                        "commits": [],
                        "sender": {},
                    }
                ),
                content_type="application/json",
                # The sha1 hexdigest of the request body x the secret
                # key above:
                HTTP_X_HUB_SIGNATURE="sha1=01453662feaae85e7bb81452ffa7d3659294852d",
                HTTP_X_GITHUB_EVENT="push",
            )
            assert response.status_code == 202, response.content
            assert refresh_commits_job.delay.called

    def test_400__push_error(
        self, settings, client, repository_factory, git_hub_repository_factory
    ):
        settings.GITHUB_HOOK_SECRET = b""
        repository_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123)
        response = client.post(
            reverse("hook"),
            json.dumps(
                {
                    "ref": "refs/heads/master",
                    "repository": {"id": 123},
                    "commits": [],
                    "sender": {},
                }
            ),
            content_type="application/json",
            # This is NOT the sha1 hexdigest of the request body x the
            # secret key above:
            HTTP_X_HUB_SIGNATURE="sha1=6fc6f8c254a19276680948251ccb9644995c3692",
            HTTP_X_GITHUB_EVENT="push",
        )
        assert response.status_code == 400, response.json()

    def test_404__push_no_matching_repo(self, settings, client, repository_factory):
        settings.GITHUB_HOOK_SECRET = b""
        repository_factory()
        response = client.post(
            reverse("hook"),
            json.dumps(
                {
                    "ref": "refs/heads/master",
                    "forced": False,
                    "repository": {"id": 123},
                    "commits": [],
                    "sender": {},
                }
            ),
            content_type="application/json",
            # This is NOT the sha1 hexdigest of the request body x the
            # secret key above:
            HTTP_X_HUB_SIGNATURE="sha1=4129db8949c2aa1b82f850a68cc384019c0d73d0",
            HTTP_X_GITHUB_EVENT="push",
        )
        assert response.status_code == 404

    def test_403__push_bad_signature(self, settings, client, repository_factory):
        settings.GITHUB_HOOK_SECRET = b""
        repository_factory(repo_id=123)
        response = client.post(
            reverse("hook"),
            json.dumps(
                {
                    "ref": "refs/heads/master",
                    "forced": False,
                    "repository": {"id": 123},
                    "commits": [],
                    "sender": {},
                }
            ),
            content_type="application/json",
            # The sha1 hexdigest of the request body x the secret key
            # above:
            HTTP_X_HUB_SIGNATURE="sha1=b5aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaae8c",
            HTTP_X_GITHUB_EVENT="push",
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestScratchOrgView:
    def test_commit_happy_path(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(
            org_type="Dev",
            owner=client.user,
            valid_target_directories={"source": ["src"]},
        )
        with patch(
            "metashare.api.jobs.commit_changes_from_org_job"
        ) as commit_changes_from_org_job:
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {
                    "commit_message": "Test message",
                    "changes": {},
                    "target_directory": "src",
                },
                format="json",
            )
            assert response.status_code == 202
            assert commit_changes_from_org_job.delay.called

    def test_commit_invalid_target_directory(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(org_type="Dev", owner=client.user)
        with patch(
            "metashare.api.jobs.commit_changes_from_org_job"
        ) as commit_changes_from_org_job:
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {
                    "commit_message": "Test message",
                    "changes": {},
                    "target_directory": "src",
                },
                format="json",
            )
            assert response.status_code == 400
            assert not commit_changes_from_org_job.delay.called

    def test_commit_sad_path__400(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(org_type="Dev")
        with patch(
            "metashare.api.jobs.commit_changes_from_org_job"
        ) as commit_changes_from_org_job:
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {"changes": {}},
                format="json",
            )
            assert response.status_code == 400
            assert not commit_changes_from_org_job.delay.called

    def test_commit_sad_path__403(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(org_type="Dev")
        with patch(
            "metashare.api.jobs.commit_changes_from_org_job"
        ) as commit_changes_from_org_job:
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {
                    "commit_message": "Test message",
                    "changes": {},
                    "target_directory": "src",
                },
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
            provider="salesforce",
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
            provider="salesforce",
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
            user=client.user, provider="salesforce",
        )
        scratch_org = scratch_org_factory(owner=client.user)
        with patch("metashare.api.models.ScratchOrg.queue_delete"):
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.delete(url)

            assert response.status_code == 204

    def test_queue_delete__bad(
        self, client, scratch_org_factory, social_account_factory
    ):
        social_account_factory(
            user=client.user, provider="salesforce-production",
        )
        scratch_org = scratch_org_factory()
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

    def test_refresh__good(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory(owner=client.user)
        with ExitStack() as stack:
            refresh_scratch_org_job = stack.enter_context(
                patch("metashare.api.jobs.refresh_scratch_org_job")
            )
            url = reverse("scratch-org-refresh", kwargs={"pk": str(scratch_org.id)})
            response = client.post(url)

            assert response.status_code == 202
            assert refresh_scratch_org_job.delay.called

    def test_refresh__bad(self, client, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with patch(
            "metashare.api.jobs.refresh_scratch_org_job"
        ) as refresh_scratch_org_job:
            url = reverse("scratch-org-refresh", kwargs={"pk": str(scratch_org.id)})
            response = client.post(url)

            assert response.status_code == 403
            assert not refresh_scratch_org_job.delay.called


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

            assert response.status_code == 400

    def test_create_pr__bad(self, client, task_factory):
        task = task_factory(pr_is_open=True)
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

    def test_review__good(self, client, task_factory):
        task = task_factory(pr_is_open=True, review_valid=True)
        with patch("metashare.api.jobs.submit_review_job") as submit_review_job:
            data = {
                "notes": "",
                "status": "Approved",
                "delete_org": False,
                "org": "",
            }
            response = client.post(
                reverse("task-review", kwargs={"pk": str(task.id)}), data
            )

            assert response.status_code == 202, response.json()
            assert submit_review_job.delay.called

    def test_review__bad(self, client, task_factory):
        task = task_factory(pr_is_open=True, review_valid=True)
        response = client.post(reverse("task-review", kwargs={"pk": str(task.id)}), {})

        assert response.status_code == 400

    def test_review__bad_pr_closed(self, client, task_factory):
        task = task_factory(pr_is_open=False, review_valid=True)
        data = {
            "notes": "",
            "status": "Approved",
            "delete_org": False,
            "org": "",
        }
        response = client.post(
            reverse("task-review", kwargs={"pk": str(task.id)}), data
        )

        assert response.status_code == 400

    def test_review__bad_invalid_review(self, client, task_factory):
        task = task_factory(pr_is_open=True, review_valid=False)
        data = {
            "notes": "",
            "status": "Approved",
            "delete_org": False,
            "org": "",
        }
        response = client.post(
            reverse("task-review", kwargs={"pk": str(task.id)}), data
        )

        assert response.status_code == 400
