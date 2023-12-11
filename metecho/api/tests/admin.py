from unittest.mock import MagicMock, patch

import pytest
from django import forms
from django.urls import reverse
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from github3.exceptions import NotFoundError

from ..admin import JSONWidget, ProjectForm, SiteAdminForm, SoftDeletedListFilter
from ..models import Epic, GitHubOrganization


@pytest.mark.django_db
class TestSoftDeletedListFilter:
    def test_lookups(self):
        args = (
            None,
            {},
            None,
            None,
        )
        lookups = SoftDeletedListFilter(*args).lookups(None, None)
        assert lookups == (("true", _("Deleted")),)

    def test_queryset__not_deleted(self, epic_factory):
        epic = epic_factory()
        epic_factory(deleted_at=now())

        args = (
            None,
            {},
            None,
            None,
        )
        actual = SoftDeletedListFilter(*args).queryset(None, Epic.objects.all())
        assert list(actual) == [epic]

    def test_queryset__deleted(self, epic_factory):
        epic_factory()
        epic = epic_factory(deleted_at=now())

        args = (
            None,
            {"deleted_at": ["true"]},
            None,
            None,
        )
        actual = SoftDeletedListFilter(*args).queryset(None, Epic.objects.all())
        assert list(actual) == [epic]

    def test_choices(self):
        args = (
            None,
            {},
            None,
            None,
        )
        changelist = MagicMock()
        actual = SoftDeletedListFilter(*args).choices(changelist)

        assert set(next(actual).keys()) == {
            "selected",
            "query_string",
            "display",
        }
        assert set(next(actual).keys()) == {
            "selected",
            "query_string",
            "display",
        }


@pytest.mark.django_db
class TestProjectForm:
    def test_clean__repo_missing(self, user_factory):
        form = ProjectForm({"name": "Test", "repo_owner": "test", "repo_name": "test"})
        # This is how the user gets there in real circumstances, just
        # jammed on:
        form.user = user_factory()
        with patch("metecho.api.admin.gh.get_repo_info") as get_repo_info:
            get_repo_info.side_effect = NotFoundError(MagicMock())
            assert not form.is_valid()
            assert form.errors == {
                "__all__": [
                    "Could not access test/test using GitHub app. "
                    "Does the Metecho app need to be installed for this repository?"
                ],
            }


@pytest.mark.django_db
class TestProjectAdmin:
    @pytest.mark.parametrize(
        "repo_image_url, should_fetch",
        (
            ("", True),
            ("https://example.com", False),
        ),
    )
    def test_save(self, admin_client, mocker, repo_image_url, should_fetch):
        mocker.patch("metecho.api.admin.gh")
        get_social_image_job = mocker.patch("metecho.api.jobs.get_social_image_job")

        response = admin_client.post(
            reverse("admin:api_project_add"),
            data={
                "repo_image_url": repo_image_url,
                "repo_owner": "gh-user",
                "repo_name": "gh-repo",
                "name": "Project 1",
                "org_config_names": "[]",
                "branch_name": "main",
                "latest_sha": "abc123",
                "githubcollaboration_set-TOTAL_FORMS": 0,
                "githubcollaboration_set-INITIAL_FORMS": 0,
            },
        )

        assert get_social_image_job.delay.called == should_fetch, response.context[
            "form"
        ].errors


@pytest.mark.django_db
class TestGitHubOrganizationAdmin:
    def test_github_link(self, admin_client, git_hub_organization):
        href = f'href="https://github.com/{git_hub_organization.login}"'
        response = admin_client.get(reverse("admin:api_githuborganization_changelist"))
        assert href in str(response.content)

    def test_org__bad(self, admin_client, mocker):
        gh = mocker.patch("metecho.api.admin.gh", autospec=True)
        gh.gh_as_org.side_effect = Exception
        url = reverse("admin:api_githuborganization_add")

        response = admin_client.post(url, data={"name": "Test", "login": "test"})

        assert not GitHubOrganization.objects.exists()
        assert b"has not been installed" in response.content

    def test_org__good(self, admin_client, mocker):
        gh = mocker.patch("metecho.api.admin.gh", autospec=True)
        gh.gh_as_org.return_value.organization.return_value = mocker.MagicMock(
            avatar_url="http://example.com"
        )

        url = reverse("admin:api_githuborganization_add")
        admin_client.post(url, data={"name": "Test", "login": "test"})

        assert GitHubOrganization.objects.filter(
            name="Test", login="test", avatar_url="http://example.com"
        ).exists()


def test_json_widget():
    assert JSONWidget().value_from_datadict({"test": ""}, None, "test") == "{}"


class TestSiteAdminForm:
    def test_error(self):
        form = SiteAdminForm()
        form.cleaned_data = {"domain": "example.com/"}
        with pytest.raises(forms.ValidationError):
            form.clean_domain()

    def test_good(self):
        form = SiteAdminForm()
        form.cleaned_data = {"domain": "example.com"}
        assert form.clean_domain() == "example.com"
