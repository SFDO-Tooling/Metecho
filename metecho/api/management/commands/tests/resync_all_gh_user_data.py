from unittest.mock import patch

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_resync_all_gh_user_data(repository_factory):
    repository_factory()
    module_name = "metecho.api.management.commands.resync_all_gh_user_data"

    with patch(f"{module_name}.populate_github_users") as populate_github_users:
        call_command("resync_all_gh_user_data")

        assert populate_github_users.called
