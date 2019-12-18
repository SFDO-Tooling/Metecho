from unittest.mock import patch

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_resync_all_gh_commit_data(task_factory):
    task_factory(branch_name="test", origin_sha="1234567sha")
    module_name = "metashare.api.management.commands.resync_all_gh_commit_data"

    with patch(f"{module_name}.refresh_commits") as refresh_commits:
        call_command("resync_all_gh_commit_data")

        assert refresh_commits.called
