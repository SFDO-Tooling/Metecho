from unittest.mock import MagicMock

from ..jobs import (
    create_scratch_org,
    extract_user_and_repo,
    is_safe_path,
    zip_file_is_safe,
)


def test_extract_user_and_repo():
    user, repo = extract_user_and_repo("https://github.com/user/repo/tree/master")
    assert user == "user"
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


def test_create_scratch_org():
    scratch_org = MagicMock()
    user = MagicMock(
        token=("token", "token_secret"), instance_url="https://example.com"
    )
    assert (
        create_scratch_org(
            scratch_org,
            user=user,
            repo_url="https://github.com/test/repo",
            commit_ish="master",
        )
        is None
    )
