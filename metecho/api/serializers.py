from typing import Literal, Optional, OrderedDict

from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _
from drf_spectacular.extensions import OpenApiSerializerFieldExtension
from drf_spectacular.plumbing import build_basic_type
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import Direction, extend_schema_field
from rest_framework import serializers
from rest_framework.fields import JSONField

from metecho.api.reassignment import can_assign_task_role

from .email_utils import get_user_facing_url
from .fields import MarkdownField
from .models import (
    Epic,
    GitHubCollaboration,
    GitHubIssue,
    GitHubOrganization,
    GitHubUser,
    Project,
    ProjectDependency,
    ScratchOrg,
    ScratchOrgType,
    SiteProfile,
    Task,
    TaskReviewStatus,
)
from .models import User as UserModel
from .sf_run_flow import is_org_good
from .validators import CaseInsensitiveUniqueTogetherValidator, UnattachedIssueValidator

HASH_ID_OPENAPI_TYPE = {"type": "string", "format": "HashID"}

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


class StringListField(serializers.ListField):
    child = serializers.CharField()


class HashIdModelSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)


class HashIdFix(OpenApiSerializerFieldExtension):
    # Fix drf_spectacular warnings about not knowing the return type of HashId fields
    target_class = "hashid_field.rest.UnconfiguredHashidSerialField"

    def map_serializer_field(self, auto_schema, direction):  # pragma: nocover
        return HASH_ID_OPENAPI_TYPE


class NestedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def __init__(self, serializer, **kwargs):
        """
        On read display a complete nested representation of the object(s)
        On write only require the PK (not an entire object) as value
        """
        self.serializer = serializer
        super().__init__(**kwargs)

    def use_pk_only_optimization(self):
        # Required when serializing single objects (`many=False`)
        return False  # pragma: nocover

    def to_representation(self, obj):
        return self.serializer(obj, context=self.context).to_representation(obj)

    def get_choices(self, cutoff=None):  # pragma: nocover
        # Minor tweaks to make this compatible with DRF's HTML view
        queryset = self.get_queryset()
        if queryset is None:
            return {}  # pragma: nocover

        if cutoff is not None:
            queryset = queryset[:cutoff]

        return OrderedDict(((item.pk, self.display_value(item)) for item in queryset))


class NestedPkExtension(OpenApiSerializerFieldExtension):

    target_class = NestedPrimaryKeyRelatedField

    def map_serializer_field(self, auto_schema, direction: Direction):
        """
        Ensure drf-spectacular use different read/write serializers for
        `NestedPrimaryKeyRelatedField`. Requires `COMPONENT_SPLIT_REQUEST` to be enabled
        in drf-spectacular settings.
        """
        if direction == "response":
            component = auto_schema.resolve_serializer(
                self.target.serializer, direction
            )
            return component.ref if component else None
        return (
            HASH_ID_OPENAPI_TYPE
            if isinstance(self.target.pk_field, serializers.CharField)
            else build_basic_type(int)
        )


class GitHubIssueSerializer(HashIdModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), pk_field=serializers.CharField()
    )
    epic = serializers.SerializerMethodField()
    task = serializers.SerializerMethodField()

    class Meta:
        model = GitHubIssue
        read_only_fields = (
            "id",
            "number",
            "title",
            "created_at",
            "html_url",
            "project",
            "epic",
            "task",
        )
        fields = read_only_fields

    @extend_schema_field(
        {
            "properties": {
                "id": {"type": "string", "format": "HashID"},
                "name": {"type": "string"},
                "status": {"type": "string"},
                "slug": {"type": "string"},
            },
            "nullable": True,
        }
    )
    def get_epic(self, issue):
        try:
            return {
                "id": str(issue.epic.id),
                "name": issue.epic.name,
                "status": issue.epic.status,
                "slug": issue.epic.slug,
            }
        except Epic.DoesNotExist:
            return None

    @extend_schema_field(
        {
            "properties": {
                "id": {"type": "string", "format": "HashID"},
                "name": {"type": "string"},
                "status": {"type": "string"},
                "review_status": {"type": "string"},
                "review_valid": {"type": "boolean"},
                "pr_is_open": {"type": "boolean"},
                "slug": {"type": "string"},
                "epic_slug": {"type": "string", "nullable": True},
            },
            "nullable": True,
        }
    )
    def get_task(self, issue):
        try:
            return {
                "id": str(issue.task.id),
                "name": issue.task.name,
                "status": issue.task.status,
                "review_status": issue.task.review_status,
                "review_valid": issue.task.review_valid,
                "pr_is_open": issue.task.pr_is_open,
                "slug": issue.task.slug,
                "epic_slug": issue.task.epic.slug if issue.task.epic else None,
            }
        except Task.DoesNotExist:
            return None


