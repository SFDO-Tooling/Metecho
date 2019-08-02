from unittest.mock import MagicMock, patch

import pytest
from django.core.exceptions import ValidationError

from ..gh import (
    NoGitHubTokenError,
    create_branch,
    get_all_org_repos,
    normalize_github_url,
    validate_gh_url,
)


@pytest.mark.django_db
class TestCreateBranch:
    def test_debug(self, settings, user_factory):
        settings.DEBUG = True
        user = user_factory()
        repo_url = "https://www.github.com/test/repo"
        branch_name = "test-branch"
        with patch("metashare.api.gh.login") as login:
            repo = MagicMock()
            gh = MagicMock()
            gh.repository.return_value = repo
            login.return_value = gh

            create_branch(user, repo_url, branch_name)

            assert not repo.create_branch_ref.called

    def test_no_debug(self, settings, user_factory):
        settings.DEBUG = False
        user = user_factory()
        repo_url = "https://www.github.com/test/repo"
        branch_name = "test-branch"
        with patch("metashare.api.gh.login") as login:
            repo = MagicMock()
            gh = MagicMock()
            gh.repository.return_value = repo
            login.return_value = gh

            create_branch(user, repo_url, branch_name)

            assert repo.create_branch_ref.called


@pytest.mark.django_db
class TestGetAllOrgRepos:
    def test_good_social_auth(self, user_factory):
        user = user_factory()
        with patch("metashare.api.gh.login") as login:
            repo = MagicMock()
            repo.url = "test"
            gh = MagicMock()
            gh.repositories.return_value = [repo]
            login.return_value = gh
            assert get_all_org_repos(user) == {"https://www.github.com/test"}

    def test_bad_social_auth(self, user_factory):
        user = user_factory(socialaccount_set=[])
        with pytest.raises(NoGitHubTokenError):
            get_all_org_repos(user)


def test_normalize_github_url():
    actual = normalize_github_url("http://github.com/repos/test/repo.git")
    expected = "https://www.github.com/test/repo"

    assert actual == expected


def test_validate_gh_url():
    with pytest.raises(ValidationError):
        validate_gh_url("http://github.com/repos/test/repo.git")
