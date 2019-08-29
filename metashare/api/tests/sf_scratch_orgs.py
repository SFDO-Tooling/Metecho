from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest

from ..sf_scratch_orgs import (
    call_out_to_sf_api,
    clone_repo_locally,
    extract_owner_and_repo,
    extract_zip_file,
    get_zip_file,
    is_safe_path,
    log_unsafe_zipfile_error,
    make_scratch_org,
    normalize_owner_and_repo_name,
    zip_file_is_safe,
)

PATCH_ROOT = "metashare.api.sf_scratch_orgs"


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
def test_clone_repo_locally(user_factory):
    with patch(f"{PATCH_ROOT}.github3") as gh3:
        user = user_factory()
        gh = MagicMock()
        gh3.login.return_value = gh
        clone_repo_locally(user, "https://github.com/owner/repo")

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


def test_call_out_to_sf_api():
    with patch(f"{PATCH_ROOT}.ScratchOrgConfig") as ScratchOrgConfig:
        scratch_org = MagicMock()
        ScratchOrgConfig.return_value = scratch_org
        call_out_to_sf_api()
        assert scratch_org.create_org.called


@pytest.mark.django_db
class TestMakeScratchOrg:
    def test_make_scratch_org(self, user_factory):
        user = user_factory()
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.shutil"))
            stack.enter_context(patch(f"{PATCH_ROOT}.glob"))
            stack.enter_context(patch(f"{PATCH_ROOT}.zipfile"))
            stack.enter_context(patch(f"{PATCH_ROOT}.github3"))
            ScratchOrgConfig = stack.enter_context(
                patch(f"{PATCH_ROOT}.ScratchOrgConfig")
            )
            scratch_org = MagicMock()
            ScratchOrgConfig.return_value = scratch_org

            repo_url = "https://github.com/SFDO-Tooling/CumulusCI-Test"
            commit_ish = "master"
            make_scratch_org(user, repo_url, commit_ish)

            assert scratch_org.create_org.called

    def test_make_scratch_org__unsafe_zipfile(self, user_factory):
        user = user_factory()
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.shutil"))
            stack.enter_context(patch(f"{PATCH_ROOT}.glob"))
            stack.enter_context(patch(f"{PATCH_ROOT}.zipfile"))
            stack.enter_context(patch(f"{PATCH_ROOT}.github3"))
            zip_file_is_safe = stack.enter_context(
                patch(f"{PATCH_ROOT}.zip_file_is_safe")
            )
            zip_file_is_safe.return_value = False
            ScratchOrgConfig = stack.enter_context(
                patch(f"{PATCH_ROOT}.ScratchOrgConfig")
            )
            scratch_org = MagicMock()
            ScratchOrgConfig.return_value = scratch_org

            repo_url = "https://github.com/SFDO-Tooling/CumulusCI-Test"
            commit_ish = "master"
            make_scratch_org(user, repo_url, commit_ish)

            assert not scratch_org.create_org.called