class RepoPermissionSerializer(serializers.Serializer):
    push = serializers.BooleanField(required=False)
    pull = serializers.BooleanField(required=False)
    admin = serializers.BooleanField(required=False)


class ShortGitHubUserSerializer(serializers.Serializer):
    """See https://github3py.readthedocs.io/en/master/api-reference/users.html#github3.users.ShortUser"""  # noqa: B950

    id = serializers.IntegerField()
    login = serializers.CharField()
    name = serializers.CharField(required=False)
    avatar_url = serializers.URLField(required=False)


class GitHubCollaboratorSerializer(serializers.ModelSerializer):
    # Massage `GitHubCollaboration` instances to match the GitHub user shape
    id = serializers.IntegerField(source="user.id")
    name = serializers.CharField(source="user.name")
    login = serializers.CharField(source="user.login")
    avatar_url = serializers.URLField(source="user.avatar_url")
    permissions = RepoPermissionSerializer(required=False)

    class Meta:
        model = GitHubCollaboration
        fields = ("id", "name", "login", "avatar_url", "permissions")


class GitHubOrganizationSerializer(HashIdModelSerializer):
    class Meta:
        model = GitHubOrganization
        fields = ("id", "name", "avatar_url")


class GitHubAppInstallationCheckSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    messages = StringListField()


class OrgConfigNameSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField(required=False)
    description = serializers.CharField(required=False)


class GuidedTourSerializer(serializers.ModelSerializer):
    enabled = serializers.BooleanField(
        source="self_guided_tour_enabled", required=False
    )
    state = serializers.JSONField(source="self_guided_tour_state", required=False)

    class Meta:
        model = User
        fields = ("enabled", "state")


class FullUserSerializer(HashIdModelSerializer):
    sf_username = serializers.SerializerMethodField()
    organizations = GitHubOrganizationSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "avatar_url",
            "github_id",
            "is_staff",
            "valid_token_for",
            "org_name",
            "org_type",
            "is_devhub_enabled",
            "sf_username",
            "currently_fetching_repos",
            "currently_fetching_orgs",
            "devhub_username",
            "uses_global_devhub",
            "agreed_to_tos_at",
            "onboarded_at",
            "self_guided_tour_enabled",
            "self_guided_tour_state",
            "organizations",
        )

    def get_sf_username(self, obj) -> Optional[str]:
        if obj.uses_global_devhub:
            return None
        return obj.sf_username


class MinimalUserSerializer(HashIdModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "avatar_url")


class ProjectDependencySerializer(HashIdModelSerializer):
    class Meta:
        model = ProjectDependency
        fields = ("id", "name", "recommended")


class CheckRepoNameSerializer(serializers.Serializer):
    name = serializers.CharField()


class ProjectCreateSerializer(serializers.ModelSerializer):
    organization = serializers.PrimaryKeyRelatedField(
        queryset=GitHubOrganization.objects.all(), pk_field=serializers.CharField()
    )
    dependencies = serializers.PrimaryKeyRelatedField(
        many=True,
        pk_field=serializers.CharField(),
        queryset=ProjectDependency.objects.all(),
    )
    github_users = ShortGitHubUserSerializer(many=True, allow_empty=True, required=True)

    class Meta:
        model = Project
        fields = (
            "name",
            "description",
            "organization",
            "repo_name",
            "github_users",
            "dependencies",
        )

    def validate_github_users(self, github_users):
        """Ensure the current user is always added as collaborator"""
        user = self.context["request"].user
        logins = [u["login"] for u in github_users]
        if user.username not in logins:
            github_users.append({"login": user.username, "id": user.github_id})
        return github_users

    def save(self, *args, **kwargs) -> Project:
        # `organization` is not an actual field on Project so we convert it to `repo_owner`
        organization = self.validated_data.pop("organization", None)
        if organization is not None:
            kwargs.setdefault("repo_owner", organization.login)

        # Dependencies are used by the view, not stored in the model
        self.validated_data.pop("dependencies", None)

        # Pop `github_users` to save it `GitHubCollaboration`s later
        user_stubs = self.validated_data.pop("github_users")

        project = super().save(*args, **kwargs)

        for stub in user_stubs:
            user, _ = GitHubUser.objects.get_or_create(id=stub["id"], defaults=stub)
            GitHubCollaboration.objects.create(
                project=project, user=user, permissions={"push": True, "pull": True}
            )

        return project


