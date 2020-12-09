import json
from collections import namedtuple
from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse
from github3.exceptions import ResponseError

from ..models import SCRATCH_ORG_TYPES

Branch = namedtuple("Branch", ["name"])


@pytest.mark.django_db
class TestUserView:
    def test_get(self, client):
        response = client.get(reverse("user"))

        assert response.status_code == 200
        assert response.json()["username"].endswith("@example.com")

    def test_agree_to_tos(self, client):
        response = client.put(reverse("agree-to-tos"))

        assert response.status_code == 200
        assert response.json()["username"].endswith("@example.com")
        assert response.json()["agreed_to_tos_at"] is not None


@pytest.mark.django_db
def test_user_disconnect_view(client):
    response = client.post(reverse("user-disconnect-sf"))

    assert not client.user.socialaccount_set.filter(provider="salesforce").exists()
    assert response.status_code == 200
    assert response.json()["username"].endswith("@example.com")


@pytest.mark.django_db
def test_user_refresh_view(client):
    with patch("metecho.api.gh.gh_given_user") as gh_given_user:
        repo = MagicMock()
        repo.url = "test"
        gh = MagicMock()
        gh.repositories.return_value = [repo]
        gh_given_user.return_value = gh

        response = client.post(reverse("user-refresh"))

    assert response.status_code == 202


@pytest.mark.django_db
class TestProjectView:
    def test_refresh_github_users(
        self, client, project_factory, git_hub_repository_factory
    ):
        git_hub_repository_factory(user=client.user, repo_id=123)
        project = project_factory(repo_id=123)
        with patch(
            "metecho.api.jobs.populate_github_users_job"
        ) as populate_github_users_job:
            response = client.post(
                reverse("project-refresh-github-users", kwargs={"pk": str(project.pk)})
            )

            assert response.status_code == 202
            assert populate_github_users_job.delay.called

    def test_feature_branches(
        self, client, project_factory, git_hub_repository_factory
    ):
        git_hub_repository_factory(user=client.user, repo_id=123)
        project = project_factory(repo_id=123)
        with patch("metecho.api.views.gh.get_repo_info") as get_repo_info:
            repo = MagicMock(
                **{
                    "branches.return_value": [
                        Branch(name="include_me"),
                        Branch(name="omit__me"),
                    ]
                }
            )
            get_repo_info.return_value = repo

            response = client.get(
                reverse("project-feature-branches", kwargs={"pk": str(project.id)})
            )
            assert response.json() == ["include_me"]

    def test_get_queryset(self, client, project_factory, git_hub_repository_factory):
        git_hub_repository_factory(
            user=client.user, repo_id=123, repo_url="https://example.com/test-repo.git"
        )
        project = project_factory(repo_name="repo", repo_id=123)
        project_factory(repo_name="repo2", repo_id=456)
        project_factory(repo_name="repo3", repo_id=None)
        with patch("metecho.api.model_mixins.get_repo_info") as get_repo_info:
            get_repo_info.return_value = MagicMock(id=789)
            response = client.get(reverse("project-list"))

        assert response.status_code == 200
        assert response.json() == {
            "count": 1,
            "previous": None,
            "next": None,
            "results": [
                {
                    "id": str(project.id),
                    "name": str(project.name),
                    "description": "",
                    "description_rendered": "",
                    "is_managed": False,
                    "slug": str(project.slug),
                    "old_slugs": [],
                    "repo_url": (
                        f"https://github.com/{project.repo_owner}/{project.repo_name}"
                    ),
                    "repo_owner": str(project.repo_owner),
                    "repo_name": str(project.repo_name),
                    "branch_prefix": "",
                    "github_users": [],
                    "repo_image_url": "",
                }
            ],
        }

    def test_get_queryset__bad(
        self, client, project_factory, git_hub_repository_factory
    ):
        git_hub_repository_factory(
            user=client.user, repo_id=123, repo_url="https://example.com/test-repo.git"
        )
        project = project_factory(repo_name="repo", repo_id=123)
        project_factory(repo_name="repo2", repo_id=456)
        project_factory(repo_name="repo3", repo_id=None)
        with patch("metecho.api.model_mixins.get_repo_info") as get_repo_info:
            get_repo_info.side_effect = ResponseError(MagicMock())
            response = client.get(reverse("project-list"))

        assert response.status_code == 200
        assert response.json() == {
            "count": 1,
            "previous": None,
            "next": None,
            "results": [
                {
                    "id": str(project.id),
                    "name": str(project.name),
                    "description": "",
                    "description_rendered": "",
                    "is_managed": False,
                    "slug": str(project.slug),
                    "old_slugs": [],
                    "repo_url": (
                        f"https://github.com/{project.repo_owner}/{project.repo_name}"
                    ),
                    "repo_owner": str(project.repo_owner),
                    "repo_name": str(project.repo_name),
                    "branch_prefix": "",
                    "github_users": [],
                    "repo_image_url": "",
                }
            ],
        }


