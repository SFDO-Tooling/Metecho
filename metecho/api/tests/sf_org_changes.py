from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest

from ..sf_org_changes import (
    commit_changes_to_github,
    compare_revisions,
    get_latest_revision_numbers,
    get_valid_target_directories,
    retrieve_and_commit_dataset,
    run_retrieve_task,
)

PATCH_ROOT = "metecho.api.sf_org_changes"


@pytest.mark.django_db
class TestRunRetrieveTask:
    def test_run_retrieve_task(self, user_factory, scratch_org_factory):
        user = user_factory()
        with ExitStack() as stack:
            scratch_org = scratch_org_factory()

            stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))
            stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
            stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_valid_target_directories = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_valid_target_directories")
            )
            get_valid_target_directories.return_value = (
                {"source": ["src"], "config": [], "post": [], "pre": []},
                False,
            )
            retrieve_components = stack.enter_context(
                patch(f"{PATCH_ROOT}.retrieve_components")
            )

            desired_changes = {"name": ["member"]}
            run_retrieve_task(user, scratch_org, ".", desired_changes, "src", None)

            assert retrieve_components.called

    def test_run_retrieve_task__sfdx(self, user_factory, scratch_org_factory):
        user = user_factory()
        with ExitStack() as stack:
            scratch_org = scratch_org_factory()

            stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))
            stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
            stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_valid_target_directories = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_valid_target_directories")
            )
            get_valid_target_directories.return_value = (
                {"source": ["src"], "config": [], "post": [], "pre": []},
                True,
            )
            retrieve_components = stack.enter_context(
                patch(f"{PATCH_ROOT}.retrieve_components")
            )

            desired_changes = {"name": ["member"]}
            run_retrieve_task(user, scratch_org, ".", desired_changes, "src", None)

            assert retrieve_components.called

    def test_run_retrieve_task__sfdx__non_main(self, user_factory, scratch_org_factory):
        user = user_factory()
        with ExitStack() as stack:
            scratch_org = scratch_org_factory()

            stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))
            stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
            stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_valid_target_directories = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_valid_target_directories")
            )
            get_valid_target_directories.return_value = (
                {"source": ["src"], "config": [], "post": [], "pre": []},
                True,
            )
            retrieve_components = stack.enter_context(
                patch(f"{PATCH_ROOT}.retrieve_components")
            )

            desired_changes = {"name": ["member"]}
            run_retrieve_task(user, scratch_org, ".", desired_changes, "source", None)

            assert retrieve_components.called


