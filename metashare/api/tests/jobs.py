from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from github3.exceptions import UnprocessableEntity

from ..jobs import (
    create_branches_on_github,
    create_branches_on_github_then_create_scratch_org,
    create_org_and_run_flow,
    delete_scratch_org,
    mark_refreshing_changes,
    report_errors_on_delete,
    report_errors_on_provision,
    try_to_make_branch,
)
from ..models import SCRATCH_ORG_TYPES


class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


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

            create_branches_on_github(
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

            create_branches_on_github(
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
        result = try_to_make_branch(
            repository, new_branch="new-branch", base_branch="base-branch"
        )

        assert result == "new-branch-1"

    def test_try_to_make_branch__unknown_error(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=422, msg="Test message")
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        with pytest.raises(UnprocessableEntity):
            try_to_make_branch(
                repository, new_branch="new-branch", base_branch="base-branch"
            )


def test_create_org_and_run_flow():
    with ExitStack() as stack:
        sf_run_flow = stack.enter_context(patch(f"{PATCH_ROOT}.sf_run_flow"))
        sf_run_flow.create_org_and_run_flow.return_value = (MagicMock(), MagicMock())
        stack.enter_context(patch(f"{PATCH_ROOT}.login"))
        create_org_and_run_flow(
            MagicMock(org_type=SCRATCH_ORG_TYPES.Dev),
            user=MagicMock(),
            repo_url="https://github.com/owner/repo",
            repo_branch=MagicMock(),
            project_path="",
        )

        assert sf_run_flow.create_org_and_run_flow.called


@pytest.mark.django_db
def test_report_errors_on_provision(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message_about_instance:
        try:
            with report_errors_on_provision(scratch_org):
                raise ValueError
        except ValueError:
            pass
        assert push_message_about_instance.called


@pytest.mark.django_db
def test_report_errors_on_delete(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message_about_instance:
        try:
            with report_errors_on_delete(scratch_org):
                raise ValueError
        except ValueError:
            pass
        assert push_message_about_instance.called


def test_create_branches_on_github_then_create_scratch_org():
    # Not a great test, but not a complicated function.
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
        create_branches_on_github = stack.enter_context(
            patch(f"{PATCH_ROOT}.create_branches_on_github")
        )
        create_org_and_run_flow = stack.enter_context(
            patch(f"{PATCH_ROOT}.create_org_and_run_flow")
        )

        create_branches_on_github_then_create_scratch_org(
            project=MagicMock(),
            repo_url="https://github.com/user/repo",
            scratch_org=MagicMock(),
            task=MagicMock(),
            user=MagicMock(),
        )

        assert create_branches_on_github.called
        assert create_org_and_run_flow.called


@pytest.mark.django_db
def test_mark_refreshing_changes(scratch_org_factory):
    scratch_org = scratch_org_factory()
    assert not scratch_org.currently_refreshing_changes
    with mark_refreshing_changes(scratch_org):
        assert scratch_org.currently_refreshing_changes
    assert not scratch_org.currently_refreshing_changes


@pytest.mark.django_db
def test_delete_scratch_org(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(f"{PATCH_ROOT}.sf_run_flow.delete_scratch_org") as sf_delete_scratch_org:
        delete_scratch_org(scratch_org)

        assert sf_delete_scratch_org.called
