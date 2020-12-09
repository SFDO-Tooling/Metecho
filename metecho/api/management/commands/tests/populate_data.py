from contextlib import ExitStack
from unittest.mock import patch

import pytest
from django.core.management import call_command

from ....models import Project


@pytest.mark.django_db
def test_populate_data():
    assert Project.objects.count() == 0

    with ExitStack() as stack:
        get_repo_id = stack.enter_context(
            patch("metecho.api.models.Project.get_repo_id")
        )
        get_repo_id.return_value = 8080
        call_command("populate_data")

    assert Project.objects.count() == 14
