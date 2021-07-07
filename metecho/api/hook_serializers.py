import logging

from django.db.models.query_utils import Q
from rest_framework import serializers
from rest_framework.exceptions import NotFound

from .models import Epic, Project, Task

logger = logging.getLogger(__name__)


class HookSerializerMixin:
    def get_matching_project(self):
        repo_id = self.validated_data["repository"]["id"]
        return Project.objects.filter(repo_id=repo_id).first()


class HookRepositorySerializer(HookSerializerMixin, serializers.Serializer):
    id = serializers.IntegerField()


class AuthorCommitSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    avatar_url = serializers.CharField(required=False)


class PrBranchSerializer(serializers.Serializer):
    ref = serializers.CharField()
    sha = serializers.CharField()
    # All other fields are ignored by default.


class PrSerializer(serializers.Serializer):
    merged = serializers.BooleanField(required=False)
    head = PrBranchSerializer()
    base = PrBranchSerializer()
    number = serializers.IntegerField()
    # All other fields are ignored by default.


class PrHookSerializer(HookSerializerMixin, serializers.Serializer):
    action = serializers.CharField()
    number = serializers.IntegerField()
    pull_request = PrSerializer()
    repository = HookRepositorySerializer()
    # All other fields are ignored by default.

    def _is_opened(self):
        action = self.validated_data["action"]
        return action == "opened" or action == "reopened"

    def _is_closed(self):
        return self.validated_data["action"] == "closed"

    def _is_merged(self):
        return self._is_closed() and self.validated_data["pull_request"]["merged"]

    def _get_matching_instance(self, project):
        pr_number = self.validated_data["number"]
        pr_head_ref = self.validated_data["pull_request"]["head"]["ref"]
        pr_base_ref = self.validated_data["pull_request"]["base"]["ref"]
        return (
            Task.objects.filter(
                # Tasks with Epics
                Q(epic__project=project, pr_number=pr_number)
                | Q(
                    epic__project=project,
                    branch_name=pr_head_ref,
                    epic__branch_name=pr_base_ref,
                )
                # Tasks with Projects
                | Q(project=project, pr_number=pr_number)
                | Q(
                    project=project,
                    branch_name=pr_head_ref,
                    project__branch_name=pr_base_ref,
                )
            ).first()
            or Epic.objects.filter(
                Q(project=project, pr_number=pr_number)
                | Q(
                    project=project,
                    branch_name=pr_head_ref,
                    project__branch_name=pr_base_ref,
                )
            ).first()
        )

    def process_hook(self):
        project = self.get_matching_project()
        if not project:
            raise NotFound("No matching project.")

        if self._is_closed() or self._is_opened():
            instance = self._get_matching_instance(project)
            if instance is None:
                return
            # In all these, our originating user is None, because this
            # comes from the GitHub hook, and therefore all users on the
            # frontend should pay attention to it.
            pr_number = self.validated_data["number"]
            if self._is_opened():
                instance.finalize_pr_opened(pr_number, originating_user_id=None)
            elif self._is_merged():
                instance.finalize_status_completed(pr_number, originating_user_id=None)
            else:
                instance.finalize_pr_closed(pr_number, originating_user_id=None)


class CommitSerializer(serializers.Serializer):
    id = serializers.CharField()
    timestamp = serializers.CharField()
    author = AuthorCommitSerializer()
    message = serializers.CharField()
    url = serializers.CharField()


class HookSenderSerializer(serializers.Serializer):
    login = serializers.CharField(required=False)
    avatar_url = serializers.CharField(required=False)


class PushHookSerializer(HookSerializerMixin, serializers.Serializer):
    forced = serializers.BooleanField()
    ref = serializers.CharField()
    sender = HookSenderSerializer()
    commits = serializers.ListField(child=CommitSerializer())
    repository = HookRepositorySerializer()
    # All other fields are ignored by default.

    def _is_force_push(self):
        return self.validated_data["forced"]

    def process_hook(self):
        project = self.get_matching_project()
        if not project:
            raise NotFound("No matching project.")

        ref = self.validated_data["ref"]
        branch_prefix = "refs/heads/"
        tag_prefix = "refs/tags/"
        if ref.startswith(tag_prefix):
            logger.info(f"Received a tag ref, aborting: {ref}")
            return
        if not ref.startswith(branch_prefix):
            logger.warn(f"Received an invalid ref: {ref}")
            return
        prefix_len = len(branch_prefix)
        ref = ref[prefix_len:]

        if self._is_force_push():
            project.queue_refresh_commits(ref=ref, originating_user_id=None)
        else:
            sender = self.validated_data["sender"]
            project.add_commits(
                commits=self.validated_data["commits"],
                ref=ref,
                sender=sender,
            )


class PrReviewHookSerializer(HookSerializerMixin, serializers.Serializer):
    sender = HookSenderSerializer()
    repository = HookRepositorySerializer()
    pull_request = PrSerializer()

    def process_hook(self):
        project = self.get_matching_project()
        if not project:
            raise NotFound("No matching project.")

        pr_number = self.validated_data["pull_request"]["number"]
        task = Task.objects.filter(
            # Tasks with Epic
            Q(epic__project=project, pr_number=pr_number)
            # Tasks with Project
            | Q(project=project, pr_number=pr_number)
        ).first()
        if not task:
            raise NotFound("No matching task.")

        sender = self.validated_data["sender"]
        task.add_reviewer(sender)
