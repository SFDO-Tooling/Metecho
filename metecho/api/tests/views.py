import json
from collections import namedtuple
from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse
from github3.exceptions import ResponseError
from rest_framework import status

from metecho.api.serializers import EpicSerializer, TaskSerializer

from ..models import SCRATCH_ORG_TYPES

Branch = namedtuple("Branch", ["name"])

fixture = pytest.lazy_fixture


@pytest.mark.django_db
class TestCurrentUserViewSet:
    def test_get(self, client):
        response = client.get(reverse("current-user-detail"))
        assert response.status_code == 200
        assert response.json()["username"] == client.user.username

    def test_agree_to_tos(self, client):
        response = client.put(reverse("current-user-agree-to-tos"))
        assert response.status_code == 200
        assert response.json()["username"] == client.user.username
        assert response.json()["agreed_to_tos_at"] is not None

    def test_complete_onboarding(self, client):
        response = client.put(reverse("current-user-complete-onboarding"))
        assert response.status_code == 200
        assert response.json()["username"] == client.user.username
        assert response.json()["onboarded_at"] is not None

    @pytest.mark.parametrize(
        "data, enabled, state",
        (
            ({"enabled": False}, False, None),  # Only enabled
            ({"state": [1, 2, 3]}, True, [1, 2, 3]),  # Only state
            # Enabled + state
            ({"enabled": True, "state": {"a": "b"}}, True, {"a": "b"}),
        ),
    )
    def test_guided_tour(self, client, data, enabled, state):
        response = client.post(
            reverse("current-user-guided-tour"), data=data, format="json"
        )
        assert response.status_code == 200
        assert response.json()["username"] == client.user.username
        assert response.json()["self_guided_tour_enabled"] == enabled
        assert response.json()["self_guided_tour_state"] == state

    def test_disconnect(self, client):
        response = client.post(reverse("current-user-disconnect"))
        assert not client.user.socialaccount_set.filter(provider="salesforce").exists()
        assert response.status_code == 200
        assert response.json()["username"] == client.user.username

    def test_refresh(self, client, mocker):
        refresh_github_repositories_for_user_job = mocker.patch(
            "metecho.api.jobs.refresh_github_repositories_for_user_job"
        )
        response = client.post(reverse("current-user-refresh"))
        client.user.refresh_from_db()
        assert response.status_code == 202
        assert refresh_github_repositories_for_user_job.delay.called
        assert client.user.currently_fetching_repos


@pytest.mark.django_db
class TestProjectViewset:
    def test_refresh_org_config_names(
        self, client, project_factory, git_hub_repository_factory
    ):
        with ExitStack() as stack:
            git_hub_repository_factory(user=client.user, repo_id=123)
            project = project_factory(repo_id=123)
            available_org_config_names_job = stack.enter_context(
                patch("metecho.api.jobs.available_org_config_names_job")
            )
            response = client.post(
                reverse(
                    "project-refresh-org-config-names", kwargs={"pk": str(project.id)}
                )
            )

            assert response.status_code == 202, response.json()
            assert available_org_config_names_job.delay.called

    def test_refresh_github_users(
        self, client, mocker, project_factory, git_hub_repository_factory
    ):
        git_hub_repository_factory(user=client.user, repo_id=123)
        project = project_factory(repo_id=123)
        refresh_github_users_job = mocker.patch(
            "metecho.api.jobs.refresh_github_users_job"
        )

        response = client.post(
            reverse("project-refresh-github-users", kwargs={"pk": str(project.pk)})
        )

        project.refresh_from_db()
        assert response.status_code == 202
        assert project.currently_fetching_github_users
        assert refresh_github_users_job.delay.called

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
            assert response.json() == ["include_me"], response.json()

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
                    "has_push_permission": False,
                    "branch_prefix": "",
                    "github_users": [],
                    "repo_image_url": "",
                    "org_config_names": [],
                    "currently_fetching_org_config_names": False,
                    "currently_fetching_github_users": False,
                    "latest_sha": "abcd1234",
                }
            ],
        }, response.json()

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
                    "has_push_permission": False,
                    "branch_prefix": "",
                    "github_users": [],
                    "repo_image_url": "",
                    "org_config_names": [],
                    "currently_fetching_org_config_names": False,
                    "currently_fetching_github_users": False,
                    "latest_sha": "abcd1234",
                }
            ],
        }, response.json()

    def test_get_queryset__superuser(self, admin_client, project_factory):
        """
        Superuser should be able to access all projects even if they don't have a
        matching GitHubRepository on record
        """
        project_factory(repo_name="repo", repo_id=123)
        project_factory(repo_name="repo2", repo_id=456)
        project_factory(repo_name="repo3", repo_id=789)
        response = admin_client.get(reverse("project-list"))

        data = response.json()
        assert data["count"] == 3, data


