from django.core.management.base import BaseCommand

from ...models import Project, ProjectSlug, Repository, RepositorySlug, Task, TaskSlug


class Command(BaseCommand):
    help = "Delete all API data, without touching users or social apps"

    def handle(self, *args, **options):
        ordered_models = [
            TaskSlug,
            Task,
            ProjectSlug,
            Project,
            RepositorySlug,
            Repository,
        ]

        for model_class in ordered_models:
            model_class.objects.all().delete()
