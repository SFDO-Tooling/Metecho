from contextlib import ExitStack
from unittest.mock import patch

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_resync_all_gh_user_data(project_factory):
    module_name = "metecho.api.management.commands.resync_all_gh_user_data"

    with ExitStack() as stack:
        project_factory(repo_id=1234)

        refresh_github_users = stack.enter_context(
            patch(f"{module_name}.refresh_github_users")
        )
        call_command("resync_all_gh_user_data")

        assert refresh_github_users.called
