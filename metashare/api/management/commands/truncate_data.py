from django.core.management.base import BaseCommand

from ...models import Product, ProductSlug, Project, ProjectSlug


class Command(BaseCommand):
    help = "Delete all API data, without touching users or social apps"

    def handle(self, *args, **options):
        ordered_models = [ProjectSlug, Project, ProductSlug, Product]

        for model_class in ordered_models:
            model_class.objects.all().delete()