class ProjectSerializer(HashIdModelSerializer):
    slug = serializers.CharField()
    old_slugs = StringListField(read_only=True)
    description_rendered = MarkdownField(source="description", read_only=True)
    repo_url = serializers.URLField(read_only=True)
    repo_id = serializers.IntegerField(read_only=True)
    repo_image_url = serializers.SerializerMethodField()
    has_push_permission = serializers.SerializerMethodField()
    github_users = serializers.SerializerMethodField()
    org_config_names = OrgConfigNameSerializer(many=True, read_only=True)
    github_issue_count = serializers.IntegerField(source="issues.count", read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "repo_id",
            "repo_url",
            "repo_owner",
            "repo_name",
            "has_truncated_issues",
            "has_push_permission",
            "description",
            "description_rendered",
            "is_managed",
            "slug",
            "old_slugs",
            "branch_prefix",
            "github_users",
            "github_issue_count",
            "repo_image_url",
            "org_config_names",
            "currently_fetching_org_config_names",
            "currently_fetching_github_users",
            "latest_sha",
            "currently_fetching_issues",
        )
        extra_kwargs = {
            "has_truncated_issues": {"read_only": True},
            "currently_fetching_org_config_names": {"read_only": True},
            "currently_fetching_github_users": {"read_only": True},
            "latest_sha": {"read_only": True},
            "currently_fetching_issues": {"read_only": True},
        }

    @extend_schema_field(OpenApiTypes.URI)
    def get_repo_image_url(self, obj) -> Optional[str]:
        return obj.repo_image_url if obj.include_repo_image_url else ""

    def get_has_push_permission(self, obj) -> bool:
        return obj.has_push_permission(self.context["request"].user)

    @extend_schema_field(GitHubCollaboratorSerializer(many=True))
    def get_github_users(self, obj):
        collaborations = obj.githubcollaboration_set.select_related("user")
        return GitHubCollaboratorSerializer(collaborations, many=True).data


class EpicMinimalSerializer(HashIdModelSerializer):
    name = serializers.CharField()
    slug = serializers.CharField(read_only=True)
    github_users = serializers.PrimaryKeyRelatedField(read_only=True, many=True)

    class Meta:
        model = Epic
        read_only_fields = fields = ("id", "name", "slug", "github_users")


