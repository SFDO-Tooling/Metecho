from contextlib import ExitStack
from unittest.mock import patch

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_resync_all_gh_user_data(repository_factory):
    module_name = "metecho.api.management.commands.resync_all_gh_user_data"

    with ExitStack() as stack:
        repository_factory(repo_id=1234)

        populate_github_users = stack.enter_context(
            patch(f"{module_name}.populate_github_users")
        )
        call_command("resync_all_gh_user_data")

        assert populate_github_users.called
