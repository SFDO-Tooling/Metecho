from typing import Optional

from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .fields import MarkdownField
from .models import Project, Repository, ScratchOrg, Task
from .validators import CaseInsensitiveUniqueTogetherValidator, GitHubUserValidator

User = get_user_model()


class FormattableDict:
    """
    Stupid hack to get a dict error message into a
    CaseInsensitiveUniqueTogetherValidator, so the error can be assigned
    to a particular key.
    """

    def __init__(self, key, msg):
        self.key = key
        self.msg = msg

    def format(self, *args, **kwargs):
        return {
            self.key: self.msg.format(*args, **kwargs),
        }


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
            "avatar_url",
            "is_staff",
            "valid_token_for",
            "org_name",
            "org_type",
            "is_devhub_enabled",
            "sf_username",
            "currently_fetching_repos",
            "devhub_username",
        )


class MinimalUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "avatar_url")


class RepositorySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    repo_url = serializers.SerializerMethodField()

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
            "github_users",
        )

    def get_repo_url(self, obj) -> Optional[str]:
        return f"https://github.com/{obj.repo_owner}/{obj.repo_name}"


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    repository = serializers.PrimaryKeyRelatedField(
        queryset=Repository.objects.all(), pk_field=serializers.CharField()
    )
    branch_url = serializers.SerializerMethodField()
    branch_diff_url = serializers.SerializerMethodField()
    pr_url = serializers.SerializerMethodField()

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
            "branch_diff_url",
            "has_unmerged_commits",
            "currently_creating_pr",
            "pr_url",
            "pr_is_open",
            "github_users",
        )
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Project.objects.all(),
                fields=("name", "repository"),
                message=FormattableDict(
                    "name", _("A project with this name already exists.")
                ),
            ),
            GitHubUserValidator(parent="repository"),
        )

    def get_branch_diff_url(self, obj) -> Optional[str]:
        repo = obj.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        repository_branch = repo.branch_name
        branch = obj.branch_name
        if repo_owner and repo_name and repository_branch and branch:
            return (
                f"https://github.com/{repo_owner}/{repo_name}/compare/"
                f"{repository_branch}...{branch}"
            )
        return None

    def get_branch_url(self, obj) -> Optional[str]:
        repo = obj.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None

    def get_pr_url(self, obj) -> Optional[str]:
        repo = obj.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        pr_number = obj.pr_number
        if repo_owner and repo_name and pr_number:
            return f"https://github.com/{repo_owner}/{repo_name}/pull/{pr_number}"
        return None


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), pk_field=serializers.CharField()
    )
    branch_url = serializers.SerializerMethodField()
    branch_diff_url = serializers.SerializerMethodField()
    pr_url = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id",
            "name",
            "description",
            "project",
            "slug",
            "old_slugs",
            "has_unmerged_commits",
            "currently_creating_pr",
            "branch_url",
            "commits",
            "branch_diff_url",
            "pr_url",
            "status",
            "pr_is_open",
            "assigned_dev",
            "assigned_qa",
        )
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Task.objects.all(),
                fields=("name", "project"),
                message=FormattableDict(
                    "name", _("A task with this name already exists.")
                ),
            ),
        )

    def get_branch_url(self, obj) -> Optional[str]:
        repo = obj.project.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None

    def get_branch_diff_url(self, obj) -> Optional[str]:
        project = obj.project
        project_branch = project.branch_name
        repo = project.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and project_branch and branch:
            return (
                f"https://github.com/{repo_owner}/{repo_name}/compare/"
                f"{project_branch}...{branch}"
            )
        return None

    def get_pr_url(self, obj) -> Optional[str]:
        repo = obj.project.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        pr_number = obj.pr_number
        if repo_owner and repo_name and pr_number:
            return f"https://github.com/{repo_owner}/{repo_name}/pull/{pr_number}"
        return None


class CreatePrSerializer(serializers.Serializer):
    title = serializers.CharField()
    critical_changes = serializers.CharField(allow_blank=True)
    additional_changes = serializers.CharField(allow_blank=True)
    issues = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)


class ScratchOrgSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    task = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(), pk_field=serializers.CharField()
    )
    owner = serializers.PrimaryKeyRelatedField(
        pk_field=serializers.CharField(),
        default=serializers.CurrentUserDefault(),
        read_only=True,
    )
    has_unsaved_changes = serializers.SerializerMethodField()

    class Meta:
        model = ScratchOrg
        fields = (
            "id",
            "task",
            "org_type",
            "owner",
            "last_modified_at",
            "expires_at",
            "latest_commit",
            "latest_commit_url",
            "latest_commit_at",
            "url",
            "unsaved_changes",
            "has_unsaved_changes",
            "currently_refreshing_changes",
            "currently_capturing_changes",
            "delete_queued_at",
            "owner_sf_username",
            "owner_gh_username",
        )
        extra_kwargs = {
            "last_modified_at": {"read_only": True},
            "expires_at": {"read_only": True},
            "latest_commit": {"read_only": True},
            "latest_commit_url": {"read_only": True},
            "latest_commit_at": {"read_only": True},
            "url": {"read_only": True},
            "unsaved_changes": {"read_only": True},
            "currently_refreshing_changes": {"read_only": True},
            "currently_capturing_changes": {"read_only": True},
        }

    def get_has_unsaved_changes(self, obj) -> bool:
        return bool(getattr(obj, "unsaved_changes", {}))

    def validate(self, data):
        if ScratchOrg.objects.filter(
            task=data["task"], org_type=data["org_type"]
        ).exists():
            raise serializers.ValidationError(
                _("A ScratchOrg of this type already exists for this task.")
            )
        return data

    def save(self, **kwargs):
        kwargs["owner"] = kwargs.get("owner", self.context["request"].user)
        return super().save(**kwargs)


class CommitSerializer(serializers.Serializer):
    commit_message = serializers.CharField()
    # Expect this to be Dict<str, List<str>>
    changes = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField())
    )
