from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.utils.timezone import now
from simple_salesforce.exceptions import SalesforceGeneralError

from ..jobs import (
    _create_branches_on_github,
    _create_org_and_run_flow,
    commit_changes_from_org,
    create_branches_on_github_then_create_scratch_org,
    create_pr,
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
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            global_config = stack.enter_context(patch("metashare.api.gh.GlobalConfig"))
            global_config_instance = MagicMock()
            global_config.return_value = global_config_instance
            global_config_instance.get_project_config.return_value = MagicMock(
                project__git__prefix_feature="feature/"
            )
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user, repo_id=123, project=project, task=task
            )

            assert repository.create_branch_ref.called

    def test_create_branches_on_github__already_there(
        self, user_factory, project_factory, task_factory
    ):
        user = user_factory()
        project = project_factory(branch_name="pepin")
        task = task_factory(branch_name="charlemagne", project=project)
        with ExitStack() as stack:
            global_config = stack.enter_context(patch("metashare.api.gh.GlobalConfig"))
            global_config_instance = MagicMock()
            global_config.return_value = global_config_instance
            global_config_instance.get_project_config.return_value = MagicMock(
                project__git__prefix_feature="feature/"
            )
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user, repo_id=123, project=project, task=task
            )

            assert not repository.create_branch_ref.called


def test_create_org_and_run_flow():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.get_latest_revision_numbers"))
        create_org = stack.enter_context(patch(f"{PATCH_ROOT}.create_org"))
        create_org.return_value = (MagicMock(), MagicMock(), MagicMock())
        run_flow = stack.enter_context(patch(f"{PATCH_ROOT}.run_flow"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        _create_org_and_run_flow(
            MagicMock(org_type=SCRATCH_ORG_TYPES.Dev),
            user=MagicMock(),
            repo_id=123,
            repo_branch=MagicMock(),
            project_path="",
        )

        assert create_org.called
        assert run_flow.called


@pytest.mark.django_db
def test_get_unsaved_changes(scratch_org_factory):
    scratch_org = scratch_org_factory(
        latest_revision_numbers={"TypeOne": {"NameOne": 10}}
    )

    with patch(
        f"{PATCH_ROOT}.get_latest_revision_numbers"
    ) as get_latest_revision_numbers:
        get_latest_revision_numbers.return_value = {
            "TypeOne": {"NameOne": 13},
            "TypeTwo": {"NameTwo": 10},
        }

        get_unsaved_changes(scratch_org=scratch_org)
        scratch_org.refresh_from_db()

        assert scratch_org.unsaved_changes == {
            "TypeOne": ["NameOne"],
            "TypeTwo": ["NameTwo"],
        }
        assert scratch_org.latest_revision_numbers == {"TypeOne": {"NameOne": 10}}


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

        create_branches_on_github_then_create_scratch_org(scratch_org=MagicMock())

        assert _create_branches_on_github.called
        assert _create_org_and_run_flow.called


@pytest.mark.django_db
def test_delete_scratch_org(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(f"{PATCH_ROOT}.delete_org") as sf_delete_scratch_org:
        delete_scratch_org(scratch_org)

        assert sf_delete_scratch_org.called


@pytest.mark.django_db
def test_delete_scratch_org__exception(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with ExitStack() as stack:
        get_latest_revision_numbers = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
        )
        get_latest_revision_numbers.return_value = {
            "name": {"member": 1, "member2": 1},
            "name1": {"member": 1, "member2": 1},
        }
        sf_delete_scratch_org = stack.enter_context(patch(f"{PATCH_ROOT}.delete_org"))
        sf_delete_scratch_org.side_effect = SalesforceGeneralError(
            "https://example.com", 418, "I'M A TEAPOT", [{"error": "Short and stout"}]
        )
        with pytest.raises(SalesforceGeneralError):
            delete_scratch_org(scratch_org)

        scratch_org.refresh_from_db()
        assert scratch_org.delete_queued_at is None
        assert get_latest_revision_numbers.called


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
            patch(f"{PATCH_ROOT}.commit_changes_to_github")
        )
        get_latest_revision_numbers = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
        )
        get_latest_revision_numbers.return_value = {
            "name": {"member": 1, "member2": 1},
            "name1": {"member": 1, "member2": 1},
        }
        get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        commit = MagicMock(
            sha="12345",
            html_url="https://github.com/test/user/foo",
            commit=MagicMock(author={"date": now()}),
        )
        repository = MagicMock()
        repository.branch.return_value = MagicMock(commit=commit)
        get_repo_info.return_value = repository

        desired_changes = {"name": ["member"]}
        commit_message = "test message"
        assert scratch_org.latest_revision_numbers == {}
        commit_changes_from_org(scratch_org, user, desired_changes, commit_message)

        assert commit_changes_to_github.called
        assert scratch_org.latest_revision_numbers == {"name": {"member": 1}}


# TODO: this should be bundled with each function, not all error-handling together.
@pytest.mark.django_db
class TestErrorHandling:
    def test_create_branches_on_github_then_create_scratch_org(
        self, scratch_org_factory
    ):
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
                    scratch_org=scratch_org
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
                patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
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
                patch(f"{PATCH_ROOT}.commit_changes_to_github")
            )
            async_to_sync = stack.enter_context(
                patch("metashare.api.models.async_to_sync")
            )
            commit_changes_to_github.side_effect = Exception

            with pytest.raises(Exception):
                commit_changes_from_org(scratch_org, user, {}, "message")

            assert async_to_sync.called


@pytest.mark.django_db
def test_create_pr(user_factory, task_factory):
    user = user_factory()
    task = task_factory()
    with patch(f"{PATCH_ROOT}.get_repo_info") as get_repo_info:
        repository = MagicMock()
        get_repo_info.return_value = repository

        create_pr(task, user)

        assert repository.create_pull.called


@pytest.mark.django_db
def test_create_pr__error(user_factory, task_factory):
    user = user_factory()
    task = task_factory()
    with ExitStack() as stack:
        repository = MagicMock()
        get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        get_repo_info.return_value = repository
        repository.create_pull = MagicMock()
        repository.create_pull.side_effect = Exception
        async_to_sync = stack.enter_context(patch("metashare.api.models.async_to_sync"))

        with pytest.raises(Exception):
            create_pr(task, user)

        assert async_to_sync.called
