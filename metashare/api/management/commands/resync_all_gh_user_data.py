from django.core.management.base import BaseCommand

from ...jobs import populate_github_users
from ...models import Repository


class Command(BaseCommand):
    help = "Reset and resync all stored collaborator lists from GitHub."

    def handle(self, *args, **options):
        for repository in Repository.objects.all():
            populate_github_users(repository)
