from contextlib import ExitStack
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.core.exceptions import ValidationError
from django.utils.timezone import now
from simple_salesforce.exceptions import SalesforceError

from ..models import (
    Epic,
    EpicStatus,
    GitHubUser,
    ScratchOrgType,
    SiteProfile,
    Task,
    TaskStatus,
    user_logged_in_handler,
)


class TestSiteProfile:
    def test_str(self):
        profile = SiteProfile(name="Hello world")
        assert str(profile) == "Hello world"


@pytest.mark.django_db
class TestProject:
    def test_signal(self, project_factory):
        project = project_factory(name="Test Project")
        project.save()
        assert project.slug == "test-project"

    def test_signal__recreate(self, project_factory):
        project = project_factory(name="Test Project")
        project.save()
        assert project.slug == "test-project"
        project.name = "Test Project with a Twist"
        project.save()
        assert project.slug == "test-project-with-a-twist"

    def test_str(self, project_factory):
        project = project_factory(name="Test Project")
        assert str(project) == "Test Project"

    def test_get_absolute_url(self, project_factory):
        url = project_factory().get_absolute_url()
        assert url.startswith("/")

    def test_get_repo_id(self, project_factory):
        with patch("metecho.api.model_mixins.get_repo_info") as get_repo_info:
            get_repo_info.return_value = MagicMock(id=123)

            project = project_factory(repo_id=None)
            project.get_repo_id()

            project.refresh_from_db()
            assert get_repo_info.called
            assert project.repo_id == 123

    def test_queue_refresh_commits(self, project_factory, user_factory):
        project = project_factory()
        with patch("metecho.api.jobs.refresh_commits_job") as refresh_commits_job:
            project.queue_refresh_commits(ref="some branch", originating_user_id=None)
            assert refresh_commits_job.delay.called

    def test_save__no_branch_name(self, mocker, project_factory):
        with patch("metecho.api.gh.get_repo_info") as get_repo_info:
            repo_branch = MagicMock()
            repo_branch.latest_sha.return_value = "abcd1234"
            repo_info = MagicMock(default_branch="main-branch")
            repo_info.branch.return_value = repo_branch
            get_repo_info.return_value = repo_info
            project = project_factory(
                branch_name="", latest_sha="", repo_image_url="/foo"
            )
            project.save()
            assert get_repo_info.called
            project.refresh_from_db()
            assert project.branch_name == "main-branch"
            assert project.latest_sha == "abcd1234"

    def test_save__no_latest_sha(self, project_factory):
        with patch("metecho.api.gh.get_repo_info") as get_repo_info:
            repo_branch = MagicMock()
            repo_branch.latest_sha.return_value = "abcd1234"
            repo_info = MagicMock(default_branch="main-branch")
            repo_info.branch.return_value = repo_branch
            get_repo_info.return_value = repo_info
            project = project_factory(
                branch_name="main", latest_sha="", repo_image_url="/foo"
            )
            project.save()
            assert get_repo_info.called
            project.refresh_from_db()
            assert project.branch_name == "main"
            assert project.latest_sha == "abcd1234"

    def test_queue_available_org_config_names(self, user_factory, project_factory):
        user = user_factory()
        project = project_factory()
        with ExitStack() as stack:
            available_org_config_names_job = stack.enter_context(
                patch("metecho.api.jobs.available_org_config_names_job")
            )
            project.queue_available_org_config_names(user=user)

            assert available_org_config_names_job.delay.called

    def test_finalize_available_org_config_names(self, project_factory):
        project = project_factory(repo_image_url="/foo", branch_name="main")
        project.notify_changed = MagicMock()
        project.finalize_available_org_config_names()
        assert project.notify_changed.called


