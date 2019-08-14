from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .fields import MarkdownField
from .models import Project, Repository, Task
from .validators import CaseInsensitiveUniqueTogetherValidator

User = get_user_model()


class HashidPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_representation(self, value):
        if self.pk_field is not None:
            return self.pk_field.to_representation(value.pk)
        return str(value.pk)


class FullUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "is_staff",
            "valid_token_for",
            "org_name",
            "org_type",
            "is_devhub_enabled",
            "sf_nickname",
        )


class MinimalUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username")


class RepositorySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)

    class Meta:
        model = Repository
        fields = (
            "id",
            "name",
            "repo_url",
            "description",
            "is_managed",
            "slug",
            "old_slugs",
        )


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    repository = serializers.PrimaryKeyRelatedField(
        queryset=Repository.objects.all(), pk_field=serializers.CharField()
    )
    branch_url = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "slug",
            "old_slugs",
            "repository",
            "branch_url",
        )
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Project.objects.all(),
                fields=("name", "repository"),
                message=_("A project with this name already exists."),
            ),
        )

    def get_branch_url(self, obj):
        return f"{obj.repository.repo_url}/tree/{obj.branch_name}"


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), pk_field=serializers.CharField()
    )
    assignee = HashidPrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "name",
            "description",
            "project",
            "assignee",
            "slug",
            "old_slugs",
        )
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Task.objects.all(),
                fields=("name", "project"),
                message=_("A task with this name already exists."),
            ),
        )