class EpicSerializer(EpicMinimalSerializer):
    old_slugs = StringListField(read_only=True)
    description_rendered = MarkdownField(source="description", read_only=True)
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), pk_field=serializers.CharField()
    )
    task_count = serializers.SerializerMethodField()
    branch_url = serializers.SerializerMethodField()
    branch_diff_url = serializers.SerializerMethodField()
    pr_url = serializers.SerializerMethodField()
    issue = serializers.PrimaryKeyRelatedField(
        queryset=GitHubIssue.objects.all(),
        pk_field=serializers.CharField(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Epic
        fields = (
            "id",
            "name",
            "description",
            "description_rendered",
            "slug",
            "old_slugs",
            "created_at",
            "project",
            "task_count",
            "branch_url",
            "branch_diff_url",
            "branch_name",
            "has_unmerged_commits",
            "currently_creating_branch",
            "currently_creating_pr",
            "pr_url",
            "pr_is_open",
            "pr_is_merged",
            "status",
            "github_users",
            "latest_sha",
            "issue",
        )
        extra_kwargs = {
            "task_count": {"read_only": True},
            "branch_url": {"read_only": True},
            "branch_diff_url": {"read_only": True},
            "has_unmerged_commits": {"read_only": True},
            "currently_creating_branch": {"read_only": True},
            "currently_creating_pr": {"read_only": True},
            "pr_url": {"read_only": True},
            "pr_is_open": {"read_only": True},
            "pr_is_merged": {"read_only": True},
            "status": {"read_only": True},
            "latest_sha": {"read_only": True},
            "created_at": {"read_only": True},
        }
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Epic.objects.all(),
                fields=("name", "project"),
                message=FormattableDict(
                    "name", _("An Epic with this name already exists.")
                ),
            ),
            UnattachedIssueValidator(),
        )

    def create(self, validated_data):
        user = self.context["request"].user
        if not validated_data.get("branch_name"):
            # This temporarily prevents users from taking other actions
            # (e.g. creating scratch orgs) that also might trigger branch creation
            # and could result in race conditions and duplicate branches on GitHub.
            validated_data["currently_creating_branch"] = True
        instance = super().create(validated_data)
        instance.notify_created(originating_user_id=str(user.id))
        instance.create_gh_branch(self.context["request"].user)
        instance.project.queue_available_org_config_names(
            user=self.context["request"].user
        )
        return instance

    def validate_project(self, project: Project | None):
        if project and not project.has_push_permission(self.context["request"].user):
            raise serializers.ValidationError(
                _("You don't have Push permissions for this project")
            )
        return project

    def validate(self, data):
        branch_name = data.get("branch_name", "")
        project = data.get("project", None)
        branch_name_differs = branch_name != getattr(self.instance, "branch_name", "")
        branch_name_changed = branch_name and branch_name_differs
        if branch_name_changed:
            if "__" in branch_name:
                raise serializers.ValidationError(
                    {
                        "branch_name": _(
                            'Only feature branch names (without "__") are allowed.'
                        )
                    }
                )

            branch_name_is_project_default_branch = (
                project and branch_name == project.branch_name
            )
            if branch_name_is_project_default_branch:
                raise serializers.ValidationError(
                    {
                        "branch_name": _(
                            "Cannot create an epic from the project default branch."
                        )
                    }
                )

            already_used_branch_name = (
                Epic.objects.active()
                .exclude(pk=getattr(self.instance, "pk", None))
                .filter(branch_name=branch_name)
                .exists()
            )
            if already_used_branch_name:
                raise serializers.ValidationError(
                    {"branch_name": _("This branch name is already in use.")}
                )

        return data

    def get_task_count(self, obj) -> int:
        return obj.tasks.active().count()

    @extend_schema_field(OpenApiTypes.URI)
    def get_branch_diff_url(self, obj) -> Optional[str]:
        project = obj.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        project_branch = project.branch_name
        branch = obj.branch_name
        if repo_owner and repo_name and project_branch and branch:
            return (
                f"https://github.com/{repo_owner}/{repo_name}/compare/"
                f"{project_branch}...{branch}"
            )
        return None

    @extend_schema_field(OpenApiTypes.URI)
    def get_branch_url(self, obj) -> Optional[str]:
        project = obj.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None

    @extend_schema_field(OpenApiTypes.URI)
    def get_pr_url(self, obj) -> Optional[str]:
        project = obj.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        pr_number = obj.pr_number
        if repo_owner and repo_name and pr_number:
            return f"https://github.com/{repo_owner}/{repo_name}/pull/{pr_number}"
        return None


class EpicCollaboratorsSerializer(serializers.ModelSerializer):
    github_users = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=True
    )

    class Meta:
        model = Epic
        fields = ("github_users",)

    def validate_github_users(self, github_users):
        user = self.context["request"].user
        epic: Epic = self.instance
        project_collaborators = set(
            epic.project.github_users.values_list("id", flat=True)
        )
        epic_collaborators = set(epic.github_users.values_list("id", flat=True))
        new_collaborators = set(github_users)

        if not epic.has_push_permission(user):
            added = new_collaborators.difference(epic_collaborators)
            removed = epic_collaborators.difference(new_collaborators)
            if added and any(u != user.github_id for u in added):
                raise serializers.ValidationError(
                    _("You can only add yourself as a Collaborator")
                )
            if removed and any(u != user.github_id for u in removed):
                raise serializers.ValidationError(
                    _("You can only remove yourself as a Collaborator")
                )

        not_in_project = [
            uid for uid in new_collaborators if uid not in project_collaborators
        ]
        if not_in_project:
            raise serializers.ValidationError(
                _("One or more users do not belong to %(project)s: %(users)s").format(
                    epic.project, not_in_project
                )
            )

        return list(new_collaborators)