@pytest.mark.django_db
def test_commit_changes_to_github(user_factory, scratch_org_factory):
    user = user_factory()
    with ExitStack() as stack:
        scratch_org = scratch_org_factory()

        local_github_checkout = stack.enter_context(
            patch(f"{PATCH_ROOT}.local_github_checkout")
        )
        local_github_checkout.return_value = MagicMock(
            __enter__=MagicMock(return_value=".")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.run_retrieve_task"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        CommitDir = stack.enter_context(patch(f"{PATCH_ROOT}.CommitDir"))

        desired_changes = {"name": ["member"]}
        commit_changes_to_github(
            user=user,
            scratch_org=scratch_org,
            repo_id=123,
            branch="test-branch",
            desired_changes=desired_changes,
            commit_message="test message",
            target_directory="src",
            originating_user_id=None,
        )

        assert CommitDir.called


@pytest.mark.django_db
class TestRetrieveAndCommitDataset:
    def test_ok__existing_dataset(self, mocker, tmp_path):
        folder = tmp_path / "datasets" / "Test"
        folder.mkdir(parents=True)
        file = folder / "Test.extract.yml"
        file.write_text("OLD CONTENT")
        mocker.patch(
            f"{PATCH_ROOT}.local_github_checkout",
            autospec=True,
            **{"return_value.__enter__.return_value": str(tmp_path)},
        )
        CommitDir = mocker.patch(f"{PATCH_ROOT}.CommitDir", autospec=True)

        retrieve_and_commit_dataset(
            repo=mocker.MagicMock(),
            branch="some-branch",
            author={"email": "test@test.com"},
            commit_message="Testing",
            dataset_name="Test",
            dataset_definition={"foo": "bar"},
        )

        CommitDir.return_value.assert_called_once_with(
            str(tmp_path), branch="some-branch", commit_message="Testing"
        )
        assert file.read_text() == "foo: bar\n"

    def test_ok__new_dataset(self, mocker, tmp_path):
        mocker.patch(
            f"{PATCH_ROOT}.local_github_checkout",
            autospec=True,
            **{"return_value.__enter__.return_value": str(tmp_path)},
        )
        CommitDir = mocker.patch(f"{PATCH_ROOT}.CommitDir", autospec=True)

        retrieve_and_commit_dataset(
            repo=mocker.MagicMock(),
            branch="some-branch",
            author={"email": "test@test.com"},
            commit_message="Testing",
            dataset_name="Test",
            dataset_definition={"foo": "bar"},
        )

        CommitDir.return_value.assert_called_once_with(
            str(tmp_path), branch="some-branch", commit_message="Testing"
        )
        assert (
            tmp_path / "datasets" / "Test" / "Test.extract.yml"
        ).read_text() == "foo: bar\n"


def test_get_latest_revision_numbers():
    with ExitStack() as stack:
        Salesforce = stack.enter_context(
            patch(f"{PATCH_ROOT}.simple_salesforce.Salesforce")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))

        conn = MagicMock()
        conn.query_all.return_value = {
            "records": [
                {
                    "MemberType": "some-type-1",
                    "MemberName": "some-name-1",
                    "RevisionCounter": 3,
                },
                {
                    "MemberType": "some-type-1",
                    "MemberName": "some-name-2",
                    "RevisionCounter": 3,
                },
                {
                    "MemberType": "some-type-2",
                    "MemberName": "some-name-1",
                    "RevisionCounter": 3,
                },
                {
                    "MemberType": "some-type-2",
                    "MemberName": "some-name-2",
                    "RevisionCounter": 3,
                },
            ]
        }
        Salesforce.return_value = conn

        scratch_org = MagicMock()

        get_latest_revision_numbers(
            scratch_org=scratch_org,
            originating_user_id=None,
        )

        assert conn.query_all.called


def test_compare_revisions__true():
    old = {}
    new = {"type": {"name": 1}}
    assert compare_revisions(old, new)


def test_compare_revisions__false():
    old = {"type": {"name": 1}}
    new = {"type": {"name": 1}}
    assert not compare_revisions(old, new)


@pytest.mark.django_db
class TestGetValidTargetDirectories:
    def test_get_valid_target_directories__self(
        self, user_factory, scratch_org_factory
    ):
        with ExitStack() as stack:
            open_mock = stack.enter_context(patch(f"{PATCH_ROOT}.open"))
            stack.enter_context(patch(f"{PATCH_ROOT}.os"))
            stack.enter_context(patch(f"{PATCH_ROOT}.os.path"))
            stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_source_format = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_source_format")
            )
            get_source_format.return_value = "sfdx"

            file_mock = MagicMock()
            file_mock.read.return_value = '{"packageDirectories":[{"path":"package"}]}'
            open_context_manager = MagicMock()
            open_context_manager.__enter__.return_value = file_mock
            open_mock.return_value = open_context_manager

            scratch_org = scratch_org_factory(config={"source_format": "sfdx"})

            user = user_factory()
            repo_root = "."

            actual, _ = get_valid_target_directories(user, scratch_org, repo_root)

            assert actual == {
                "source": ["package"],
                "pre": [],
                "post": [],
                "config": [],
            }

    def test_get_valid_target_directories__other(
        self, user_factory, scratch_org_factory
    ):
        with ExitStack() as stack:
            open_mock = stack.enter_context(patch(f"{PATCH_ROOT}.open"))
            stack.enter_context(patch(f"{PATCH_ROOT}.os"))
            stack.enter_context(patch(f"{PATCH_ROOT}.os.path"))
            stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_source_format = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_source_format")
            )
            get_source_format.return_value = "other"

            file_mock = MagicMock()
            file_mock.read.return_value = '{"packageDirectories":[{"path":"package"}]}'
            open_context_manager = MagicMock()
            open_context_manager.__enter__.return_value = file_mock
            open_mock.return_value = open_context_manager

            scratch_org = scratch_org_factory(config={"source_format": "sfdx"})

            user = user_factory()
            repo_root = "."

            actual, _ = get_valid_target_directories(user, scratch_org, repo_root)

            assert actual == {"source": ["src"], "pre": [], "post": [], "config": []}