@pytest.mark.django_db
class TestEpic:
    def test_signal(self, project_factory):
        project = project_factory()
        epic = Epic(name="Test Epic", project=project)
        epic.save()

        assert epic.slug == "test-epic"

    def test_str(self, project_factory):
        project = project_factory()
        epic = Epic(name="Test Epic", project=project)
        assert str(epic) == "Test Epic"

    def test_get_absolute_url(self, epic_factory):
        url = epic_factory().get_absolute_url()
        assert url.startswith("/")

    def test_get_repo_id(self, project_factory, epic_factory):
        project = project_factory(repo_id=123)
        epic = epic_factory(project=project)

        assert epic.get_repo_id() == 123

    def test_finalize_status_completed(self, epic_factory):
        with ExitStack() as stack:
            epic = epic_factory(has_unmerged_commits=True)

            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            epic.finalize_status_completed(123, originating_user_id=None)
            epic.refresh_from_db()
            assert epic.pr_number == 123
            assert not epic.has_unmerged_commits
            assert async_to_sync.called

    def test_should_update_status(self, epic_factory):
        epic = epic_factory()
        assert not epic.should_update_status()

    def test_should_update_status__already_merged(self, epic_factory):
        epic = epic_factory(status=EpicStatus.MERGED, pr_is_merged=True)
        assert not epic.should_update_status()

    def test_should_update_status__already_review(self, epic_factory, task_factory):
        epic = epic_factory(status=EpicStatus.REVIEW)
        task_factory(epic=epic, status=TaskStatus.COMPLETED)
        assert not epic.should_update_status()

    def test_queue_create_pr(self, epic_factory, user_factory):
        with ExitStack() as stack:
            create_pr_job = stack.enter_context(patch("metecho.api.jobs.create_pr_job"))

            epic = epic_factory()
            user = user_factory()
            epic.queue_create_pr(
                user,
                title="My PR",
                critical_changes="",
                additional_changes="",
                issues="",
                notes="",
                alert_assigned_qa=True,
                originating_user_id=None,
            )

            assert create_pr_job.delay.called

    def test_soft_delete(self, epic_factory, task_factory):
        epic = epic_factory()
        task_factory(epic=epic)
        task_factory(epic=epic)

        epic.delete()
        epic.refresh_from_db()
        assert epic.deleted_at is not None
        assert epic.tasks.active().count() == 0

    def test_queryset_soft_delete(self, epic_factory, task_factory):
        epic1 = epic_factory()
        epic2 = epic_factory()
        epic_factory()

        task_factory(epic=epic1)
        task_factory(epic=epic2)

        assert Epic.objects.count() == 3
        assert Epic.objects.active().count() == 3
        assert Task.objects.active().count() == 2
        Epic.objects.all().delete()

        assert Epic.objects.count() == 3
        assert Epic.objects.active().count() == 0
        assert Task.objects.active().count() == 0


