from django.core.management.base import BaseCommand
from django.db.models import Q
from github3.exceptions import ResponseError

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
            except ResponseError:  # pragma: nocover
                pass
        for epic in Epic.objects.exclude(branch_name=""):
            try:
                refresh_commits(
                    project=epic.project,
                    branch_name=epic.branch_name,
                    originating_user_id=None,
                )
            except ResponseError:  # pragma: nocover
                pass
        for task in Task.objects.exclude(Q(branch_name="") | Q(origin_sha="")):
            try:
                refresh_commits(
                    project=task.root_project,
                    branch_name=task.branch_name,
                    originating_user_id=None,
                )
            except ResponseError:  # pragma: nocover
                pass
