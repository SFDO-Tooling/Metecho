from django.core.management.base import BaseCommand
from django.db.models import Q
from github3.exceptions import NotFoundError

from ...jobs import refresh_commits
from ...models import Epic, Project, Task


class Command(BaseCommand):
    help = "Remove and resync all stored commits from GitHub."

    def handle(self, *args, **options):
        for project in Project.objects.exclude(branch_name=""):
            try:
                refresh_commits(
                    project=project,
                    branch_name=project.branch_name,
                    originating_user_id=None,
                )
            except NotFoundError:  # pragma: nocover
                pass
        for epic in Epic.objects.exclude(branch_name=""):
            refresh_commits(
                project=epic.project,
                branch_name=epic.branch_name,
                originating_user_id=None,
            )
        for task in Task.objects.exclude(Q(branch_name="") | Q(origin_sha="")):
            refresh_commits(
                project=task.epic.project,
                branch_name=task.branch_name,
                originating_user_id=None,
            )
