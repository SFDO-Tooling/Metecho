import itertools

from django.db import models
from django.utils.text import slugify
from hashid_field import HashidAutoField


class HashIdMixin(models.Model):
    class Meta:
        abstract = True

    id = HashidAutoField(primary_key=True)


class TimestampsMixin(models.Model):
    class Meta:
        abstract = True

    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(auto_now=True)


class SlugMixin:
    """
    Please provide:

        self.slug_class: the class that implements slugs for this model.
        self.slug_queryset: the name of the queryset for slugs for this
            model.
        self.slug_parent: the instance to assign as the slug parent.
    """

    def _find_unique_slug(self, original):
        max_length = 50  # This from SlugField

        candidate = original
        for i in itertools.count(1):
            if not self.slug_class.objects.filter(slug=candidate).exists():
                return candidate

            suffix = f"-{i}"
            candidate = candidate[: max_length - len(suffix)] + suffix

    @property
    def slug(self):
        slug = self.slug_queryset.filter(is_active=True).first()
        if slug:
            return slug.slug
        return None

    @property
    def old_slugs(self):
        slugs = self.slug_queryset.filter(is_active=True)[1:]
        return [slug.slug for slug in slugs]

    @property
    def slug_parent(self):
        return self

    def ensure_slug(self):
        if not self.slug_queryset.filter(is_active=True).exists():
            slug = slugify(self.name)
            slug = self._find_unique_slug(slug)
            self.slug_class.objects.create(
                parent=self.slug_parent, slug=slug, is_active=True
            )
