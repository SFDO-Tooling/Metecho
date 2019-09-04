from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from github3.exceptions import UnprocessableEntity

from ..jobs import (
    create_branches_on_github,
    create_scratch_org,
    report_errors_on,
    try_to_make_branch,
)


@pytest.mark.django_db
def test_create_scratch_org(user_factory):
    scratch_org = MagicMock()
    user = user_factory()
    with ExitStack() as stack:
        ScratchOrgConfig = stack.enter_context(
            patch("metashare.api.jobs.ScratchOrgConfig")
        )
        scratch_org = MagicMock()
        ScratchOrgConfig.return_value = scratch_org
        stack.enter_context(patch("metashare.api.jobs.login"))
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
            login = stack.enter_context(patch("metashare.api.jobs.login"))
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
            login = stack.enter_context(patch("metashare.api.jobs.login"))
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


@pytest.mark.django_db
def test_report_errors_on(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch("metashare.api.jobs.get_channel_layer") as get_channel_layer:
        channel_layer = MagicMock()
        get_channel_layer.return_value = channel_layer
        try:
            with report_errors_on(scratch_org):
                raise ValueError
        except ValueError:
            pass
        assert channel_layer.group_send.called
