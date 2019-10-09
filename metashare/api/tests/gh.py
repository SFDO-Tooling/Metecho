from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.core.exceptions import ValidationError

from ..gh import (
    NoGitHubTokenError,
    UnsafeZipfileError,
    extract_owner_and_repo,
    extract_zip_file,
    get_all_org_repos,
    get_repo_info,
    get_zip_file,
    is_safe_path,
    local_github_checkout,
    log_unsafe_zipfile_error,
    normalize_github_url,
    normalize_owner_and_repo_name,
    validate_gh_url,
    zip_file_is_safe,
)

PATCH_ROOT = "metashare.api.gh"


@pytest.mark.django_db
class TestGetAllOrgRepos:
    def test_good_social_auth(self, user_factory):
        user = user_factory()
        with patch(f"{PATCH_ROOT}.login") as login:
            repo = MagicMock()
            repo.url = "test"
            gh = MagicMock()
            gh.repositories.return_value = [repo]
            login.return_value = gh
            assert get_all_org_repos(user) == {"https://github.com/test"}

    def test_bad_social_auth(self, user_factory):
        user = user_factory(socialaccount_set=[])
        with pytest.raises(NoGitHubTokenError):
            get_all_org_repos(user)


def test_normalize_github_url():
    actual = normalize_github_url("http://github.com/repos/test/repo.git")
    expected = "https://github.com/test/repo"

    assert actual == expected


def test_validate_gh_url():
    with pytest.raises(ValidationError):
        validate_gh_url("http://github.com/repos/test/repo.git")


def test_extract_owner_and_repo():
    owner, repo = extract_owner_and_repo("https://github.com/owner/repo/tree/master")
    assert owner == "owner"
    assert repo == "repo"


def test_is_safe_path():
    assert not is_safe_path("/foo")
    assert not is_safe_path("../bar")
    assert is_safe_path("bar")


def test_zip_file_is_safe():
    info = MagicMock(filename="foo")
    zip_file = MagicMock()
    zip_file.infolist.return_value = [info]

    assert zip_file_is_safe(zip_file)


def test_log_unsafe_zipfile_error():
    with patch(f"{PATCH_ROOT}.logger") as logger:
        log_unsafe_zipfile_error("owner", "repo_name", "commit_ish")
        assert logger.error.called


@pytest.mark.django_db
def test_get_repo_info(user_factory):
    with patch(f"{PATCH_ROOT}.gh_given_user") as gh_given_user:
        user = user_factory()
        gh = MagicMock()
        gh_given_user.return_value = gh
        get_repo_info(user, "https://github.com/owner/repo")

        gh.repository.assert_called_with("owner", "repo")


def test_normalize_owner_and_repo_name():
    repo = MagicMock()
    repo.owner.login = "owner"
    repo.name = "reponame"
    assert normalize_owner_and_repo_name(repo) == ("owner", "reponame")


def test_get_zip_file():
    repo = MagicMock()
    with patch(f"{PATCH_ROOT}.zipfile") as zipfile:
        get_zip_file(repo, "commit_ish")
        assert repo.archive.called
        assert zipfile.ZipFile.called


def test_extract_zip_file():
    zip_file = MagicMock()
    with ExitStack() as stack:
        shutil = stack.enter_context(patch(f"{PATCH_ROOT}.shutil"))
        glob = stack.enter_context(patch(f"{PATCH_ROOT}.glob"))

        glob.return_value = ["owner-repo_name-"]
        extract_zip_file(zip_file, "owner", "repo_name")
        assert zip_file.extractall.called
        assert shutil.move.called
        assert shutil.rmtree.called


class TestLocalGitHubCheckout:
    def test_safe(self):
        user = MagicMock()
        repo = "https://github.com/user/repo"
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.zipfile"))
            gh_given_user = stack.enter_context(patch(f"{PATCH_ROOT}.gh_given_user"))
            shutil = stack.enter_context(patch(f"{PATCH_ROOT}.shutil"))
            glob = stack.enter_context(patch(f"{PATCH_ROOT}.glob"))
            repository = MagicMock(default_branch="master")
            gh = MagicMock()
            gh.repository.return_value = repository
            gh_given_user.return_value = gh
            glob.return_value = ["owner-repo_name-"]

            with local_github_checkout(user, repo):
                assert shutil.rmtree.called

    def test_unsafe(self):
        user = MagicMock()
        repo = "https://github.com/user/repo"
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.zipfile"))
            gh_given_user = stack.enter_context(patch(f"{PATCH_ROOT}.gh_given_user"))
            stack.enter_context(patch(f"{PATCH_ROOT}.shutil"))
            glob = stack.enter_context(patch(f"{PATCH_ROOT}.glob"))
            zip_file_is_safe = stack.enter_context(
                patch(f"{PATCH_ROOT}.zip_file_is_safe")
            )
            zip_file_is_safe.return_value = False
            gh = MagicMock()
            gh_given_user.return_value = gh
            glob.return_value = [".."]

            with pytest.raises(UnsafeZipfileError):
                with local_github_checkout(user, repo, "commit-ish"):  # pragma: nocover
                    pass
