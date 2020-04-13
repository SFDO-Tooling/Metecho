from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django import forms
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from github3.exceptions import NotFoundError

from ..admin import JSONWidget, RepositoryForm, SiteAdminForm, SoftDeletedListFilter
from ..models import Project


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

    def test_queryset__not_deleted(self, project_factory):
        project = project_factory()
        project_factory(deleted_at=now())

        args = (
            None,
            {},
            None,
            None,
        )
        actual = SoftDeletedListFilter(*args).queryset(None, Project.objects.all())
        assert list(actual) == [project]

    def test_queryset__deleted(self, project_factory):
        project_factory()
        project = project_factory(deleted_at=now())

        args = (
            None,
            {"deleted_at": "true"},
            None,
            None,
        )
        actual = SoftDeletedListFilter(*args).queryset(None, Project.objects.all())
        assert list(actual) == [project]

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
class TestRepositoryForm:
    def test_clean__repo_missing(self, user_factory):
        form = RepositoryForm(
            {"name": "Test", "repo_owner": "test", "repo_name": "test"}
        )
        # This is how the user gets there in real circumstances, just
        # jammed on:
        form.user = user_factory()
        with patch("metecho.api.admin.gh.get_repo_info") as get_repo_info:
            get_repo_info.side_effect = NotFoundError(MagicMock())
            assert not form.is_valid()
            assert form.errors == {
                "__all__": ["No repository with this name and owner exists."],
            }

    def test_clean__app_not_installed(self, user_factory):
        form = RepositoryForm(
            {"name": "Test", "repo_owner": "test", "repo_name": "test"}
        )
        # This is how the user gets there in real circumstances, just
        # jammed on:
        form.user = user_factory()
        with ExitStack() as stack:
            stack.enter_context(patch("metecho.api.admin.gh.get_repo_info"))
            gh_as_app = stack.enter_context(patch("metecho.api.admin.gh.gh_as_app"))
            gh_as_app.return_value = MagicMock(
                **{
                    "app_installation_for_repository.side_effect": NotFoundError(
                        MagicMock()
                    ),
                }
            )
            assert not form.is_valid()
            assert form.errors == {
                "__all__": [
                    "The associated GitHub app is not installed for that repository."
                ],
            }


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
