import pytest
from django.core.management import call_command

from ....models import Product, ProductSlug


@pytest.mark.django_db
def test_truncate_data(product_factory):
    product_factory(repo_url="https://example.com/test-repo.git")
    product_factory(repo_url="https://example.com/test-repo2.git")
    product_factory(repo_url="https://example.com/test-repo3.git")

    assert ProductSlug.objects.count() == 3
    assert Product.objects.count() == 3

    call_command("truncate_data")

    assert ProductSlug.objects.count() == 0
    assert Product.objects.count() == 0
