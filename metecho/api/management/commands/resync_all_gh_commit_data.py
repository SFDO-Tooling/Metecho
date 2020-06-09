from django.core.management.base import BaseCommand
from django.db.models import Q

from ...jobs import refresh_commits
from ...models import Task


class Command(BaseCommand):
    help = "Remove and resync all stored commits from GitHub."

    def handle(self, *args, **options):
        for task in Task.objects.exclude(Q(branch_name="") | Q(origin_sha="")):
            refresh_commits(
                repository=task.project.repository,
                branch_name=task.branch_name,
                originating_user_id=None,
            )
