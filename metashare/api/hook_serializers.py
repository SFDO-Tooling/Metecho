import logging

from rest_framework import serializers
from rest_framework.exceptions import NotFound

from .models import Project, Repository, Task

logger = logging.getLogger(__name__)


class HookSerializerMixin:
    def get_matching_repository(self):
        repo_id = self.validated_data["repository"]["id"]
        return Repository.objects.filter(repo_id=repo_id).first()


class HookRepositorySerializer(HookSerializerMixin, serializers.Serializer):
    id = serializers.IntegerField()


class AuthorCommitSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    avatar_url = serializers.CharField(required=False)


class PrSerializer(serializers.Serializer):
    merged = serializers.BooleanField()
    # All other fields are ignored by default.


class PrHookSerializer(HookSerializerMixin, serializers.Serializer):
    action = serializers.CharField()
    number = serializers.IntegerField()
    pull_request = PrSerializer()
    repository = HookRepositorySerializer()
    # All other fields are ignored by default.

    def _is_closed(self):
        return self.validated_data["action"] == "closed"

    def _is_merged(self):
        return self._is_closed() and self.validated_data["pull_request"]["merged"]

    def _is_reopened(self):
        return self.validated_data["action"] == "reopened"

    def _get_matching_instance(self, repository):
        return (
            Task.objects.filter(
                project__repository=repository, pr_number=self.validated_data["number"]
            ).first()
            or Project.objects.filter(
                repository=repository, pr_number=self.validated_data["number"]
            ).first()
        )

    def process_hook(self):
        repository = self.get_matching_repository()
        if not repository:
            raise NotFound("No matching repository.")

        if self._is_closed() or self._is_reopened():
            instance = self._get_matching_instance(repository)
            if instance is None:
                return
            if self._is_reopened():
                instance.finalize_pr_reopened()
            elif self._is_merged():
                instance.finalize_status_completed()
            else:
                instance.finalize_pr_closed()


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
        repository = self.get_matching_repository()
        if not repository:
            raise NotFound("No matching repository.")

        ref = self.validated_data["ref"]
        branch_prefix = "refs/heads/"
        if not ref.startswith(branch_prefix):
            logger.error(f"Received an invalid ref: {ref}")
            return
        prefix_len = len(branch_prefix)
        ref = ref[prefix_len:]

        if self._is_force_push():
            repository.queue_refresh_commits(ref=ref)
        else:
            sender = self.validated_data["sender"]
            repository.add_commits(
                commits=self.validated_data["commits"], ref=ref, sender=sender,
            )
