from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.utils.timezone import now
from github3.exceptions import UnprocessableEntity
from simple_salesforce.exceptions import SalesforceGeneralError

from ..jobs import (
    _create_branches_on_github,
    _create_org_and_run_flow,
    _try_to_make_branch,
    commit_changes_from_org,
    create_branches_on_github_then_create_scratch_org,
    delete_scratch_org,
    get_unsaved_changes,
    refresh_github_repositories_for_user,
)
from ..models import SCRATCH_ORG_TYPES

PATCH_ROOT = "metashare.api.jobs"


@pytest.mark.django_db
class TestCreateBranchesOnGitHub:
    def test_create_branches_on_github(self, user_factory, task_factory):
        user = user_factory()
        task = task_factory()
        project = task.project
        with ExitStack() as stack:
            global_config = stack.enter_context(
                patch("metashare.api.github_context.GlobalConfig")
            )
            global_config_instance = MagicMock()
            global_config.return_value = global_config_instance
            global_config_instance.get_project_config.return_value = MagicMock(
                project__git__prefix_feature="feature/"
            )
            login = stack.enter_context(patch(f"{PATCH_ROOT}.login"))
            repository = MagicMock()
            gh = MagicMock()
            gh.repository.return_value = repository
            login.return_value = gh

            _create_branches_on_github(
                user=user,
                repo_url="https://github.com/user/repo-bohemia",
                project=project,
                task=task,
                repo_root="",
            )

            assert repository.create_branch_ref.called

    def test_create_branches_on_github__already_there(
        self, user_factory, project_factory, task_factory
    ):
        user = user_factory()
        project = project_factory(branch_name="pepin")
        task = task_factory(branch_name="charlemagne", project=project)
        with ExitStack() as stack:
            global_config = stack.enter_context(
                patch("metashare.api.github_context.GlobalConfig")
            )
            global_config_instance = MagicMock()
            global_config.return_value = global_config_instance
            global_config_instance.get_project_config.return_value = MagicMock(
                project__git__prefix_feature="feature/"
            )
            login = stack.enter_context(patch(f"{PATCH_ROOT}.login"))
            repository = MagicMock()
            gh = MagicMock()
            gh.repository.return_value = repository
            login.return_value = gh

            _create_branches_on_github(
                user=user,
                repo_url="https://github.com/user/repo-francia",
                project=project,
                task=task,
                repo_root="",
            )

            assert not repository.create_branch_ref.called

    def test_try_to_make_branch__duplicate_name(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=422)
        resp.json.return_value = {"message": "Reference already exists"}
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        result = _try_to_make_branch(
            repository, new_branch="new-branch", base_branch="base-branch"
        )

        assert result == "new-branch-1"

    def test_try_to_make_branch__long_duplicate_name(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=422)
        resp.json.return_value = {"message": "Reference already exists"}
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        result = _try_to_make_branch(
            repository, new_branch="a" * 100, base_branch="base-branch"
        )

        assert result == "a" * 98 + "-1"

    def test_try_to_make_branch__unknown_error(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=422, msg="Test message")
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        with pytest.raises(UnprocessableEntity):
            _try_to_make_branch(
                repository, new_branch="new-branch", base_branch="base-branch"
            )


def test_create_org_and_run_flow():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.sf_changes"))
        sf_flow = stack.enter_context(patch(f"{PATCH_ROOT}.sf_flow"))
        sf_flow.create_org_and_run_flow.return_value = (MagicMock(), MagicMock())
        stack.enter_context(patch(f"{PATCH_ROOT}.login"))
        _create_org_and_run_flow(
            MagicMock(org_type=SCRATCH_ORG_TYPES.Dev),
            user=MagicMock(),
            repo_url="https://github.com/owner/repo",
            repo_branch=MagicMock(),
            project_path="",
        )

        assert sf_flow.create_org_and_run_flow.called


@pytest.mark.django_db
def test_get_unsaved_changes(scratch_org_factory):
    scratch_org = scratch_org_factory(latest_revision_numbers={"TypeOne:NameOne": 10})

    with patch(
        f"{PATCH_ROOT}.sf_changes.get_latest_revision_numbers"
    ) as get_latest_revision_numbers:
        get_latest_revision_numbers.return_value = {
            "TypeOne": {"NameOne": 13},
            "TypeTwo": {"NameTwo": 10},
        }

        get_unsaved_changes(scratch_org=scratch_org)
        scratch_org.refresh_from_db()

        assert scratch_org.unsaved_changes
        assert scratch_org.latest_revision_numbers == {
            "TypeOne": {"NameOne": 13},
            "TypeTwo": {"NameTwo": 10},
        }


