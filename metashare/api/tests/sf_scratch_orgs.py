from unittest.mock import MagicMock, patch

from ..sf_scratch_orgs import (
    clone_repo_locally,
    extract_user_and_repo,
    extract_zip_file,
    get_zip_file,
    is_safe_path,
    log_unsafe_zipfile_error,
    normalize_user_and_repo_name,
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


def test_log_unsafe_zipfile_error():
    with patch("metashare.api.sf_scratch_orgs.logger") as logger:
        log_unsafe_zipfile_error("user", "repo_name", "commit_ish")
        assert logger.error.called


def test_clone_repo_locally():
    with patch("metashare.api.sf_scratch_orgs.github3") as gh3:
        gh = MagicMock()
        gh3.login.return_value = gh
        clone_repo_locally("https://github.com/user/repo")

        gh.repository.assert_called_with("user", "repo")


def test_normalize_user_and_repo_name():
    repo = MagicMock()
    repo.owner.login = "username"
    repo.name = "reponame"
    assert normalize_user_and_repo_name(repo) == ("username", "reponame")


def test_get_zip_file():
    repo = MagicMock()
    with patch("metashare.api.sf_scratch_orgs.zipfile") as zipfile:
        get_zip_file(repo, "commit_ish")
        assert repo.archive.called
        assert zipfile.ZipFile.called


def test_extract_zip_file():
    zip_file = MagicMock()
    with patch("metashare.api.sf_scratch_orgs.shutil") as shutil:
        with patch("metashare.api.sf_scratch_orgs.glob") as glob:
            glob.return_value = ["user-repo_name-"]
            extract_zip_file(zip_file, "user", "repo_name")
            assert zip_file.extractall.called
            assert shutil.move.called
            assert shutil.rmtree.called