@pytest.mark.django_db
class TestTask:
    def test_str(self):
        task = Task(name="Test Task")
        assert str(task) == "Test Task"

    def test_get_absolute_url__epic(self, task_factory):
        task = task_factory()
        assert task.epic.slug in task.get_absolute_url()

    def test_get_absolute_url__project(self, task_with_project_factory):
        task = task_with_project_factory()
        assert task.project.slug in task.get_absolute_url()

    def test_notify_changed(self, task_factory):
        with ExitStack() as stack:
            stack.enter_context(patch("metecho.api.jobs.create_pr_job"))
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            task = task_factory()
            task.notify_changed(originating_user_id=None)

            assert async_to_sync.called

    def test_finalize_status_completed(self, task_factory):
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            task = task_factory()
            task.finalize_status_completed(123, originating_user_id=None)

            task.refresh_from_db()
            assert async_to_sync.called
            assert task.pr_number == 123
            assert task.status == TaskStatus.COMPLETED

    def test_finalize_task_update(self, task_factory):
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            task = task_factory()
            task.finalize_task_update(originating_user_id=None)

            assert async_to_sync.called

    def test_queue_create_pr(self, task_factory, user_factory):
        with ExitStack() as stack:
            create_pr_job = stack.enter_context(patch("metecho.api.jobs.create_pr_job"))

            task = task_factory()
            user = user_factory()
            task.queue_create_pr(
                user,
                title="My PR",
                critical_changes="",
                additional_changes="",
                issues="",
                notes="",
                alert_assigned_qa=True,
                originating_user_id=None,
            )

            assert create_pr_job.delay.called

    def test_finalize_create_pr(self, task_factory):
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            task = task_factory()
            task.finalize_create_pr(originating_user_id=None)

            assert async_to_sync.called

    def test_queue_submit_review(self, user_factory, task_factory):
        user = user_factory()
        with ExitStack() as stack:
            task = task_factory()

            submit_review_job = stack.enter_context(
                patch("metecho.api.jobs.submit_review_job")
            )
            task.queue_submit_review(
                user=user,
                data={"notes": "Foo", "status": "APPROVE"},
                originating_user_id=None,
            )

            assert submit_review_job.delay.called

    def test_finalize_submit_review(self, task_factory):
        now = datetime(2020, 12, 31, 12, 0)
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            task = task_factory(commits=[{"id": "123"}])
            task.finalize_submit_review(now, sha="123", originating_user_id=None)

            assert async_to_sync.called
            assert task.review_sha == "123"
            assert task.review_valid

    def test_finalize_submit_review__delete_org(
        self, task_factory, scratch_org_factory
    ):
        now = datetime(2020, 12, 31, 12, 0)
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            task = task_factory(commits=[{"id": "123"}])
            scratch_org = scratch_org_factory(task=task, org_type=ScratchOrgType.QA)
            scratch_org.queue_delete = MagicMock()
            task.finalize_submit_review(
                now,
                sha="123",
                delete_org=True,
                org=scratch_org,
                originating_user_id=None,
            )

            assert async_to_sync.called
            assert scratch_org.queue_delete.called
            assert task.review_sha == "123"
            assert task.review_valid

    def test_finalize_submit_review__error(self, task_factory):
        now = datetime(2020, 12, 31, 12, 0)
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            task = task_factory()
            task.finalize_submit_review(now, error=ValueError, originating_user_id=None)

            assert async_to_sync.called
            assert not task.review_valid

    def test_soft_delete_cascade(self, task_factory, scratch_org_factory):
        task = task_factory()
        scratch_org_factory(task=task)
        scratch_org_factory(task=task)

        assert task.orgs.active().count() == 2

        task.delete()
        assert task.orgs.active().count() == 0

    def test_soft_delete_cascade__manager(self, task_factory, scratch_org_factory):
        task = task_factory()
        scratch_org_factory(task=task)
        scratch_org_factory(task=task)

        assert task.orgs.active().count() == 2

        Task.objects.all().delete()
        assert task.orgs.active().count() == 0

    def test_get_all_users_in_commits(self, task_factory):
        task = task_factory(
            commits=[
                {
                    "id": "123",
                    "author": {
                        "name": "Name 1",
                        "email": "name1@example.com",
                        "username": "name1",
                        "avatar_url": "https://example.com/",
                    },
                },
                {
                    "id": "456",
                    "author": {
                        "name": "Name 2",
                        "email": "name2@example.com",
                        "username": "name2",
                        "avatar_url": "https://example.com/",
                    },
                },
                {
                    "id": "789",
                    "author": {
                        "name": "Name 1",
                        "email": "name1@example.com",
                        "username": "name1",
                        "avatar_url": "https://example.com/",
                    },
                },
            ],
        )

        expected = [
            {
                "name": "Name 1",
                "email": "name1@example.com",
                "username": "name1",
                "avatar_url": "https://example.com/",
            },
            {
                "name": "Name 2",
                "email": "name2@example.com",
                "username": "name2",
                "avatar_url": "https://example.com/",
            },
        ]

        assert task.get_all_users_in_commits == expected

    def test_add_reviewer(self, task_factory):
        task = task_factory()
        task.add_reviewer({"login": "login", "avatar_url": "https://example.com"})
        task.add_reviewer({"login": "login", "avatar_url": "https://example.com"})
        task.refresh_from_db()
        assert task.reviewers == [
            {"login": "login", "avatar_url": "https://example.com"}
        ]


