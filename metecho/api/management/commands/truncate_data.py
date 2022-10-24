from django.core.management.base import BaseCommand

from ...models import (
    Epic,
    EpicSlug,
    GitHubUser,
    Project,
    ProjectSlug,
    ScratchOrg,
    Task,
    TaskSlug,
)


class Command(BaseCommand):
    help = "Delete all API data, without touching users or social apps"

    def handle(self, *args, **options):
        ordered_models = [
            ScratchOrg,
            TaskSlug,
            Task,
            EpicSlug,
            Epic,
            GitHubUser,
            ProjectSlug,
            Project,
        ]

        for model_class in ordered_models:
            try:
                model_class.objects.all().hard_delete()
            except AttributeError:  # pragma: nocover
                model_class.objects.all().delete()