def test_create_branches_on_github_then_create_scratch_org():
    # Not a great test, but not a complicated function.
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
        _create_branches_on_github = stack.enter_context(
            patch(f"{PATCH_ROOT}._create_branches_on_github")
        )
        _create_org_and_run_flow = stack.enter_context(
            patch(f"{PATCH_ROOT}._create_org_and_run_flow")
        )

        create_branches_on_github_then_create_scratch_org(
            project=MagicMock(),
            repo_url="https://github.com/user/repo",
            scratch_org=MagicMock(),
            task=MagicMock(),
            user=MagicMock(),
        )

        assert _create_branches_on_github.called
        assert _create_org_and_run_flow.called


@pytest.mark.django_db
def test_delete_scratch_org(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(f"{PATCH_ROOT}.sf_flow.delete_scratch_org") as sf_delete_scratch_org:
        delete_scratch_org(scratch_org)

        assert sf_delete_scratch_org.called


@pytest.mark.django_db
def test_delete_scratch_org__exception(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(f"{PATCH_ROOT}.sf_flow.delete_scratch_org") as sf_delete_scratch_org:
        sf_delete_scratch_org.side_effect = SalesforceGeneralError(
            "https://example.com", 418, "I'M A TEAPOT", [{"error": "Short and stout"}]
        )
        with pytest.raises(SalesforceGeneralError):
            delete_scratch_org(scratch_org)

        scratch_org.refresh_from_db()
        assert scratch_org.delete_queued_at is None


def test_refresh_github_repositories_for_user(user_factory):
    user = MagicMock()
    refresh_github_repositories_for_user(user)
    assert user.refresh_repositories.called


@pytest.mark.django_db
def test_commit_changes_from_org(scratch_org_factory, user_factory):
    scratch_org = scratch_org_factory()
    user = user_factory()
    with ExitStack() as stack:
        commit_changes_to_github = stack.enter_context(
            patch(f"{PATCH_ROOT}.sf_changes.commit_changes_to_github")
        )
        get_latest_revision_numbers = stack.enter_context(
            patch(f"{PATCH_ROOT}.sf_changes.get_latest_revision_numbers")
        )
        get_latest_revision_numbers.return_value = {}
        login = stack.enter_context(patch(f"{PATCH_ROOT}.login"))
        commit = MagicMock(
            sha="12345",
            html_url="https://github.com/test/user/foo",
            commit=MagicMock(author={"date": now()}),
        )
        repository = MagicMock()
        repository.branch.return_value = MagicMock(commit=commit)
        gh = MagicMock()
        gh.repository.return_value = repository
        login.return_value = gh

        desired_changes = {"name": ["member"]}
        commit_message = "test message"
        commit_changes_from_org(scratch_org, user, desired_changes, commit_message)

        assert commit_changes_to_github.called


# TODO: this should be bundled with each function, not all error-handling together.
@pytest.mark.django_db
class TestErrorHandling:
    def test_create_branches_on_github_then_create_scratch_org(
        self, user_factory, scratch_org_factory
    ):
        user = user_factory()
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metashare.api.models.async_to_sync")
            )
            _create_branches_on_github = stack.enter_context(
                patch(f"{PATCH_ROOT}._create_branches_on_github")
            )
            _create_branches_on_github.side_effect = Exception
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            scratch_org.delete = MagicMock()

            with pytest.raises(Exception):
                create_branches_on_github_then_create_scratch_org(
                    project=MagicMock(),
                    repo_url="https://github.org/test/repo",
                    scratch_org=scratch_org,
                    task=MagicMock(),
                    user=user,
                )

            assert scratch_org.delete.called
            assert async_to_sync.called

    def test_get_unsaved_changes(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metashare.api.models.async_to_sync")
            )
            get_latest_revision_numbers = stack.enter_context(
                patch(f"{PATCH_ROOT}.sf_changes.get_latest_revision_numbers")
            )
            get_latest_revision_numbers.side_effect = Exception

            with pytest.raises(Exception):
                get_unsaved_changes(scratch_org)

            assert async_to_sync.called

    def test_commit_changes_from_org(self, scratch_org_factory, user_factory):
        user = user_factory()
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            commit_changes_to_github = stack.enter_context(
                patch(f"{PATCH_ROOT}.sf_changes.commit_changes_to_github")
            )
            async_to_sync = stack.enter_context(
                patch("metashare.api.models.async_to_sync")
            )
            commit_changes_to_github.side_effect = Exception

            with pytest.raises(Exception):
                commit_changes_from_org(scratch_org, user, {}, "message")

            assert async_to_sync.called
