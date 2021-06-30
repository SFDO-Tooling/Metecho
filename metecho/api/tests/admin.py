from unittest.mock import MagicMock, patch

import pytest
from django import forms
from django.urls import reverse
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from github3.exceptions import NotFoundError

from ..admin import JSONWidget, ProjectForm, SiteAdminForm, SoftDeletedListFilter
from ..models import Epic


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
            {"deleted_at": "true"},
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

        admin_client.post(
            reverse("admin:api_project_add"),
            data={
                "repo_image_url": repo_image_url,
                "repo_owner": "gh-user",
                "repo_name": "gh-repo",
                "name": "Project 1",
                "github_users": "[]",
                "org_config_names": "[]",
                "branch_name": "main",
                "latest_sha": "abc123",
            },
        )

        assert get_social_image_job.delay.called == should_fetch


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
