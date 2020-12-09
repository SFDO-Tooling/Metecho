from django.core.management.base import BaseCommand

from ...jobs import populate_github_users
from ...models import Project


class Command(BaseCommand):
    help = "Reset and resync all stored collaborator lists from GitHub."

    def handle(self, *args, **options):
        for project in Project.objects.all():
            populate_github_users(project, originating_user_id=None)
