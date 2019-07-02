import pytest


@pytest.mark.django_db
class TestSlugMixin:
    """
    We test this with an already mixed-in version, using Product and ProductSlug.
    """

    def test_ensure_slug(self, product_factory):
        product = product_factory()
        assert product.slug is not None

    def test_find_unique_slug(self, product_factory):
        product = product_factory()
        assert product.slugs.count() == 1

        product.slugs.update(is_active=False)
        product.ensure_slug()
        assert product.slugs.count() == 2
        product.ensure_slug()
        assert product.slugs.count() == 2

    def test_no_slug(self, product_factory):
        product = product_factory()
        product.slugs.all().delete()
        assert product.slug is None