class TaskSerializer(HashIdModelSerializer):
    slug = serializers.CharField(read_only=True)
    old_slugs = StringListField(read_only=True)
    description_rendered = MarkdownField(source="description", read_only=True)
    epic = NestedPrimaryKeyRelatedField(
        queryset=Epic.objects.all(),
        pk_field=serializers.CharField(),
        serializer=EpicMinimalSerializer,
        required=False,
        allow_null=True,
    )
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        pk_field=serializers.CharField(),
        required=False,
        allow_null=True,
    )
    root_project = serializers.SerializerMethodField()
    root_project_slug = serializers.CharField(
        source="root_project.slug", read_only=True
    )
    assigned_dev = NestedPrimaryKeyRelatedField(
        ShortGitHubUserSerializer,
        queryset=GitHubUser.objects,
        required=False,
        allow_null=True,
    )
    assigned_qa = ShortGitHubUserSerializer(read_only=True)
    branch_url = serializers.SerializerMethodField()
    branch_diff_url = serializers.SerializerMethodField()
    pr_url = serializers.SerializerMethodField()
    issue = serializers.PrimaryKeyRelatedField(
        queryset=GitHubIssue.objects.all(),
        pk_field=serializers.CharField(),
        required=False,
        allow_null=True,
    )

    dev_org = serializers.PrimaryKeyRelatedField(
        queryset=ScratchOrg.objects.active(),
        pk_field=serializers.CharField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "name",
            "description",
            "description_rendered",
            "epic",
            "project",
            "slug",
            "old_slugs",
            "created_at",
            "has_unmerged_commits",
            "currently_creating_branch",
            "currently_creating_pr",
            "branch_name",
            "root_project",
            "root_project_slug",
            "branch_url",
            "commits",
            "origin_sha",
            "branch_diff_url",
            "pr_url",
            "issue",
            "review_submitted_at",
            "review_valid",
            "review_status",
            "review_sha",
            "status",
            "pr_is_open",
            "assigned_dev",
            "assigned_qa",
            "dev_org",
            "currently_submitting_review",
            "org_config_name",
        )
        extra_kwargs = {
            "has_unmerged_commits": {"read_only": True},
            "currently_creating_branch": {"read_only": True},
            "currently_creating_pr": {"read_only": True},
            "root_project": {"read_only": True},
            "root_project_slug": {"read_only": True},
            "branch_url": {"read_only": True},
            "commits": {"read_only": True},
            "origin_sha": {"read_only": True},
            "branch_diff_url": {"read_only": True},
            "pr_url": {"read_only": True},
            "review_submitted_at": {"read_only": True},
            "review_valid": {"read_only": True},
            "review_status": {"read_only": True},
            "review_sha": {"read_only": True},
            "status": {"read_only": True},
            "pr_is_open": {"read_only": True},
            "currently_submitting_review": {"read_only": True},
            "created_at": {"read_only": True},
        }
        validators = (UnattachedIssueValidator(),)

    def get_root_project(self, obj) -> str:
        return str(obj.root_project.pk)

    @extend_schema_field(OpenApiTypes.URI)
    def get_branch_url(self, obj) -> Optional[str]:
        project = obj.root_project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None

    @extend_schema_field(OpenApiTypes.URI)
    def get_branch_diff_url(self, obj) -> Optional[str]:
        base_branch = obj.get_base()
        project = obj.root_project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and base_branch and branch:
            return (
                f"https://github.com/{repo_owner}/{repo_name}/compare/"
                f"{base_branch}...{branch}"
            )
        return None

    @extend_schema_field(OpenApiTypes.URI)
    def get_pr_url(self, obj) -> Optional[str]:
        project = obj.root_project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        pr_number = obj.pr_number
        if repo_owner and repo_name and pr_number:
            return f"https://github.com/{repo_owner}/{repo_name}/pull/{pr_number}"
        return None

    def validate_epic(self, epic: Epic | None):
        if epic and not epic.has_push_permission(self.context["request"].user):
            raise serializers.ValidationError(
                _("You don't have Push permissions for this epic")
            )
        return epic

    def validate_project(self, project: Project | None):
        if project and not project.has_push_permission(self.context["request"].user):
            raise serializers.ValidationError(
                _("You don't have Push permissions for this project")
            )
        return project

    def validate(self, data: dict) -> dict:
        project = data.get("project", getattr(self.instance, "project", None))
        epic = data.get("epic", getattr(self.instance, "epic", None))
        if project and epic:
            raise serializers.ValidationError(
                _("Task can be attached to a Project or Epic, but not both")
            )
        if not (project or epic):
            raise serializers.ValidationError(
                _("Task must be attached to a Project or Epic")
            )
        return data

    def create(self, validated_data):
        dev_org = validated_data.pop("dev_org", None)
        user = self.context["request"].user

        if dev_org and not validated_data.get("assigned_dev"):
            validated_data["assigned_dev"] = GitHubUser.objects.get(id=user.github_id)

        task = super().create(validated_data)
        task.notify_created(originating_user_id=str(user.id))

        if dev_org:
            dev_org.queue_convert_to_dev_org(task, originating_user_id=str(user.id))

        return task

    def update(self, instance, validated_data):
        validated_data.pop("dev_org", None)
        return super().update(instance, validated_data)


