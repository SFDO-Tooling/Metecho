from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.core.management import call_command

from ....models import Epic, Project, Task


@pytest.mark.django_db
def test_populate_data():
    assert Project.objects.count() == 0

    with ExitStack() as stack:
        get_repo_id = stack.enter_context(
            patch("metecho.api.models.Project.get_repo_id")
        )
        get_repo_id.return_value = 8080
        with patch("metecho.api.gh.gh_as_repo") as gh_as_repo:
            repo_branch = MagicMock()
            repo_branch.latest_sha.return_value = "abcd1234"
            repo_info = MagicMock(default_branch="main-branch")
            repo_info.branch.return_value = repo_branch
            gh_as_repo.return_value.repository.return_value = repo_info
            call_command("populate_data")

    assert Project.objects.count() == 1
    assert Epic.objects.exists()
    assert Task.objects.exists()
