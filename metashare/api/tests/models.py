from unittest.mock import MagicMock, patch

import pytest

from ..models import Project, Repository, Task, user_logged_in_handler

# from ..models import ScratchOrg


@pytest.mark.django_db
class TestRepository:
    def test_signal(self):
        repository = Repository(name="Test Repository")
        repository.save()
        assert repository.slug == "test-repository"

    def test_str(self):
        repository = Repository(name="Test Repository")
        assert str(repository) == "Test Repository"


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


@pytest.mark.django_db
class TestTask:
    def test_str(self):
        task = Task(name="Test Task")
        assert str(task) == "Test Task"


@pytest.mark.django_db
class TestUser:
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

    def test_social_account(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.salesforce_account is not None
        assert (
            user.salesforce_account
            == user.socialaccount_set.filter(provider="salesforce-production").first()
        )

        user.socialaccount_set.all().delete()
        assert user.salesforce_account is None

    def test_instance_url(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.instance_url == "https://example.com"

        user.socialaccount_set.all().delete()
        assert user.instance_url is None

    def test_token(self, user_factory, social_account_factory):
        user = user_factory()
        social_account_factory(user=user, provider="salesforce-production")
        assert user.sf_token == ("0123456789abcdef", "secret.0123456789abcdef")

        user.socialaccount_set.all().delete()
        assert user.sf_token == (None, None)

    def test_token__invalid(
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

    def test_is_devhub_enabled__shortcut_none(
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
        assert user.is_devhub_enabled is None

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
        with patch("metashare.api.models.requests.get") as get:
            response = MagicMock(status_code=200)
            get.return_value = response
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
        with patch("metashare.api.models.requests.get") as get:
            response = MagicMock(status_code=404)
            get.return_value = response
            assert not user.is_devhub_enabled

    def test_is_devhub_enabled__final_none(self, user_factory, social_account_factory):
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
        with patch("metashare.api.models.requests.get") as get:
            response = MagicMock(status_code=401)
            get.return_value = response
            assert user.is_devhub_enabled is None


@pytest.mark.django_db
class TestScratchOrg:
    # def test_save__new(self, user_factory, task_factory):
    #     user = user_factory()
    #     task = task_factory()
    #     scratch_org = ScratchOrg(task=task, owner=user, org_type="Dev")

    #     with patch("create_scratch_org_on_sf") as create_scratch_org_on_sf:
    #         scratch_org.save()
    #         assert create_scratch_org_on_sf.called

    # def test_save__new(self, user_factory, task_factory, scratch_org_factory):
    #     user = user_factory()
    #     task = task_factory()
    #     scratch_org = scratch_org_factory(task=task, owner=user, org_type="Dev")

    #     with patch(scratch_org, "notify_has_url") as notify_has_url:
    #         scratch_org.url = "https://example.com"
    #         scratch_org.save()
    #         assert notify_has_url.called

    # def test_create_scratch_org_on_sf(self, scratch_org_factory):
    #     scratch_org = scratch_org_factory()
    #     with patch(
    #         "metashare.api.models.create_scratch_org_job"
    #     ) as create_scratch_org_job:
    #         scratch_org.create_scratch_org_on_sf()

    #         assert create_scratch_org_job.delay.called

    def test_notify_has_url(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with patch("metashare.api.models.async_to_sync") as async_to_sync:
            scratch_org.notify_has_url()

            assert async_to_sync.called


@pytest.mark.django_db
class TestGitHubRepository:
    def test_str(self, git_hub_repository_factory):
        gh_repo = git_hub_repository_factory()
        assert str(gh_repo) == "https://example.com/repo.git"


@pytest.mark.django_db
def test_login_handler(user_factory):
    user = user_factory()
    with patch("metashare.api.models.gh") as gh:
        user_logged_in_handler(None, user=user)
        gh.get_all_org_repos.assert_called_with(user)