@pytest.mark.django_db
class TestHookView:
    def test_202__push_not_forced(
        self,
        settings,
        client,
        project_factory,
        git_hub_repository_factory,
        epic_factory,
        task_factory,
    ):
        settings.GITHUB_HOOK_SECRET = b""
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metecho.api.models.gh"))
            gh.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(
                            number=123,
                            closed_at=None,
                            is_merged=False,
                        )
                        for _ in range(1)
                    ),
                    "compare_commits.return_value": MagicMock(ahead_by=0),
                }
            )
            gh.normalize_commit.return_value = "1234abcd"

            project = project_factory(repo_id=123)
            git_hub_repository_factory(repo_id=123)
            epic = epic_factory(project=project, branch_name="test-epic")
            task = task_factory(epic=epic, branch_name="test-task")

            refresh_commits_job = stack.enter_context(
                patch("metecho.api.jobs.refresh_commits_job")
            )
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
        self,
        settings,
        client,
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
        self, settings, client, project_factory, git_hub_repository_factory
    ):
        settings.GITHUB_HOOK_SECRET = b""
        project_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123)
        with patch("metecho.api.jobs.refresh_commits_job") as refresh_commits_job:
            response = client.post(
                reverse("hook"),
                json.dumps(
                    {
                        "ref": "refs/heads/main",
                        "forced": True,
                        "repository": {"id": 123},
                        "commits": [],
                        "sender": {},
                    }
                ),
                content_type="application/json",
                # The sha1 hexdigest of the request body x the secret
                # key above:
                HTTP_X_HUB_SIGNATURE="sha1=7724a4777b8215f158efbe74f05ce6eaa5ec41a8",
                HTTP_X_GITHUB_EVENT="push",
            )
            assert response.status_code == 202, response.content
            assert refresh_commits_job.delay.called

    def test_400__push_error(
        self, settings, client, project_factory, git_hub_repository_factory
    ):
        settings.GITHUB_HOOK_SECRET = b""
        project_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123)
        response = client.post(
            reverse("hook"),
            json.dumps(
                {
                    "ref": "refs/heads/main",
                    "repository": {"id": 123},
                    "commits": [],
                    "sender": {},
                }
            ),
            content_type="application/json",
            # This is NOT the sha1 hexdigest of the request body x the
            # secret key above:
            HTTP_X_HUB_SIGNATURE="sha1=b8a47d6885fbf7d64efa1d549600f1ac87c41f91",
            HTTP_X_GITHUB_EVENT="push",
        )
        assert response.status_code == 400, response.json()

    def test_404__push_no_matching_repo(self, settings, client, project_factory):
        settings.GITHUB_HOOK_SECRET = b""
        project_factory(repo_id=456)
        response = client.post(
            reverse("hook"),
            json.dumps(
                {
                    "ref": "refs/heads/main",
                    "forced": False,
                    "repository": {"id": 8489},
                    "commits": [],
                    "sender": {},
                }
            ),
            content_type="application/json",
            # This is NOT the sha1 hexdigest of the request body x the
            # secret key above:
            HTTP_X_HUB_SIGNATURE="sha1=5a3798b4d8aacbbc49e13f3fac3bb3187f46cf8b",
            HTTP_X_GITHUB_EVENT="push",
        )
        assert response.status_code == 404

    def test_403__push_bad_signature(self, settings, client, project_factory):
        settings.GITHUB_HOOK_SECRET = b""
        project_factory(repo_id=123)
        response = client.post(
            reverse("hook"),
            json.dumps(
                {
                    "ref": "refs/heads/main",
                    "forced": False,
                    "repository": {"id": 123},
                    "commits": [],
                    "sender": {},
                }
            ),
            content_type="application/json",
            HTTP_X_HUB_SIGNATURE="sha1=b5aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaae8c",
            HTTP_X_GITHUB_EVENT="push",
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestScratchOrgView:
    def test_commit_happy_path(self, client, scratch_org_factory):
        with ExitStack() as stack:
            commit_changes_from_org_job = stack.enter_context(
                patch("metecho.api.jobs.commit_changes_from_org_job")
            )

            scratch_org = scratch_org_factory(
                org_type="Dev",
                owner=client.user,
                valid_target_directories={"source": ["src"]},
            )
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
        with ExitStack() as stack:
            scratch_org = scratch_org_factory(org_type="Dev", owner=client.user)

            commit_changes_from_org_job = stack.enter_context(
                patch("metecho.api.jobs.commit_changes_from_org_job")
            )
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
        with ExitStack() as stack:
            scratch_org = scratch_org_factory(org_type="Dev")

            commit_changes_from_org_job = stack.enter_context(
                patch("metecho.api.jobs.commit_changes_from_org_job")
            )
            response = client.post(
                reverse("scratch-org-commit", kwargs={"pk": str(scratch_org.id)}),
                {"changes": {}},
                format="json",
            )
            assert response.status_code == 400
            assert not commit_changes_from_org_job.delay.called

    def test_commit_sad_path__403(self, client, scratch_org_factory):
        with ExitStack() as stack:
            scratch_org = scratch_org_factory(org_type="Dev")

            commit_changes_from_org_job = stack.enter_context(
                patch("metecho.api.jobs.commit_changes_from_org_job")
            )
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
        with ExitStack() as stack:
            scratch_org_factory(
                org_type=SCRATCH_ORG_TYPES.Dev,
                url="https://example.com",
                is_created=True,
                delete_queued_at=None,
                currently_capturing_changes=False,
                currently_refreshing_changes=False,
                owner=client.user,
            )

            get_unsaved_changes_job = stack.enter_context(
                patch("metecho.api.jobs.get_unsaved_changes_job")
            )
            url = reverse("scratch-org-list")
            response = client.get(url)

            assert response.status_code == 200
            assert get_unsaved_changes_job.delay.called

    def test_retrieve_fetch_changes(self, client, scratch_org_factory):
        with ExitStack() as stack:
            scratch_org = scratch_org_factory(
                org_type=SCRATCH_ORG_TYPES.Dev,
                url="https://example.com",
                is_created=True,
                delete_queued_at=None,
                currently_capturing_changes=False,
                currently_refreshing_changes=False,
                owner=client.user,
            )

            get_unsaved_changes_job = stack.enter_context(
                patch("metecho.api.jobs.get_unsaved_changes_job")
            )
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 200
            assert get_unsaved_changes_job.delay.called

    def test_create(self, client, task_factory, social_account_factory):
        with ExitStack() as stack:
            task = task_factory()
            social_account_factory(
                user=client.user,
                provider="salesforce",
                extra_data={"preferred_username": "test-username"},
            )
            url = reverse("scratch-org-list")

            stack.enter_context(patch("metecho.api.views.ModelViewSet.perform_create"))
            get_devhub_api = stack.enter_context(
                patch("metecho.api.models.get_devhub_api")
            )
            resp = {"foo": "bar"}
            sf_client = MagicMock()
            sf_client.restful.return_value = resp
            get_devhub_api.return_value = sf_client

            response = client.post(url, {"task": str(task.id), "org_type": "Dev"})

        assert response.status_code == 201, response.content

    def test_create__bad(self, client, task_factory, social_account_factory):
        with ExitStack() as stack:
            task = task_factory()
            social_account_factory(
                user=client.user,
                provider="salesforce",
                extra_data={"preferred_username": "test-username"},
            )
            url = reverse("scratch-org-list")

            stack.enter_context(patch("metecho.api.views.ModelViewSet.perform_create"))
            get_devhub_api = stack.enter_context(
                patch("metecho.api.models.get_devhub_api")
            )
            sf_client = MagicMock()
            sf_client.restful.return_value = None
            get_devhub_api.return_value = sf_client

            response = client.post(url, {"task": str(task.id), "org_type": "Dev"})

        assert response.status_code == 403, response.content

    def test_queue_delete(self, client, scratch_org_factory, social_account_factory):
        with ExitStack() as stack:
            social_account_factory(
                user=client.user,
                provider="salesforce",
            )
            scratch_org = scratch_org_factory(owner=client.user)

            stack.enter_context(patch("metecho.api.models.ScratchOrg.queue_delete"))
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.delete(url)

            assert response.status_code == 204

    def test_queue_delete__bad(
        self, client, scratch_org_factory, social_account_factory
    ):
        with ExitStack() as stack:
            social_account_factory(
                user=client.user,
                provider="salesforce-production",
            )
            scratch_org = scratch_org_factory()

            stack.enter_context(patch("metecho.api.models.ScratchOrg.queue_delete"))
            url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
            response = client.delete(url)

            assert response.status_code == 403

    def test_redirect__good(self, client, scratch_org_factory):
        with ExitStack() as stack:
            scratch_org = scratch_org_factory(owner=client.user)

            get_login_url = stack.enter_context(
                patch("metecho.api.models.ScratchOrg.get_login_url")
            )
            get_login_url.return_value = "https://example.com"
            url = reverse("scratch-org-redirect", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 302

    def test_redirect__bad(self, client, scratch_org_factory):
        with ExitStack() as stack:
            scratch_org = scratch_org_factory()

            get_login_url = stack.enter_context(
                patch("metecho.api.models.ScratchOrg.get_login_url")
            )
            get_login_url.return_value = "https://example.com"
            url = reverse("scratch-org-redirect", kwargs={"pk": str(scratch_org.id)})
            response = client.get(url)

            assert response.status_code == 403

    def test_refresh__good(self, client, scratch_org_factory):
        with ExitStack() as stack:
            scratch_org = scratch_org_factory(owner=client.user)

            refresh_scratch_org_job = stack.enter_context(
                patch("metecho.api.jobs.refresh_scratch_org_job")
            )
            url = reverse("scratch-org-refresh", kwargs={"pk": str(scratch_org.id)})
            response = client.post(url)

            assert response.status_code == 202
            assert refresh_scratch_org_job.delay.called

    def test_refresh__bad(self, client, scratch_org_factory):
        with ExitStack() as stack:
            scratch_org = scratch_org_factory()

            refresh_scratch_org_job = stack.enter_context(
                patch("metecho.api.jobs.refresh_scratch_org_job")
            )
            url = reverse("scratch-org-refresh", kwargs={"pk": str(scratch_org.id)})
            response = client.post(url)

            assert response.status_code == 403
            assert not refresh_scratch_org_job.delay.called


@pytest.mark.django_db
class TestTaskView:
    def test_create_pr(self, client, task_factory):
        with ExitStack() as stack:
            task = task_factory()

            stack.enter_context(patch("metecho.api.models.Task.queue_create_pr"))
            url = reverse("task-create-pr", kwargs={"pk": str(task.id)})
            response = client.post(
                url,
                {
                    "title": "My PR",
                    "critical_changes": "",
                    "additional_changes": "",
                    "issues": "",
                    "notes": "",
                    "alert_assigned_qa": True,
                },
                format="json",
            )

            assert response.status_code == 202, response.json()

    def test_create_pr__error(self, client, task_factory):
        with ExitStack() as stack:
            task = task_factory()

            stack.enter_context(patch("metecho.api.models.Task.queue_create_pr"))
            url = reverse("task-create-pr", kwargs={"pk": str(task.id)})
            response = client.post(url, {}, format="json")

            assert response.status_code == 400

    def test_create_pr__bad(self, client, task_factory):
        with ExitStack() as stack:
            task = task_factory(pr_is_open=True)

            stack.enter_context(patch("metecho.api.models.Task.queue_create_pr"))
            url = reverse("task-create-pr", kwargs={"pk": str(task.id)})
            response = client.post(
                url,
                {
                    "title": "My PR",
                    "critical_changes": "",
                    "additional_changes": "",
                    "issues": "",
                    "notes": "",
                    "alert_assigned_qa": True,
                },
                format="json",
            )

            assert response.status_code == 400

    def test_review__good(self, client, task_factory):
        with ExitStack() as stack:
            task = task_factory(pr_is_open=True, review_valid=True)

            submit_review_job = stack.enter_context(
                patch("metecho.api.jobs.submit_review_job")
            )
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

    def test_can_reassign__good(self, client, task_factory):
        task = task_factory()

        data = {
            "role": "assigned_qa",
            "gh_uid": "123",
        }
        response = client.post(
            reverse("task-can-reassign", kwargs={"pk": str(task.id)}), data
        )

        assert response.status_code == 200
        assert response.json() == {"can_reassign": False}

    def test_can_reassign__bad(self, client, task_factory):
        task = task_factory()

        data = {}
        response = client.post(
            reverse("task-can-reassign", kwargs={"pk": str(task.id)}), data
        )

        assert response.status_code == 400


@pytest.mark.django_db
class TestEpicView:
    def test_refresh_org_config_names(self, client, epic_factory):
        with ExitStack() as stack:
            epic = epic_factory()

            available_task_org_config_names_job = stack.enter_context(
                patch("metecho.api.jobs.available_task_org_config_names_job")
            )
            response = client.post(
                reverse("epic-refresh-org-config-names", kwargs={"pk": str(epic.id)})
            )

            assert response.status_code == 202, response.json()
            assert available_task_org_config_names_job.delay.called
