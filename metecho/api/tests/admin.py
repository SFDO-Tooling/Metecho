from unittest.mock import MagicMock, patch, sentinel

import pytest
from django import forms
from github3.exceptions import NotFoundError

from ..admin import JSONWidget, RepositoryAdmin, RepositoryForm, SiteAdminForm


class TestRepositoryForm:
    @pytest.mark.django_db
    def test_clean(self, user_factory):
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


class TestRepositoryAdmin:
    def test_get_form(self):
        user = sentinel.user
        request = MagicMock(user=user)
        with patch("metecho.api.admin.admin.ModelAdmin.get_form") as get_form:
            get_form.return_value = sentinel.form
            admin = RepositoryAdmin(MagicMock(), MagicMock())
            result = admin.get_form(request)
            assert result.user == sentinel.user


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