class TaskAssigneeSerializer(serializers.Serializer):
    assigned_dev = serializers.PrimaryKeyRelatedField(
        queryset=GitHubUser.objects, allow_null=True, required=False
    )
    assigned_qa = serializers.PrimaryKeyRelatedField(
        queryset=GitHubUser.objects, allow_null=True, required=False
    )
    should_alert_dev = serializers.BooleanField(required=False)
    should_alert_qa = serializers.BooleanField(required=False)

    def validate(self, data):
        if "assigned_qa" not in data and "assigned_dev" not in data:
            raise serializers.ValidationError(
                _("You must assign a Developer, Tester, or both")
            )

        return super().validate(data)

    def validate_assigned_dev(self, new_dev: Optional[GitHubUser]):
        assert self.instance
        user: UserModel = self.context["request"].user
        task: Task = self.instance

        response = can_assign_task_role(task, user, new_dev, ScratchOrgType.DEV)
        if not response.can_reassign:
            raise serializers.ValidationError(response.issues)

        return new_dev

    def validate_assigned_qa(self, new_qa: Optional[GitHubUser]):
        assert self.instance
        user: UserModel = self.context["request"].user
        task: Task = self.instance

        response = can_assign_task_role(task, user, new_qa, ScratchOrgType.QA)
        if not response.can_reassign:
            raise serializers.ValidationError(response.issues)

        return new_qa

    def update(self, task, data):
        user = self.context["request"].user
        user_id = str(user.id)

        # The user may be changing the dev, the QA, or both.
        # The user's permission to do both is checked in `validate_*()`,
        # so we can safely start both operations here.

        if "assigned_dev" in data:
            self._handle_reassign("dev", task, data, user, originating_user_id=user_id)
            task.assigned_dev = data["assigned_dev"]
        if "assigned_qa" in data:
            self._handle_reassign("qa", task, data, user, originating_user_id=user_id)
            task.assigned_qa = data["assigned_qa"]

        task.finalize_task_update(originating_user_id=user_id)
        return task

    def _handle_reassign(
        self,
        type_: Literal["dev"] | Literal["qa"],
        instance: Task,
        validated_data: dict,
        running_user: UserModel,
        originating_user_id: str,
    ):
        epic = instance.epic
        new_assignee: Optional[GitHubUser] = validated_data.get(f"assigned_{type_}")
        existing_assignee: Optional[GitHubUser] = getattr(instance, f"assigned_{type_}")
        assigned_user_has_changed = new_assignee != existing_assignee
        has_assigned_user = bool(new_assignee)
        org_type = {"dev": ScratchOrgType.DEV, "qa": ScratchOrgType.QA}[type_]

        if assigned_user_has_changed and has_assigned_user:
            # Add this user as an epic collaborator.
            if epic and not epic.github_users.filter(id=new_assignee.id).exists():
                epic.github_users.add(new_assignee)
                epic.notify_changed(originating_user_id=None)

            # Notify the target user.
            if validated_data.get(f"should_alert_{type_}"):
                self.try_send_assignment_emails(
                    org_type, instance, running_user, new_assignee
                )

            # Locate the attached scratch org and reassign it.
            candidate_org = instance.orgs.active().filter(org_type=org_type).first()
            if candidate_org:
                new_user = new_assignee.get_matching_user()
                org_still_exists = is_org_good(candidate_org)

                if org_still_exists:
                    candidate_org.queue_reassign(
                        new_user=new_user, originating_user_id=originating_user_id
                    )
        elif not has_assigned_user:
            # We are removing a user assignment, but not creating a new one.
            # Delete all extant orgs.
            for org in [*instance.orgs.active().filter(org_type=org_type)]:
                org.delete(
                    originating_user_id=originating_user_id, preserve_sf_org=True
                )

        # Otherwise, we do nothing - this is an assignment to a new user
        # but the task does not have an attached scratch org.

    def try_send_assignment_emails(
        self,
        org_type: ScratchOrgType,
        instance: Task,
        running_user: UserModel,
        user: GitHubUser,
    ):
        assigned_user = user.get_matching_user()
        if assigned_user:
            task = instance
            metecho_link = get_user_facing_url(path=task.get_absolute_url())
            subject = _("Metecho Task Assigned to You")
            body = render_to_string(
                "user_assigned_to_task.txt",
                {
                    "role": "Tester" if org_type is ScratchOrgType.QA else "Developer",
                    "task_name": task.full_name,
                    "assigned_user_name": assigned_user.username,
                    "user_name": running_user.username,
                    "metecho_link": metecho_link,
                },
            )
            assigned_user.notify(subject, body)


