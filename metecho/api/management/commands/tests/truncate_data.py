import pytest
from django.core.management import call_command

from ....models import Repository, RepositorySlug


@pytest.mark.django_db
def test_truncate_data(repository_factory):
    repository_factory(repo_owner="test", repo_name="repo")
    repository_factory(repo_owner="test", repo_name="repo2")
    repository_factory(repo_owner="test", repo_name="repo3")

    assert RepositorySlug.objects.count() == 3
    assert Repository.objects.count() == 3

    call_command("truncate_data")

    assert RepositorySlug.objects.count() == 0
    assert Repository.objects.count() == 0
