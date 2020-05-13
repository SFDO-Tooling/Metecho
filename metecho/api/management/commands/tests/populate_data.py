from contextlib import ExitStack
from unittest.mock import patch

import pytest
from django.core.management import call_command

from ....models import Repository


@pytest.mark.django_db
def test_populate_data():
    assert Repository.objects.count() == 0

    with ExitStack() as stack:
        stack.enter_context(patch("metecho.api.jobs.project_create_branch"))
        stack.enter_context(patch("metecho.api.models.gh"))
        get_repo_id = stack.enter_context(
            patch("metecho.api.models.Repository.get_repo_id")
        )
        get_repo_id.return_value = 8080
        call_command("populate_data")

    assert Repository.objects.count() == 14