@pytest.mark.django_db
class TestHookView:
    def test_202__push_task_commits(
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

    def test_202__push_epic_commits(
        self,
        settings,
        client,
        project_factory,
        git_hub_repository_factory,
        epic_factory,
    ):
        settings.GITHUB_HOOK_SECRET = b""
        with ExitStack() as stack:
            project = project_factory(repo_id=123)
            git_hub_repository_factory(repo_id=123)
            epic = epic_factory(project=project, branch_name="test-epic")

            refresh_commits_job = stack.enter_context(
                patch("metecho.api.jobs.refresh_commits_job")
            )
            response = client.post(
                reverse("hook"),
                json.dumps(
                    {
                        "ref": "refs/heads/test-epic",
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
                HTTP_X_HUB_SIGNATURE="sha1=211e9ad524fda925bf573d380386cf995efe6829",
                HTTP_X_GITHUB_EVENT="push",
            )
            assert response.status_code == 202, response.content
            assert not refresh_commits_job.delay.called
            epic.refresh_from_db()
            assert epic.latest_sha == "123"

    def test_202__push_project_commits(
        self,
        settings,
        client,
        project_factory,
        git_hub_repository_factory,
    ):
        settings.GITHUB_HOOK_SECRET = b""
        with ExitStack() as stack:
            project = project_factory(repo_id=123, branch_name="test-project")
            git_hub_repository_factory(repo_id=123)

            refresh_commits_job = stack.enter_context(
                patch("metecho.api.jobs.refresh_commits_job")
            )
            response = client.post(
                reverse("hook"),
                json.dumps(
                    {
                        "ref": "refs/heads/test-project",
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
                HTTP_X_HUB_SIGNATURE="sha1=dd348e0a076589952d3d8f2b19b8d8e8592127ed",
                HTTP_X_GITHUB_EVENT="push",
            )
            assert response.status_code == 202, response.content
            assert not refresh_commits_job.delay.called
            project.refresh_from_db()
            assert project.latest_sha == "123"

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

    def test_list__not_playground_owner(
        self, client, user_factory, scratch_org_factory
    ):
        other_user = user_factory()
        scratch_org_factory(
            org_type=SCRATCH_ORG_TYPES.Playground,
            url="https://example.com",
            is_created=True,
            delete_queued_at=None,
            currently_capturing_changes=False,
            currently_refreshing_changes=False,
            owner=other_user,
        )

        url = reverse("scratch-org-list")
        response = client.get(url)

        assert response.status_code == 200
        assert not response.json(), response.json()

    def test_retrieve__not_playground_owner(
        self, client, user_factory, scratch_org_factory
    ):
        other_user = user_factory()
        scratch_org = scratch_org_factory(
            org_type=SCRATCH_ORG_TYPES.Playground,
            url="https://example.com",
            is_created=True,
            delete_queued_at=None,
            currently_capturing_changes=False,
            currently_refreshing_changes=False,
            owner=other_user,
        )

        url = reverse("scratch-org-detail", kwargs={"pk": str(scratch_org.id)})
        response = client.get(url)

        assert response.status_code == 403

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

            response = client.post(
                url, {"task": str(task.id), "org_type": "Dev", "org_config_name": "dev"}
            )

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

            response = client.post(
                url, {"task": str(task.id), "org_type": "Dev", "org_config_name": "dev"}
            )

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
class TestTaskViewSet:
    def test_get(self, client, task_factory):
        task_factory()
        url = reverse("task-list")

        response = client.get(url)

        results = response.json()
        assert response.status_code == 200, response.content
        assert len(results) == 1, response.json()
        assert tuple(results[0]["epic"].keys()) == (
            "id",
            "name",
            "slug",
            "github_users",
        )

    def test_get__project_filter(self, client, task_factory, project_factory):
        url = reverse("task-list")
        project = project_factory()
        task_factory(epic__project=project)
        task_factory(epic=None, project=project)
        # Other tasks in other epics and projects
        task_factory()
        task_factory(epic=None, project=project_factory())

        response = client.get(url)
        assert len(response.json()) == 4

        response = client.get(url, data={"project": str(project.pk)})
        assert len(response.json()) == 2

    def test_create__dev_org(
        self, client, git_hub_repository_factory, scratch_org_factory, epic_factory
    ):
        repo = git_hub_repository_factory(permissions={"push": True}, user=client.user)
        epic = epic_factory(project__repo_id=repo.repo_id)
        scratch_org = scratch_org_factory(epic=epic, task=None)
        data = {
            "name": "Test Task with Org",
            "description": "Description",
            "epic": str(epic.id),
            "org_config_name": "dev",
            "dev_org": str(scratch_org.id),
        }

        response = client.post(reverse("task-list"), data=data)
        task_data = response.json()

        assert task_data["assigned_dev"] == client.user.github_id, task_data

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

    @pytest.mark.parametrize(
        "repo_perms, check",
        (
            pytest.param({}, status.is_client_error, id="Empty perms"),
            pytest.param(None, status.is_client_error, id="Missing perms"),
            pytest.param({"push": False}, status.is_client_error, id="Can't push"),
            pytest.param({"push": True}, status.is_success, id="Can push"),
        ),
    )
    @pytest.mark.parametrize(
        "_task_factory",
        (
            pytest.param(fixture("task_factory"), id="With Epic"),
            pytest.param(fixture("task_with_project_factory"), id="With Project"),
        ),
    )
    @pytest.mark.parametrize("method", ("post", "put", "patch", "delete"))
    def test_repo_permissions(
        self,
        client,
        git_hub_repository_factory,
        repo_perms,
        check,
        _task_factory,
        method,
    ):
        """
        Write operations on the task detail endpoint should depend on repo push
        permissions
        """
        task = _task_factory()
        git_hub_repository_factory(
            repo_id=task.root_project.repo_id, user=client.user, permissions=repo_perms
        )
        url = reverse("task-detail", args=[task.pk])
        data = TaskSerializer(task).data
        if method == "post":
            url = reverse("task-list")
            data["name"] = data["name"] + " 2"
        # Convert the nested objects to just the PK
        if task.epic:
            data["epic"] = str(task.epic.pk)
        if task.project:
            data["project"] = str(task.project.pk)

        response = getattr(client, method)(url, data=data, format="json")

        assert check(response.status_code), response.content

    def test_assignees(self, client, git_hub_repository_factory, task_factory):
        repo = git_hub_repository_factory(permissions={"push": True}, user=client.user)
        task = task_factory(
            epic__project__repo_id=repo.repo_id,
            epic__project__github_users=[
                {"id": "123456", "permissions": {"push": True}}
            ],
        )
        data = {"assigned_dev": "123456", "assigned_qa": "123456"}
        client.post(reverse("task-assignees", args=[task.id]), data=data)

        task.refresh_from_db()
        assert task.assigned_dev == "123456"
        assert task.assigned_qa == "123456"


@pytest.mark.django_db
class TestEpicViewSet:
    def test_get(self, client, epic_factory):
        epic_factory()
        url = reverse("epic-list")

        response = client.get(url)

        assert response.status_code == 200, response.content
        assert len(response.json()["results"]) == 1, response.json()

    @pytest.mark.parametrize(
        "repo_perms, check",
        (
            ({}, status.is_client_error),
            (None, status.is_client_error),
            ({"push": False}, status.is_client_error),
            ({"push": True}, status.is_success),
        ),
    )
    @pytest.mark.parametrize("method", ("post", "put", "patch", "delete"))
    def test_repo_permissions(
        self,
        client,
        epic_factory,
        git_hub_repository_factory,
        repo_perms,
        check,
        method,
    ):
        epic = epic_factory()
        git_hub_repository_factory(
            repo_id=epic.project.repo_id, user=client.user, permissions=repo_perms
        )
        data = EpicSerializer(epic).data
        url = reverse("epic-detail", args=[epic.pk])
        if method == "post":
            url = reverse("epic-list")
            data["name"] = data["name"] + " 2"

        response = getattr(client, method)(url, data=data, format="json")

        assert check(response.status_code)

    def test_collaborators(self, client, git_hub_repository_factory, epic_factory):
        repo = git_hub_repository_factory(permissions={"push": True}, user=client.user)
        epic = epic_factory(
            project__repo_id=repo.repo_id,
            project__github_users=[{"id": "123"}, {"id": "456"}],
        )
        data = {"github_users": ["123", "456"]}
        client.post(
            reverse("epic-collaborators", args=[epic.id]), data=data, format="json"
        )

        epic.refresh_from_db()
        assert epic.github_users == ["123", "456"]
