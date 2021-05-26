from typing import Optional

from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.fields import JSONField

from .email_utils import get_user_facing_url
from .fields import MarkdownField
from .models import (
    SCRATCH_ORG_TYPES,
    TASK_REVIEW_STATUS,
    Epic,
    Project,
    ScratchOrg,
    SiteProfile,
    Task,
)
from .sf_run_flow import is_org_good
from .validators import CaseInsensitiveUniqueTogetherValidator

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
    sf_username = serializers.SerializerMethodField()

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
            "devhub_username",
            "uses_global_devhub",
            "agreed_to_tos_at",
            "onboarded_at",
            "self_guided_tour_enabled",
            "self_guided_tour_state",
        )

    def get_sf_username(self, obj) -> dict:
        if obj.uses_global_devhub:
            return None
        return obj.sf_username


class MinimalUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "avatar_url")


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description_rendered = MarkdownField(source="description", read_only=True)
    repo_url = serializers.SerializerMethodField()
    repo_image_url = serializers.SerializerMethodField()
    has_push_permission = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "repo_url",
            "repo_owner",
            "repo_name",
            "has_push_permission",
            "description",
            "description_rendered",
            "is_managed",
            "slug",
            "old_slugs",
            "branch_prefix",
            "github_users",
            "repo_image_url",
            "org_config_names",
            "currently_fetching_org_config_names",
            "latest_sha",
        )
        extra_kwargs = {
            "org_config_names": {"read_only": True},
            "currently_fetching_org_config_names": {"read_only": True},
            "latest_sha": {"read_only": True},
        }

    def get_repo_url(self, obj) -> Optional[str]:
        return f"https://github.com/{obj.repo_owner}/{obj.repo_name}"

    def get_repo_image_url(self, obj) -> Optional[str]:
        return obj.repo_image_url if obj.include_repo_image_url else ""

    def get_has_push_permission(self, obj) -> bool:
        return obj.has_push_permission(self.context["request"].user)


class EpicSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description_rendered = MarkdownField(source="description", read_only=True)
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), pk_field=serializers.CharField()
    )
    branch_url = serializers.SerializerMethodField()
    branch_diff_url = serializers.SerializerMethodField()
    pr_url = serializers.SerializerMethodField()

    class Meta:
        model = Epic
        fields = (
            "id",
            "name",
            "description",
            "description_rendered",
            "slug",
            "old_slugs",
            "project",
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
        )
        extra_kwargs = {
            "slug": {"read_only": True},
            "old_slugs": {"read_only": True},
            "branch_url": {"read_only": True},
            "branch_diff_url": {"read_only": True},
            "has_unmerged_commits": {"read_only": True},
            "currently_creating_branch": {"read_only": True},
            "currently_creating_pr": {"read_only": True},
            "pr_url": {"read_only": True},
            "pr_is_open": {"read_only": True},
            "pr_is_merged": {"read_only": True},
            "status": {"read_only": True},
            "github_users": {"read_only": True},
            "latest_sha": {"read_only": True},
        }
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Epic.objects.all(),
                fields=("name", "project"),
                message=FormattableDict(
                    "name", _("An epic with this name already exists.")
                ),
            ),
        )

    def create(self, validated_data):
        if not validated_data.get("branch_name"):
            # This temporarily prevents users from taking other actions
            # (e.g. creating scratch orgs) that also might trigger branch creation
            # and could result in race conditions and duplicate branches on GitHub.
            validated_data["currently_creating_branch"] = True
        instance = super().create(validated_data)
        instance.create_gh_branch(self.context["request"].user)
        instance.project.queue_available_org_config_names(
            user=self.context["request"].user
        )
        return instance

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

    def get_branch_url(self, obj) -> Optional[str]:
        project = obj.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None

    def get_pr_url(self, obj) -> Optional[str]:
        project = obj.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        pr_number = obj.pr_number
        if repo_owner and repo_name and pr_number:
            return f"https://github.com/{repo_owner}/{repo_name}/pull/{pr_number}"
        return None


class EpicCollaboratorsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Epic
        fields = ("github_users",)

    def validate_github_users(self, github_users):
        user = self.context["request"].user
        epic: Epic = self.instance

        if not epic.has_push_permission(user):
            collaborators = set(epic.github_users)
            new_collaborators = set(github_users)
            added = new_collaborators.difference(collaborators)
            removed = collaborators.difference(new_collaborators)
            if added and any(u != user.github_id for u in added):
                raise serializers.ValidationError(
                    _("You can only add yourself as a collaborator")
                )
            if removed and any(u != user.github_id for u in removed):
                raise serializers.ValidationError(
                    _("You can only remove yourself as a collaborator")
                )

        seen_github_users = []
        for gh_uid in github_users:
            if not self.instance.project.get_collaborator(gh_uid):
                raise serializers.ValidationError(
                    _(f"User is not a valid GitHub collaborator: {gh_uid}")
                )

            if gh_uid in seen_github_users:
                raise serializers.ValidationError(_(f"Duplicate GitHub user: {gh_uid}"))
            else:
                seen_github_users.append(gh_uid)

        return github_users


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description_rendered = MarkdownField(source="description", read_only=True)
    epic = serializers.PrimaryKeyRelatedField(
        queryset=Epic.objects.all(), pk_field=serializers.CharField()
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
            "description_rendered",
            "epic",
            "slug",
            "old_slugs",
            "has_unmerged_commits",
            "currently_creating_branch",
            "currently_creating_pr",
            "branch_name",
            "branch_url",
            "commits",
            "origin_sha",
            "branch_diff_url",
            "pr_url",
            "review_submitted_at",
            "review_valid",
            "review_status",
            "review_sha",
            "status",
            "pr_is_open",
            "assigned_dev",
            "assigned_qa",
            "currently_submitting_review",
            "org_config_name",
        )
        extra_kwargs = {
            "slug": {"read_only": True},
            "old_slugs": {"read_only": True},
            "has_unmerged_commits": {"read_only": True},
            "currently_creating_branch": {"read_only": True},
            "currently_creating_pr": {"read_only": True},
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
            "assigned_dev": {"read_only": True},
            "assigned_qa": {"read_only": True},
            "currently_submitting_review": {"read_only": True},
        }
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Task.objects.all(),
                fields=("name", "epic"),
                message=FormattableDict(
                    "name", _("A task with this name already exists.")
                ),
            ),
        )

    def get_branch_url(self, obj) -> Optional[str]:
        project = obj.epic.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None

    def get_branch_diff_url(self, obj) -> Optional[str]:
        epic = obj.epic
        epic_branch = epic.branch_name
        project = epic.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and epic_branch and branch:
            return (
                f"https://github.com/{repo_owner}/{repo_name}/compare/"
                f"{epic_branch}...{branch}"
            )
        return None

    def get_pr_url(self, obj) -> Optional[str]:
        project = obj.epic.project
        repo_owner = project.repo_owner
        repo_name = project.repo_name
        pr_number = obj.pr_number
        if repo_owner and repo_name and pr_number:
            return f"https://github.com/{repo_owner}/{repo_name}/pull/{pr_number}"
        return None


class TaskAssigneeSerializer(serializers.Serializer):
    assigned_dev = serializers.CharField(allow_null=True, required=False)
    assigned_qa = serializers.CharField(allow_null=True, required=False)
    should_alert_dev = serializers.BooleanField(required=False)
    should_alert_qa = serializers.BooleanField(required=False)

    def validate(self, data):
        if "assigned_qa" not in data and "assigned_dev" not in data:
            raise serializers.ValidationError(
                _("You must assign a developer, tester, or both")
            )
        return super().validate(data)

    def validate_assigned_dev(self, new_dev):
        user = self.context["request"].user
        task: Task = self.instance
        if not task.has_push_permission(user):
            raise serializers.ValidationError(
                _("You don't have permissions to change the assigned developer")
            )
        collaborator = task.epic.project.get_collaborator(new_dev)
        if new_dev and not collaborator:
            raise serializers.ValidationError(
                _(f"User is not a valid GitHub collaborator: {new_dev}")
            )
        if new_dev and not collaborator.get("permissions", {}).get("push"):
            raise serializers.ValidationError(
                _(f"User does not have push permissions: {new_dev}")
            )
        return new_dev

    def validate_assigned_qa(self, new_qa):
        user = self.context["request"].user
        task: Task = self.instance
        if not task.has_push_permission(user):
            is_removing_self = new_qa is None and task.assigned_qa == user.github_id
            is_assigning_self = new_qa == user.github_id and task.assigned_qa is None
            if not (is_removing_self or is_assigning_self):
                raise serializers.ValidationError(
                    _("You can only assign/remove yourself as a tester")
                )
        if new_qa and not task.epic.project.get_collaborator(new_qa):
            raise serializers.ValidationError(
                _(f"User is not valid GitHub collaborator: {new_qa}")
            )
        return new_qa

    def update(self, task, data):
        user = self.context["request"].user
        user_id = str(user.id)
        if "assigned_dev" in data:
            self._handle_reassign("dev", task, data, user, originating_user_id=user_id)
            task.assigned_dev = data["assigned_dev"]
        if "assigned_qa" in data:
            self._handle_reassign("qa", task, data, user, originating_user_id=user_id)
            task.assigned_qa = data["assigned_qa"]
        task.save()
        return task

    def _handle_reassign(
        self, type_, instance, validated_data, user, originating_user_id
    ):
        new_assignee = validated_data.get(f"assigned_{type_}")
        existing_assignee = getattr(instance, f"assigned_{type_}")
        assigned_user_has_changed = new_assignee != existing_assignee
        has_assigned_user = bool(new_assignee)
        org_type = {"dev": SCRATCH_ORG_TYPES.Dev, "qa": SCRATCH_ORG_TYPES.QA}[type_]

        if assigned_user_has_changed and has_assigned_user:
            collaborators = instance.epic.github_users
            if new_assignee not in collaborators:
                instance.epic.github_users.append(new_assignee)
                instance.epic.save()
                instance.epic.notify_changed(originating_user_id=None)

            if validated_data.get(f"should_alert_{type_}"):
                self.try_send_assignment_emails(instance, type_, validated_data, user)

            reassigned_org = False
            # We want to consider soft-deleted orgs, too:
            orgs = [
                *instance.orgs.active().filter(org_type=org_type),
                *instance.orgs.inactive().filter(org_type=org_type),
            ]
            for org in orgs:
                new_user = self._valid_reassign(
                    type_, org, validated_data[f"assigned_{type_}"]
                )
                valid_commit = org.latest_commit == (
                    instance.commits[0] if instance.commits else instance.origin_sha
                )
                org_still_exists = is_org_good(org)
                if (
                    org_still_exists
                    and new_user
                    and valid_commit
                    and not reassigned_org
                ):
                    org.queue_reassign(
                        new_user=new_user, originating_user_id=originating_user_id
                    )
                    reassigned_org = True
                elif org.deleted_at is None:
                    org.delete(
                        originating_user_id=originating_user_id, preserve_sf_org=True
                    )
        elif not has_assigned_user:
            for org in [*instance.orgs.active().filter(org_type=org_type)]:
                org.delete(
                    originating_user_id=originating_user_id, preserve_sf_org=True
                )

    def _valid_reassign(self, type_, org, new_assignee):
        new_user = self.get_matching_assigned_user(
            type_, {f"assigned_{type_}": new_assignee}
        )
        if new_user and org.owner_sf_username == new_user.sf_username:
            return new_user
        return None

    def try_send_assignment_emails(self, instance, type_, validated_data, user):
        assigned_user = self.get_matching_assigned_user(type_, validated_data)
        if assigned_user:
            task = instance
            epic = task.epic
            project = epic.project
            metecho_link = get_user_facing_url(
                path=["projects", project.slug, epic.slug, task.slug]
            )
            subject = _("Metecho Task Assigned to You")
            body = render_to_string(
                "user_assigned_to_task.txt",
                {
                    "role": "Tester" if type_ == "qa" else "Developer",
                    "task_name": task.name,
                    "epic_name": epic.name,
                    "project_name": project.name,
                    "assigned_user_name": assigned_user.username,
                    "user_name": user.username if user else None,
                    "metecho_link": metecho_link,
                },
            )
            assigned_user.notify(subject, body)

    def get_matching_assigned_user(self, type_, validated_data):
        id_ = validated_data.get(f"assigned_{type_}")
        sa = SocialAccount.objects.filter(provider="github", uid=id_).first()
        return getattr(sa, "user", None)  # Optional[User]


