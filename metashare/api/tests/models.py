from contextlib import ExitStack
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from django.utils.timezone import now
from simple_salesforce.exceptions import SalesforceError

from ..models import (
    SCRATCH_ORG_TYPES,
    TASK_STATUSES,
    Project,
    Repository,
    Task,
    user_logged_in_handler,
)


@pytest.mark.django_db
class TestRepository:
    def test_signal(self):
        repository = Repository(name="Test Repository")
        repository.save()
        assert repository.slug == "test-repository"

    def test_str(self):
        repository = Repository(name="Test Repository")
        assert str(repository) == "Test Repository"

    def test_get_repo_id(self, repository_factory):
        with patch("metashare.api.model_mixins.get_repo_info") as get_repo_info:
            get_repo_info.return_value = MagicMock(id=123)
            user = MagicMock()

            gh_repo = repository_factory(repo_id=None)
            gh_repo.get_repo_id(user)

            gh_repo.refresh_from_db()
            assert get_repo_info.called
            assert gh_repo.repo_id == 123

    def test_get_a_matching_user__none(self, repository_factory):
        repo = repository_factory()
        assert repo.get_a_matching_user() is None

    def test_get_a_matching_user(self, repository_factory, git_hub_repository_factory):
        repo = repository_factory(repo_id=123)
        gh_repo = git_hub_repository_factory(repo_id=123)
        assert repo.get_a_matching_user() == gh_repo.user

    def test_queue_populate_github_users(self, repository_factory, user_factory):
        repo = repository_factory()
        with patch(
            "metashare.api.jobs.populate_github_users_job"
        ) as populate_github_users_job:
            repo.queue_populate_github_users()
            assert populate_github_users_job.delay.called

    def test_queue_refresh_commits(self, repository_factory, user_factory):
        repo = repository_factory()
        with patch("metashare.api.jobs.refresh_commits_job") as refresh_commits_job:
            repo.queue_refresh_commits(ref="some branch")
            assert refresh_commits_job.delay.called

    def test_save(self, repository_factory, git_hub_repository_factory):
        with patch("metashare.api.gh.get_repo_info") as get_repo_info:
            get_repo_info.return_value = MagicMock(default_branch="main-branch")
            git_hub_repository_factory(repo_id=123)
            repo = repository_factory(branch_name=None, repo_id=123)
            repo.save()
            assert get_repo_info.called
            repo.refresh_from_db()
            assert repo.branch_name == "main-branch"

    def test_finalize_populate_github_users(self, repository_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            repo = repository_factory()
            repo.finalize_populate_github_users()

            assert async_to_sync.called

    def test_finalize_populate_github_users__error(self, repository_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            repo = repository_factory()
            repo.finalize_populate_github_users(error=True)

            assert async_to_sync.called


@pytest.mark.django_db
class TestProject:
    def test_signal(self, repository_factory):
        repository = repository_factory()
        project = Project(name="Test Project", repository=repository)
        project.save()
        assert project.slug == "test-project"

    def test_str(self, repository_factory):
        repository = repository_factory()
        project = Project(name="Test Project", repository=repository)
        assert str(project) == "Test Project"

    def test_get_repo_id(self, repository_factory, project_factory):
        user = MagicMock()
        repo = repository_factory(repo_id=123)
        project = project_factory(repository=repo)
        assert project.get_repo_id(user) == 123

    def test_finalize_status_completed(self, project_factory):
        project = project_factory(has_unmerged_commits=True)
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            project.finalize_status_completed()
            project.refresh_from_db()
            assert not project.has_unmerged_commits
            assert async_to_sync.called

    def test_queue_create_pr(self, project_factory, user_factory):
        with patch("metashare.api.jobs.create_pr_job") as create_pr_job:
            project = project_factory()
            user = user_factory()
            project.queue_create_pr(
                user,
                title="My PR",
                critical_changes="",
                additional_changes="",
                issues="",
                notes="",
            )

            assert create_pr_job.delay.called


@pytest.mark.django_db
class TestTask:
    def test_str(self):
        task = Task(name="Test Task")
        assert str(task) == "Test Task"

    def test_notify_changed(self, task_factory):
        with ExitStack() as stack:
            stack.enter_context(patch("metashare.api.jobs.create_pr_job"))
            async_to_sync = stack.enter_context(
                patch("metashare.api.model_mixins.async_to_sync")
            )
            task = task_factory()
            task.notify_changed()

            assert async_to_sync.called

    def test_finalize_status_completed(self, task_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            task = task_factory()
            task.finalize_status_completed()

            task.refresh_from_db()
            assert async_to_sync.called
            assert task.status == TASK_STATUSES.Completed

    def test_finalize_task_update(self, task_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            task = task_factory()
            task.finalize_task_update()

            assert async_to_sync.called

    def test_queue_create_pr(self, task_factory, user_factory):
        with patch("metashare.api.jobs.create_pr_job") as create_pr_job:
            task = task_factory()
            user = user_factory()
            task.queue_create_pr(
                user,
                title="My PR",
                critical_changes="",
                additional_changes="",
                issues="",
                notes="",
            )

            assert create_pr_job.delay.called

    def test_finalize_create_pr(self, task_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            task = task_factory()
            task.finalize_create_pr()

            assert async_to_sync.called

    def test_queue_submit_review(self, user_factory, task_factory):
        user = user_factory()
        task = task_factory()
        with patch("metashare.api.jobs.submit_review_job") as submit_review_job:
            task.queue_submit_review(
                user=user, data={"notes": "Foo", "status": "APPROVE"},
            )

            assert submit_review_job.delay.called

    def test_finalize_submit_review(self, task_factory):
        now = datetime(2020, 12, 31, 12, 0)
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            task = task_factory(commits=[{"id": "123"}])
            task.finalize_submit_review(now, sha="123")

            assert async_to_sync.called
            assert task.review_sha == "123"
            assert task.review_valid

    def test_finalize_submit_review__delete_org(
        self, task_factory, scratch_org_factory
    ):
        now = datetime(2020, 12, 31, 12, 0)
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            task = task_factory(commits=[{"id": "123"}])
            scratch_org = scratch_org_factory(task=task, org_type=SCRATCH_ORG_TYPES.QA)
            scratch_org.queue_delete = MagicMock()
            task.finalize_submit_review(
                now, sha="123", delete_org=True, org=scratch_org
            )

            assert async_to_sync.called
            assert scratch_org.queue_delete.called
            assert task.review_sha == "123"
            assert task.review_valid

    def test_finalize_submit_review__error(self, task_factory):
        now = datetime(2020, 12, 31, 12, 0)
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            task = task_factory()
            task.finalize_submit_review(now, err=ValueError)

            assert async_to_sync.called
            assert not task.review_valid


@pytest.mark.django_db
class TestUser:
    def test_refresh_repositories(self, user_factory):
        user = user_factory()
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metashare.api.models.gh"))
            async_to_sync = stack.enter_context(
                patch("metashare.api.models.async_to_sync")
            )
            gh.get_all_org_repos.return_value = []
            user.refresh_repositories()

            assert async_to_sync.called

    def test_org_id(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.org_id is not None

        user.socialaccount_set.all().delete()
        assert user.org_id is None

    def test_org_name(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.org_name == "Sample Org"

        user.socialaccount_set.all().delete()
        assert user.org_name is None

    def test_org_type(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.org_type == "Developer Edition"

        user.socialaccount_set.all().delete()
        assert user.org_type is None

    def test_github_account(self, user_factory):
        user = user_factory()
        assert user.github_account is not None
        assert (
            user.github_account
            == user.socialaccount_set.filter(provider="github").first()
        )

        user.socialaccount_set.all().delete()
        assert user.salesforce_account is None

    def test_salesforce_account(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.salesforce_account is not None
        assert (
            user.salesforce_account
            == user.socialaccount_set.filter(provider="salesforce-production").first()
        )

        user.socialaccount_set.all().delete()
        assert user.salesforce_account is None

    def test_avatar_url(self, user_factory, social_account_factory):
        user = user_factory()
        user.socialaccount_set.all().delete()
        assert not user.avatar_url

        social_account_factory(
            user=user,
            provider="github",
            extra_data={"avatar_url": "https://example.com/avatar/"},
        )
        assert user.avatar_url == "https://example.com/avatar/"

    def test_sf_username(self, user_factory, social_account_factory):
        user = user_factory(devhub_username="sample username")
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={"preferred_username": "not me!"},
        )
        assert user.sf_username == "sample username"

    def test_sf_username__global_devhub(
        self, settings, user_factory, social_account_factory
    ):
        settings.DEVHUB_USERNAME = "devhub username"
        user = user_factory(devhub_username=None, allow_devhub_override=True)
        social_account_factory(
            user=user, provider="salesforce-production", extra_data={},
        )
        assert user.sf_username == "devhub username"

    def test_instance_url(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.instance_url == "https://example.com"

        user.socialaccount_set.all().delete()
        assert user.instance_url is None

    def test_sf_token(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.sf_token == ("0123456789abcdef", "secret.0123456789abcdef")

        user.socialaccount_set.all().delete()
        assert user.sf_token == (None, None)

    def test_sf_token__invalid(
        self, user_factory, social_token_factory, social_account_factory
    ):
        user = user_factory()
        social_account = social_account_factory(
            socialtoken_set=[], user=user, provider="salesforce-production"
        )
        social_token_factory(token="an invalid token", account=social_account)
        assert user.sf_token == (None, None)

        user.socialaccount_set.all().delete()
        assert user.sf_token == (None, None)

    def test_valid_token_for(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.valid_token_for == "00Dxxxxxxxxxxxxxxx"

        user.socialaccount_set.filter(
            provider="salesforce-production"
        ).first().socialtoken_set.all().delete()
        assert user.valid_token_for is None

    def test_full_org_type(self, user_factory, social_account_factory):
        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Developer Edition",
                    "IsSandbox": False,
                    "TrialExpirationDate": None,
                },
            },
        )
        assert user.full_org_type == "Developer"

        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Production",
                    "IsSandbox": False,
                    "TrialExpirationDate": None,
                },
            },
        )
        assert user.full_org_type == "Production"

        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Something",
                    "IsSandbox": True,
                    "TrialExpirationDate": None,
                },
            },
        )
        assert user.full_org_type == "Sandbox"

        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Something",
                    "IsSandbox": True,
                    "TrialExpirationDate": "Some date",
                },
            },
        )
        assert user.full_org_type == "Scratch"

        user = user_factory(socialaccount_set=[])
        assert user.full_org_type is None

    def test_is_devhub_enabled__shortcut_true(self, user_factory):
        user = user_factory(devhub_username="sample username")
        assert user.is_devhub_enabled

    def test_is_devhub_enabled__shortcut_false(
        self, user_factory, social_account_factory
    ):
        user = user_factory()
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Something",
                    "IsSandbox": True,
                    "TrialExpirationDate": None,
                },
            },
        )
        assert not user.is_devhub_enabled

    def test_is_devhub_enabled__true(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Production",
                    "IsSandbox": False,
                    "TrialExpirationDate": None,
                },
            },
        )
        with patch("metashare.api.models.get_devhub_api") as get_devhub_api:
            resp = {"foo": "bar"}
            client = MagicMock()
            client.restful.return_value = resp
            get_devhub_api.return_value = client
            assert user.is_devhub_enabled

    def test_is_devhub_enabled__false(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Production",
                    "IsSandbox": False,
                    "TrialExpirationDate": None,
                },
            },
        )
        with patch("metashare.api.models.get_devhub_api") as get_devhub_api:
            resp = None
            client = MagicMock()
            client.restful.return_value = resp
            get_devhub_api.return_value = client
            assert not user.is_devhub_enabled

    def test_is_devhub_enabled__sf_error(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(
            user=user,
            provider="salesforce-production",
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Production",
                    "IsSandbox": False,
                    "TrialExpirationDate": None,
                },
            },
        )
        with patch("metashare.api.models.get_devhub_api") as get_devhub_api:
            client = MagicMock()
            client.restful.side_effect = SalesforceError(
                "https://example.com",
                404,
                "Not Found",
                [
                    {
                        "errorCode": "NOT_FOUND",
                        "message": "The requested resource does not exist",
                    }
                ],
            )
            get_devhub_api.return_value = client
            assert not user.is_devhub_enabled


