import pytest


@pytest.mark.django_db
class TestSlugMixin:
    """
    We test this with an already mixed-in version, using Product and ProductSlug.
    """

    def test_ensure_slug(self, product_factory):
        product = product_factory()
        assert product.slug is None
        product.ensure_slug()
        assert product.slug is not None

    def test_find_unique_slug(self, product_factory):
        product = product_factory()
        assert product.slugs.count() == 0
        product.ensure_slug()
        product.slugs.update(is_active=False)
        assert product.slugs.count() == 1
        product.ensure_slug()
        assert product.slugs.count() == 2
