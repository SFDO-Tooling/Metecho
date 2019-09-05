from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from github3.exceptions import UnprocessableEntity

from ..jobs import (
    create_branches_on_github,
    create_branches_on_github_then_create_scratch_org,
    create_scratch_org,
    report_errors_on,
    run_appropriate_flow,
    try_to_make_branch,
)
from ..models import SCRATCH_ORG_TYPES


class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


PATCH_ROOT = "metashare.api.jobs"


@pytest.mark.django_db
def test_create_scratch_org(user_factory):
    scratch_org = MagicMock()
    user = user_factory()
    with ExitStack() as stack:
        ScratchOrgConfig = stack.enter_context(patch(f"{PATCH_ROOT}.ScratchOrgConfig"))
        scratch_org = MagicMock()
        ScratchOrgConfig.return_value = scratch_org
        stack.enter_context(patch(f"{PATCH_ROOT}.login"))
        create_scratch_org(
            scratch_org=scratch_org,
            user=user,
            repo_url="https://github.com/test/repo-lombardy",
            commit_ish="master",
        )
        assert scratch_org.create_org.called


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

    def test_try_to_make_branch(self, user_factory, task_factory):
        repository = MagicMock()
        resp = MagicMock(status_code=422, content="Test message")
        repository.create_branch_ref.side_effect = [UnprocessableEntity(resp), None]
        branch = MagicMock()
        branch.latest_sha.return_value = "1234abc"
        repository.branch.return_value = branch
        result = try_to_make_branch(
            repository, new_branch="new-branch", base_branch="base-branch"
        )

        assert result == "new-branch-1"


def test_run_appropriate_flow():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.login"))
        stack.enter_context(patch(f"{PATCH_ROOT}.MetaShareCCI"))
        extract_owner_and_repo = stack.enter_context(
            patch(f"{PATCH_ROOT}.extract_owner_and_repo")
        )
        extract_owner_and_repo.return_value = ("owner", "repo")
        flowrunner = stack.enter_context(patch(f"{PATCH_ROOT}.flowrunner"))
        run_appropriate_flow(
            MagicMock(org_type=SCRATCH_ORG_TYPES.Dev),
            user=MagicMock(),
            repo_root=MagicMock(),
            repo_url=MagicMock(),
            repo_branch=MagicMock(),
            org_config=MagicMock(),
        )

        assert flowrunner.FlowCoordinator.called


@pytest.mark.django_db
def test_report_errors_on(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message_about_instance:
        try:
            with report_errors_on(scratch_org):
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
        create_scratch_org = stack.enter_context(
            patch(f"{PATCH_ROOT}.create_scratch_org")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.run_appropriate_flow"))

        create_branches_on_github_then_create_scratch_org(
            project=MagicMock(),
            repo_url="https://github.com/user/repo",
            scratch_org=MagicMock(),
            task=MagicMock(),
            user=MagicMock(),
        )

        assert create_branches_on_github.called
        assert create_scratch_org.called
