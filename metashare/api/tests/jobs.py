from unittest.mock import MagicMock, patch

import pytest
from github3.exceptions import UnprocessableEntity

from ..jobs import create_branches_on_github, create_scratch_org, try_to_make_branch


def test_create_scratch_org():
    scratch_org = MagicMock()
    user = None
    with patch("metashare.api.jobs.make_scratch_org") as make_scratch_org:
        create_scratch_org(
            scratch_org=scratch_org,
            user=user,
            repo_url="https://github.com/test/repo",
            commit_ish="master",
        )
        assert make_scratch_org.called


@pytest.mark.django_db
class TestCreateBranchesOnGitHub:
    def test_create_branches_on_github(self, user_factory, task_factory):
        user = user_factory()
        task = task_factory()
        project = task.project
        with patch("metashare.api.jobs.login") as login:
            repository = MagicMock()
            gh = MagicMock()
            gh.repository.return_value = repository
            login.return_value = gh

            create_branches_on_github(
                user=user,
                repo_url="https://github.com/user/repo",
                project=project,
                task=task,
            )

            assert repository.create_branch_ref.called

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