@pytest.mark.django_db
class TestUser:
    def test_org_id(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.org_id is not None

        user.socialaccount_set.all().delete()
        assert user.org_id is None

    def test_org_name(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.org_name == "Sample Org"

        user.socialaccount_set.all().delete()
        assert user.org_name is None

    def test_org_name__global_devhub(
        self, settings, user_factory, social_account_factory
    ):
        settings.DEVHUB_USERNAME = "test global devhub"
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.org_name is None

    def test_org_type(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.org_type == "Developer Edition"

        user.socialaccount_set.all().delete()
        assert user.org_type is None

    def test_org_type__global_devhub(
        self, settings, user_factory, social_account_factory
    ):
        settings.DEVHUB_USERNAME = "test global devhub"
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
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
        social_account_factory(user=user, provider="salesforce")
        assert user.salesforce_account is not None
        assert (
            user.salesforce_account
            == user.socialaccount_set.filter(provider="salesforce").first()
        )

        user.socialaccount_set.all().delete()
        assert user.salesforce_account is None

    def test_github_id(self, user_factory, social_account_factory):
        user = user_factory()
        user.socialaccount_set.all().delete()
        assert not user.github_id

        social_account_factory(user=user, provider="github", uid="123")
        assert user.github_id == 123

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
            provider="salesforce",
            extra_data={"preferred_username": "not me!"},
        )
        assert user.sf_username == "sample username"

    def test_sf_username__global_devhub(
        self, settings, user_factory, social_account_factory
    ):
        settings.DEVHUB_USERNAME = "devhub username"
        user = user_factory(devhub_username="", allow_devhub_override=False)
        social_account_factory(
            user=user,
            provider="salesforce",
            extra_data={},
        )
        assert user.sf_username == "devhub username"

    def test_instance_url(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.instance_url == "https://example.com"

        user.socialaccount_set.all().delete()
        assert user.instance_url is None

    def test_sf_token(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.sf_token == ("0123456789abcdef", "secret.0123456789abcdef")

        user.socialaccount_set.all().delete()
        assert user.sf_token == (None, None)

    def test_sf_token__invalid(
        self, user_factory, social_token_factory, social_account_factory
    ):
        user = user_factory()
        social_account = social_account_factory(
            socialtoken_set=[], user=user, provider="salesforce"
        )
        social_token_factory(token="an invalid token", account=social_account)
        assert user.sf_token == (None, None)

        user.socialaccount_set.all().delete()
        assert user.sf_token == (None, None)

    def test_valid_token_for(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.valid_token_for == "00Dxxxxxxxxxxxxxxx"

        user.socialaccount_set.filter(
            provider="salesforce"
        ).first().socialtoken_set.all().delete()
        assert user.valid_token_for is None

    def test_valid_token_for__use_global_devhub(
        self, settings, user_factory, social_account_factory
    ):
        settings.DEVHUB_USERNAME = "test global devhub"
        user = user_factory()
        social_account_factory(user=user, provider="salesforce")
        assert user.valid_token_for is None

    def test_full_org_type(self, user_factory, social_account_factory):
        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            provider="salesforce",
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
            provider="salesforce",
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
            provider="salesforce",
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
            provider="salesforce",
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

    def test_is_devhub_enabled__shortcut_true__use_global_devhub(
        self, settings, user_factory
    ):
        settings.DEVHUB_USERNAME = "test global devhub"
        user = user_factory()
        assert user.is_devhub_enabled

    def test_is_devhub_enabled__shortcut_false(
        self, user_factory, social_account_factory
    ):
        user = user_factory()
        social_account_factory(
            user=user,
            provider="salesforce",
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
            provider="salesforce",
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
        with patch("metecho.api.models.get_devhub_api") as get_devhub_api:
            resp = {"foo": "bar"}
            client = MagicMock()
            client.restful.return_value = resp
            get_devhub_api.return_value = client
            assert user.is_devhub_enabled

    def test_is_devhub_enabled__false(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(
            user=user,
            provider="salesforce",
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
        with patch("metecho.api.models.get_devhub_api") as get_devhub_api:
            resp = None
            client = MagicMock()
            client.restful.return_value = resp
            get_devhub_api.return_value = client
            assert not user.is_devhub_enabled

    def test_is_devhub_enabled__sf_error(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(
            user=user,
            provider="salesforce",
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
        with patch("metecho.api.models.get_devhub_api") as get_devhub_api:
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

    def test_user_delete_triggers_scratch_org_delete(
        self, mocker, user_factory, scratch_org_factory
    ):
        mocker.patch("metecho.api.admin.gh")
        scratch_org_delete_job = mocker.patch("metecho.api.jobs.delete_scratch_org_job")

        user = user_factory()
        scratch_org = scratch_org_factory(last_modified_at=now(), owner=user)
        assert user.scratchorg_set.first() == scratch_org

        user.delete()
        assert scratch_org_delete_job.delay.called


@pytest.mark.django_db
class TestScratchOrg:
    def test_root_project(
        self, project_factory, epic_factory, task_factory, scratch_org_factory
    ):
        invalid_scratch_org = scratch_org_factory(task=None)
        epic = epic_factory()
        epic_scratch_org = scratch_org_factory(task=None, epic=epic)
        project = project_factory()
        project_scratch_org = scratch_org_factory(task=None, project=project)
        task_with_epic_scratch_org = scratch_org_factory()
        task_with_project_scratch_org = scratch_org_factory(
            task=task_factory(epic=None, project=project)
        )

        assert invalid_scratch_org.root_project is None
        assert epic_scratch_org.root_project == epic.project
        assert project_scratch_org.root_project == project
        assert (
            task_with_epic_scratch_org.root_project
            == task_with_epic_scratch_org.task.epic.project
        )
        assert (
            task_with_project_scratch_org.root_project
            == task_with_project_scratch_org.task.project
        )

    def test_notify_changed(self, scratch_org_factory):
        with ExitStack() as stack:
            stack.enter_context(
                patch(
                    "metecho.api.jobs."
                    "create_branches_on_github_then_create_scratch_org_job"
                )
            )
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            scratch_org = scratch_org_factory()
            scratch_org.notify_changed(originating_user_id=None)

            assert async_to_sync.called

    def test_queue_delete(self, scratch_org_factory):
        with ExitStack() as stack:
            delete_scratch_org_job = stack.enter_context(
                patch("metecho.api.jobs.delete_scratch_org_job")
            )

            scratch_org = scratch_org_factory(last_modified_at=now())
            scratch_org.queue_delete(originating_user_id=None)
            assert delete_scratch_org_job.delay.called

    def test_notify_delete(self, scratch_org_factory):
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            scratch_org = scratch_org_factory(last_modified_at=now())
            scratch_org.delete()

            assert async_to_sync.called

    def test_get_unsaved_changes(self, scratch_org_factory):
        with ExitStack() as stack:
            get_unsaved_changes_job = stack.enter_context(
                patch("metecho.api.jobs.get_unsaved_changes_job")
            )

            scratch_org = scratch_org_factory(
                last_checked_unsaved_changes_at=now() - timedelta(minutes=1),
            )
            scratch_org.queue_get_unsaved_changes(
                force_get=True, originating_user_id=None
            )

            assert get_unsaved_changes_job.delay.called

    def test_get_unsaved_changes__bail_early(self, scratch_org_factory):
        with ExitStack() as stack:
            get_unsaved_changes_job = stack.enter_context(
                patch("metecho.api.jobs.get_unsaved_changes_job")
            )

            scratch_org = scratch_org_factory(
                last_checked_unsaved_changes_at=now() - timedelta(minutes=1),
            )
            scratch_org.queue_get_unsaved_changes(originating_user_id=None)

            assert not get_unsaved_changes_job.delay.called

    def test_finalize_provision(self, scratch_org_factory):
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            scratch_org = scratch_org_factory()
            scratch_org.finalize_provision(originating_user_id=None)

            assert async_to_sync.called

    def test_finalize_provision__flow_error(self, scratch_org_factory):
        with ExitStack() as stack:
            stack.enter_context(patch("metecho.api.model_mixins.async_to_sync"))
            delete_queued = stack.enter_context(
                patch("metecho.api.jobs.delete_scratch_org_job")
            )
            scratch_org = scratch_org_factory(url="https://example.com")
            scratch_org.finalize_provision(error=True, originating_user_id=None)

            assert delete_queued.delay.called

    def test_get_login_url(self, scratch_org_factory):
        with ExitStack() as stack:
            refresh_access_token = stack.enter_context(
                patch("metecho.api.models.refresh_access_token")
            )
            refresh_access_token.return_value = MagicMock(
                start_url="https://example.com"
            )

            scratch_org = scratch_org_factory()
            assert scratch_org.get_login_url() == "https://example.com"
            assert refresh_access_token.called

    def test_remove_scratch_org(self, scratch_org_factory):
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )

            scratch_org = scratch_org_factory()
            scratch_org.remove_scratch_org(error=Exception, originating_user_id=None)

            assert async_to_sync.called

    def test_clean(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        try:
            scratch_org.clean()
        except Exception:  # pragma: nocover
            raise pytest.fail(Exception)

    def test_clean__no_parent(self, scratch_org_factory):
        scratch_org = scratch_org_factory(project=None, epic=None, task=None)
        with pytest.raises(ValidationError):
            scratch_org.clean()

    def test_clean__epic_dev_org(self, scratch_org_factory, epic_factory):
        scratch_org = scratch_org_factory(
            epic=epic_factory(), task=None, org_type="Dev"
        )
        with pytest.raises(ValidationError):
            scratch_org.clean()

    def test_clean_config(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        scratch_org.config = {"access_token": "bad", "anything else": "good"}
        scratch_org.save()

        scratch_org.refresh_from_db()
        assert scratch_org.config == {"anything else": "good"}

    def test_is_omnistudio_installed(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        scratch_org.installed_packages = ["omnistudio", "foobar"]
        assert scratch_org.is_omnistudio_installed
        scratch_org.installed_packages = ["vlocity_cmt", "foobar"]
        assert scratch_org.is_omnistudio_installed
        scratch_org.installed_packages = ["npsp", "foobar"]
        assert not scratch_org.is_omnistudio_installed


@pytest.mark.django_db
class TestProjectDependency:
    def test_str(self, project_dependency_factory):
        org = project_dependency_factory(name="Dep ABC")
        assert str(org) == "Dep ABC"


@pytest.mark.django_db
class TestGitHubOrganization:
    def test_str(self, git_hub_organization_factory):
        org = git_hub_organization_factory(name="Foo Org")
        assert str(org) == "Foo Org"


class TestGitHubUser:
    def test_str(self):
        gh_user = GitHubUser(login="hello-world")
        assert str(gh_user) == "hello-world"


class TestGitHubIssue:
    def test_str(self, git_hub_issue_factory):
        gh_issue = git_hub_issue_factory.build(title="Hello world")
        assert str(gh_issue) == "Hello world"


@pytest.mark.django_db
def test_login_handler(user_factory):
    user = user_factory()
    user.queue_refresh_repositories = MagicMock()
    user.queue_refresh_organizations = MagicMock()
    user_logged_in_handler(None, user=user)
    user.queue_refresh_repositories.assert_called_once()
    user.queue_refresh_organizations.assert_called_once()