class CreatePrSerializer(serializers.Serializer):
    title = serializers.CharField()
    critical_changes = serializers.CharField(allow_blank=True)
    additional_changes = serializers.CharField(allow_blank=True)
    issues = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)
    alert_assigned_qa = serializers.BooleanField()


class ReviewSerializer(serializers.Serializer):
    notes = serializers.CharField(allow_blank=True)
    status = serializers.ChoiceField(choices=TaskReviewStatus.choices)
    delete_org = serializers.BooleanField()
    org = serializers.PrimaryKeyRelatedField(
        queryset=ScratchOrg.objects.all(),
        pk_field=serializers.CharField(),
        allow_null=True,
    )


class ScratchOrgSerializer(HashIdModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        pk_field=serializers.CharField(),
        allow_null=True,
        required=False,
    )
    epic = serializers.PrimaryKeyRelatedField(
        queryset=Epic.objects.all(),
        pk_field=serializers.CharField(),
        allow_null=True,
        required=False,
    )
    task = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(),
        pk_field=serializers.CharField(),
        allow_null=True,
        required=False,
    )
    owner = serializers.PrimaryKeyRelatedField(
        pk_field=serializers.CharField(),
        default=serializers.CurrentUserDefault(),
        read_only=True,
    )
    description_rendered = MarkdownField(source="description", read_only=True)
    unsaved_changes = serializers.SerializerMethodField()
    has_unsaved_changes = serializers.SerializerMethodField()
    non_source_changes = serializers.SerializerMethodField()
    has_non_source_changes = serializers.SerializerMethodField()
    total_unsaved_changes = serializers.SerializerMethodField()
    ignored_changes = serializers.SerializerMethodField()
    has_ignored_changes = serializers.SerializerMethodField()
    total_ignored_changes = serializers.SerializerMethodField()
    ignored_changes_write = JSONField(
        write_only=True, source="ignored_changes", required=False
    )
    valid_target_directories = serializers.SerializerMethodField()

    class Meta:
        model = ScratchOrg
        fields = (
            "id",
            "project",
            "epic",
            "task",
            "org_type",
            "owner",
            "description",
            "description_rendered",
            "last_modified_at",
            "expires_at",
            "latest_commit",
            "latest_commit_url",
            "latest_commit_at",
            "last_checked_unsaved_changes_at",
            "url",
            "unsaved_changes",
            "total_unsaved_changes",
            "has_unsaved_changes",
            "ignored_changes",
            "ignored_changes_write",
            "total_ignored_changes",
            "has_ignored_changes",
            "currently_refreshing_changes",
            "currently_retrieving_metadata",
            "currently_refreshing_org",
            "currently_reassigning_user",
            "is_created",
            "delete_queued_at",
            "owner_gh_username",
            "owner_gh_id",
            "has_been_visited",
            "valid_target_directories",
            "org_config_name",
            "currently_parsing_datasets",
            "currently_retrieving_dataset",
            "currently_retrieving_omnistudio",
            "installed_packages",
            "is_omnistudio_installed",
            "non_source_changes",
            "has_non_source_changes",
        )
        extra_kwargs = {
            "last_modified_at": {"read_only": True},
            "expires_at": {"read_only": True},
            "latest_commit": {"read_only": True},
            "latest_commit_url": {"read_only": True},
            "latest_commit_at": {"read_only": True},
            "last_checked_unsaved_changes_at": {"read_only": True},
            "url": {"read_only": True},
            "currently_refreshing_changes": {"read_only": True},
            "currently_retrieving_metadata": {"read_only": True},
            "currently_refreshing_org": {"read_only": True},
            "currently_reassigning_user": {"read_only": True},
            "is_created": {"read_only": True},
            "delete_queued_at": {"read_only": True},
            "owner_gh_username": {"read_only": True},
            "owner_gh_id": {"read_only": True},
            "has_been_visited": {"read_only": True},
            "currently_parsing_datasets": {"read_only": True},
            "currently_retrieving_dataset": {"read_only": True},
            "currently_retrieving_omnistudio": {"read_only": True},
            "installed_packages": {"read_only": True},
            "is_omnistudio_installed": {"read_only": True},
        }

    def _X_changes(self, obj, kind):
        user = getattr(self.context.get("request"), "user", None)
        if obj.owner == user:
            return getattr(obj, f"{kind}_changes")
        return {}

    def _has_X_changes(self, obj, kind) -> bool:
        return bool(getattr(obj, f"{kind}_changes", {}))

    def _total_X_changes(self, obj, kind) -> int:
        return sum(len(change) for change in getattr(obj, f"{kind}_changes").values())

    def get_unsaved_changes(self, obj) -> dict:
        return self._X_changes(obj, "unsaved")

    def get_non_source_changes(self, obj) -> dict:
        return self._X_changes(obj, "non_source")

    def get_has_unsaved_changes(self, obj) -> bool:
        return self._has_X_changes(obj, "unsaved")

    def get_has_non_source_changes(self, obj) -> bool:
        return self._has_X_changes(obj, "non_source")

    def get_total_unsaved_changes(self, obj) -> int:
        return self._total_X_changes(obj, "unsaved")

    def get_ignored_changes(self, obj) -> dict:
        return self._X_changes(obj, "ignored")

    def get_has_ignored_changes(self, obj) -> bool:
        return self._has_X_changes(obj, "ignored")

    def get_total_ignored_changes(self, obj) -> int:
        return self._total_X_changes(obj, "ignored")

    def get_valid_target_directories(self, obj) -> dict:
        user = getattr(self.context.get("request"), "user", None)
        if obj.owner == user:
            return obj.valid_target_directories
        return {}

    def validate(self, data):
        if not self.instance:
            orgs = ScratchOrg.objects.active().filter(org_type=data["org_type"])
            if data["org_type"] == ScratchOrgType.PLAYGROUND:
                orgs = orgs.filter(
                    owner=data.get("owner", self.context["request"].user)
                )
            if data.get("task") and orgs.filter(task=data["task"]).exists():
                raise serializers.ValidationError(
                    _("A Scratch Org of this type already exists for this Task.")
                )
            if data.get("epic") and orgs.filter(epic=data["epic"]).exists():
                raise serializers.ValidationError(
                    _("A Scratch Org of this type already exists for this Epic.")
                )
            if data.get("project") and orgs.filter(project=data["project"]).exists():
                raise serializers.ValidationError(
                    _("A Scratch Org of this type already exists for this Project.")
                )
        return data

    def save(self, **kwargs):
        kwargs["owner"] = kwargs.get("owner", self.context["request"].user)
        return super().save(**kwargs)


class CommitSerializer(serializers.Serializer):
    commit_message = serializers.CharField()
    # Expect this to be Dict<str, List<str>>
    changes = serializers.DictField(child=StringListField())
    target_directory = serializers.CharField()


class ListMetadataSerializer(serializers.Serializer):
    desiredType = serializers.CharField()


class CommitDatasetSerializer(serializers.Serializer):
    commit_message = serializers.CharField()
    dataset_name = serializers.CharField()
    dataset_definition = serializers.DictField(child=StringListField())


class CommitOmniStudioSerializer(serializers.Serializer):
    commit_message = serializers.CharField()
    yaml_path = serializers.CharField()


class SiteSerializer(serializers.ModelSerializer):
    clickthrough_agreement = MarkdownField(read_only=True)

    class Meta:
        model = SiteProfile
        fields = (
            "name",
            "clickthrough_agreement",
        )


class CanReassignSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=("assigned_qa", "assigned_dev"))
    gh_uid = serializers.PrimaryKeyRelatedField(
        queryset=GitHubUser.objects, allow_null=True, required=True
    )
