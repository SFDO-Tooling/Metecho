import pytest
from django.core.management import call_command

from ....models import Repository, RepositorySlug


@pytest.mark.django_db
def test_truncate_data(repository_factory):
    repository_factory(repo_url="https://example.com/test-repo.git")
    repository_factory(repo_url="https://example.com/test-repo2.git")
    repository_factory(repo_url="https://example.com/test-repo3.git")

    assert RepositorySlug.objects.count() == 3
    assert Repository.objects.count() == 3

    call_command("truncate_data")

    assert RepositorySlug.objects.count() == 0
    assert Repository.objects.count() == 0
