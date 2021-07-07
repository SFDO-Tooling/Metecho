from contextlib import ExitStack
from unittest.mock import patch

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_resync_all_gh_commit_data(project_factory, epic_factory, task_factory):
    module_name = "metecho.api.management.commands.resync_all_gh_commit_data"

    with ExitStack() as stack:
        refresh_commits = stack.enter_context(patch(f"{module_name}.refresh_commits"))
        project_factory()
        epic_factory(branch_name="epic_branch")
        task_factory(
            branch_name="task_branch",
            origin_sha="1234567sha",
            epic__project__repo_id=1234,
            project=None,
        )
        call_command("resync_all_gh_commit_data")

        assert refresh_commits.called
