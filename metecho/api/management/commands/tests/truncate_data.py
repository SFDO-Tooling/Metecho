import pytest
from django.core.management import call_command

from ....models import Epic, Project, ProjectSlug, Task


@pytest.mark.django_db
def test_truncate_data(project_factory, epic_factory, task_factory):
    project_factory(repo_owner="test", repo_name="repo")
    project_factory(repo_owner="test", repo_name="repo2")
    project = project_factory(repo_owner="test", repo_name="repo3")
    epic = epic_factory(project=project)
    task_factory(epic=epic)
    task_factory(epic=None, project=project)

    assert ProjectSlug.objects.count() == 3
    assert Project.objects.count() == 3
    assert Epic.objects.count() == 1
    assert Task.objects.count() == 2

    call_command("truncate_data")

    assert not ProjectSlug.objects.exists()
    assert not Project.objects.exists()
    assert not Epic.objects.exists()
    assert not Task.objects.exists()
