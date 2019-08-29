from unittest.mock import MagicMock, patch

import pytest

from ..jobs import create_branches_on_github, create_scratch_org


def test_create_scratch_org():
    scratch_org = MagicMock()
    user = None
    with patch("metashare.api.jobs.make_scratch_org") as make_scratch_org:
        create_scratch_org(
            scratch_org,
            user=user,
            repo_url="https://github.com/test/repo",
            commit_ish="master",
        )
        assert make_scratch_org.called


@pytest.mark.django_db
def test_create_branches_on_github(user_factory):
    user = user_factory()
    with patch("metashare.api.jobs.login") as login:
        repository = MagicMock()
        gh = MagicMock()
        gh.repository.return_value = repository
        login.return_value = gh

        create_branches_on_github(
            user=user,
            repo_url="https://github.com/user/repo",
            project_branch_name="project-branch",
            task_branch_name="task-branch",
        )

        assert repository.create_branch_ref.called