class CreatePrSerializer(serializers.Serializer):
    title = serializers.CharField()
    critical_changes = serializers.CharField(allow_blank=True)
    additional_changes = serializers.CharField(allow_blank=True)
    issues = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)
    alert_assigned_qa = serializers.BooleanField()


class ReviewSerializer(serializers.Serializer):
    notes = serializers.CharField(allow_blank=True)
    status = serializers.ChoiceField(choices=TASK_REVIEW_STATUS)
    delete_org = serializers.BooleanField()
    org = serializers.PrimaryKeyRelatedField(
        queryset=ScratchOrg.objects.all(),
        pk_field=serializers.CharField(),
        allow_null=True,
    )


class ScratchOrgSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
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
            "currently_capturing_changes",
            "currently_refreshing_org",
            "currently_reassigning_user",
            "is_created",
            "delete_queued_at",
            "owner_gh_username",
            "owner_gh_id",
            "has_been_visited",
            "valid_target_directories",
            "org_config_name",
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
            "currently_capturing_changes": {"read_only": True},
            "currently_refreshing_org": {"read_only": True},
            "currently_reassigning_user": {"read_only": True},
            "is_created": {"read_only": True},
            "delete_queued_at": {"read_only": True},
            "owner_gh_username": {"read_only": True},
            "owner_gh_id": {"read_only": True},
            "has_been_visited": {"read_only": True},
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

    def get_has_unsaved_changes(self, obj) -> bool:
        return self._has_X_changes(obj, "unsaved")

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
            if data["org_type"] == SCRATCH_ORG_TYPES.Playground:
                orgs = orgs.filter(
                    owner=data.get("owner", self.context["request"].user)
                )
            if data.get("task") and orgs.filter(task=data["task"]).exists():
                raise serializers.ValidationError(
                    _("A ScratchOrg of this type already exists for this task.")
                )
            if data.get("epic") and orgs.filter(epic=data["epic"]).exists():
                raise serializers.ValidationError(
                    _("A ScratchOrg of this type already exists for this epic.")
                )
            if data.get("project") and orgs.filter(project=data["project"]).exists():
                raise serializers.ValidationError(
                    _("A ScratchOrg of this type already exists for this project.")
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
    target_directory = serializers.CharField()


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
    gh_uid = serializers.CharField()