@pytest.mark.django_db
class TestScratchOrg:
    def test_notify_changed(self, scratch_org_factory):
        with ExitStack() as stack:
            stack.enter_context(
                patch(
                    "metashare.api.jobs."
                    "create_branches_on_github_then_create_scratch_org_job"
                )
            )
            async_to_sync = stack.enter_context(
                patch("metashare.api.model_mixins.async_to_sync")
            )
            scratch_org = scratch_org_factory()
            scratch_org.notify_changed()

            assert async_to_sync.called

    def test_queue_delete(self, scratch_org_factory):
        with patch(
            "metashare.api.jobs.delete_scratch_org_job"
        ) as delete_scratch_org_job:
            scratch_org = scratch_org_factory(last_modified_at=now())
            scratch_org.queue_delete()

            assert delete_scratch_org_job.delay.called

    def test_notify_delete(self, scratch_org_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            scratch_org = scratch_org_factory(last_modified_at=now())
            scratch_org.delete()

            assert async_to_sync.called

    def test_get_unsaved_changes(self, scratch_org_factory):
        with patch(
            "metashare.api.jobs.get_unsaved_changes_job"
        ) as get_unsaved_changes_job:
            scratch_org = scratch_org_factory()
            scratch_org.queue_get_unsaved_changes()

            assert get_unsaved_changes_job.delay.called

    def test_finalize_provision(self, scratch_org_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            scratch_org = scratch_org_factory()
            scratch_org.finalize_provision()

            assert async_to_sync.called

    def test_finalize_provision__flow_error(self, scratch_org_factory):
        with ExitStack() as stack:
            stack.enter_context(patch("metashare.api.model_mixins.async_to_sync"))
            delete_queued = stack.enter_context(
                patch("metashare.api.jobs.delete_scratch_org_job")
            )
            scratch_org = scratch_org_factory(url="https://example.com")
            scratch_org.finalize_provision(error=True)

            assert delete_queued.delay.called

    def test_get_login_url(self, scratch_org_factory):
        with ExitStack() as stack:
            jwt_session = stack.enter_context(patch("metashare.api.models.jwt_session"))
            OrgConfig = stack.enter_context(patch("metashare.api.models.OrgConfig"))
            OrgConfig.return_value = MagicMock(start_url="https://example.com")

            scratch_org = scratch_org_factory()
            assert scratch_org.get_login_url() == "https://example.com"
            assert jwt_session.called

    def test_remove_scratch_org(self, scratch_org_factory):
        with patch("metashare.api.model_mixins.async_to_sync") as async_to_sync:
            scratch_org = scratch_org_factory()
            scratch_org.remove_scratch_org(error=Exception)

            assert async_to_sync.called


@pytest.mark.django_db
class TestGitHubRepository:
    def test_str(self, git_hub_repository_factory):
        gh_repo = git_hub_repository_factory()
        assert str(gh_repo) == "https://github.com/test/repo.git"


@pytest.mark.django_db
def test_login_handler(user_factory):
    user = user_factory()
    patch_path = "metashare.api.jobs.refresh_github_repositories_for_user_job"
    with patch(patch_path) as refresh_job:
        user_logged_in_handler(None, user=user)
        refresh_job.delay.assert_called_with(user)
