from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from github3.exceptions import NotFoundError, UnprocessableEntity

from ..gh import (
    NoGitHubTokenError,
    UnsafeZipfileError,
    extract_zip_file,
    get_all_org_repos,
    get_repo_info,
    get_source_format,
    get_zip_file,
    gh_as_app,
    is_safe_path,
    local_github_checkout,
    log_unsafe_zipfile_error,
    normalize_commit,
    try_to_make_branch,
    validate_cumulusci_yml_unchanged,
    zip_file_is_safe,
)

PATCH_ROOT = "metecho.api.gh"


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
            assert len(get_all_org_repos(user)) == 1

    def test_bad_social_auth(self, user_factory):
        user = user_factory(socialaccount_set=[])
        with pytest.raises(NoGitHubTokenError):
            get_all_org_repos(user)


def test_gh_as_app():
    with patch("metecho.api.gh.GitHub"):
        assert gh_as_app("TestOrg", "TestRepo") is not None


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
        log_unsafe_zipfile_error("repo_url", "commit_ish")
        assert logger.error.called


@pytest.mark.django_db
class TestGetRepoInfo:
    def test_invalid_arguments(self):
        with pytest.raises(TypeError):
            get_repo_info(None, repo_id=123)

    def test_with_repo_id(self, user_factory):
        with patch(f"{PATCH_ROOT}.gh_given_user") as gh_given_user:
            user = user_factory()
            gh = MagicMock()
            gh_given_user.return_value = gh
            get_repo_info(user, repo_id=123)

            gh.repository_with_id.assert_called_with(123)

    def test_without_repo_id(self, user_factory):
        with patch(f"{PATCH_ROOT}.gh_given_user") as gh_given_user:
            user = user_factory()
            gh = MagicMock()
            gh_given_user.return_value = gh
            get_repo_info(user, repo_owner="owner", repo_name="name")

            gh.repository.assert_called_with("owner", "name")


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
        os = stack.enter_context(patch(f"{PATCH_ROOT}.os"))
        glob = stack.enter_context(patch(f"{PATCH_ROOT}.glob"))

        glob.return_value = ["owner-repo_name-"]
        extract_zip_file(zip_file, "owner", "repo_name")
        assert zip_file.extractall.called
        assert shutil.move.called
        assert shutil.rmtree.called
        assert os.remove.called


class TestLocalGitHubCheckout:
    def test_safe(self):
        user = MagicMock()
        repo = 123
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.zipfile"))
            os = stack.enter_context(patch(f"{PATCH_ROOT}.os"))
            gh_given_user = stack.enter_context(patch(f"{PATCH_ROOT}.gh_given_user"))
            shutil = stack.enter_context(patch(f"{PATCH_ROOT}.shutil"))
            glob = stack.enter_context(patch(f"{PATCH_ROOT}.glob"))
            repository = MagicMock(default_branch="main")
            repository.file_contents.side_effect = NotFoundError(MagicMock())
            gh = MagicMock()
            gh.repository_with_id.return_value = repository
            gh_given_user.return_value = gh
            glob.return_value = ["owner-repo_name-"]

            with local_github_checkout(user, repo):
                assert shutil.rmtree.called
                assert os.remove.called

    def test_unsafe(self):
        user = MagicMock()
        repo = 123
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


class TestTryCreateBranch:
    def test_try_to_make_branch__duplicate_name(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=400)
        resp.json.return_value = {"message": "Reference already exists"}
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        result = try_to_make_branch(
            repository, new_branch="new-branch", base_branch="base-branch"
        )

        assert result == "new-branch-1"

    def test_try_to_make_branch__long_duplicate_name(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=400)
        resp.json.return_value = {"message": "Reference already exists"}
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        result = try_to_make_branch(
            repository, new_branch="a" * 100, base_branch="base-branch"
        )

        assert result == "a" * 98 + "-1"

    def test_try_to_make_branch__unknown_error(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=400, msg="Test message")
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        with pytest.raises(UnprocessableEntity):
            try_to_make_branch(
                repository, new_branch="new-branch", base_branch="base-branch"
            )


def test_get_source_format():
    with patch(f"{PATCH_ROOT}.get_project_config") as get_project_config:
        get_project_config.return_value = MagicMock(project__source_format="sentinel")
        assert get_source_format() == "sentinel"


def test_validate_cumulusci_yml_unchanged():
    repo = MagicMock()
    repo.file_contents.return_value.decoded.decode.return_value = "1"

    with pytest.raises(Exception):
        validate_cumulusci_yml_unchanged(repo)


class TestNormalizeCommit:
    def test_dict(self):
        data = {
            "id": "id",
            "timestamp": "timestamp",
            "author": {
                "name": "name",
                "email": "email",
                "username": "username",
                "avatar_url": "avatar_url",
            },
            "message": "message",
            "url": "url",
        }
        expected = {
            "id": "id",
            "timestamp": "timestamp",
            "author": {
                "name": "name",
                "email": "email",
                "username": "username",
                "avatar_url": "avatar_url",
            },
            "message": "message",
            "url": "url",
        }
        assert (
            normalize_commit(
                data, sender={"avatar_url": "avatar_url", "login": "username"},
            )
            == expected
        )
