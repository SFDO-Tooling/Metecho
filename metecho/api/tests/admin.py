from unittest.mock import MagicMock, patch

import pytest
from django import forms
from github3.exceptions import NotFoundError

from ..admin import JSONWidget, RepositoryForm, SiteAdminForm


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
                "__all__": [
                    "Could not access test/test using GitHub app. "
                    "Does the Metecho app need to be installed for this repository?"
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
