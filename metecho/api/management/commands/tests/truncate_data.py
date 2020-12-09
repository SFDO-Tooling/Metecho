import pytest
from django.core.management import call_command

from ....models import Project, ProjectSlug


@pytest.mark.django_db
def test_truncate_data(project_factory):
    project_factory(repo_owner="test", repo_name="repo")
    project_factory(repo_owner="test", repo_name="repo2")
    project_factory(repo_owner="test", repo_name="repo3")

    assert ProjectSlug.objects.count() == 3
    assert Project.objects.count() == 3

    call_command("truncate_data")

    assert ProjectSlug.objects.count() == 0
    assert Project.objects.count() == 0
