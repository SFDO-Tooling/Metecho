import pytest
from django.core.management import call_command

from ....models import Repository


@pytest.mark.django_db
def test_populate_data():
    assert Repository.objects.count() == 0

    call_command("populate_data")

    assert Repository.objects.count() == 14
