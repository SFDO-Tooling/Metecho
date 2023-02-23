import html
import logging
from contextlib import suppress
from datetime import timedelta
from typing import Any, Iterable, Optional, Tuple

from allauth.account.signals import user_logged_in
from allauth.socialaccount.models import SocialAccount
from cryptography.fernet import InvalidToken
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as BaseUserManager
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models, transaction
from django.db.models.query_utils import Q
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from github3.exceptions import NotFoundError
from model_utils import FieldTracker
from parler.models import TranslatableModel, TranslatedFields
from requests.exceptions import HTTPError
from sfdo_template_helpers.crypto import fernet_decrypt
from sfdo_template_helpers.fields import MarkdownField, StringField
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin
from simple_salesforce.exceptions import SalesforceError

from . import gh
from .constants import CHANNELS_GROUP_NAME, ORGANIZATION_DETAILS
from .email_utils import get_user_facing_url
from .model_mixins import (
    CreatePrMixin,
    HashIdMixin,
    PopulateRepoIdMixin,
    PushMixin,
    SoftDeleteMixin,
    TimestampsMixin,
)
from .sf_run_flow import get_devhub_api, refresh_access_token
from .validators import validate_unicode_branch

logger = logging.getLogger(__name__)


class OrgType(models.TextChoices):
    PRODUCTION = "Production"
    SCRATCH = "Scratch"
    SANDBOX = "Sandbox"
    DEVELOPER = "Developer"


class ScratchOrgType(models.TextChoices):
    DEV = "Dev"
    QA = ("QA", "QA")
    PLAYGROUND = "Playground"


class EpicStatus(models.TextChoices):
    PLANNED = "Planned"
    IN_PROGRESS = "In progress"
    REVIEW = "Review"
    MERGED = "Merged"


class TaskStatus(models.TextChoices):
    PLANNED = "Planned"
    IN_PROGRESS = "In progress"
    COMPLETED = "Completed"
    CANCELED = "Canceled"


class TaskReviewStatus(models.TextChoices):
    APPROVED = "Approved"
    CHANGES_REQUESTED = "Changes requested"


class IssueStates(models.TextChoices):
    OPEN = "open"
    CLOSED = "closed"


class SiteProfile(TranslatableModel):
    site = models.OneToOneField(Site, on_delete=models.CASCADE)
    template_repo_owner = StringField(
        blank=True,
        help_text=_(
            "Owner of the GitHub repository to be used as a template for new Projects"
        ),
    )
    template_repo_name = StringField(
        blank=True,
        help_text=_(
            "Name of the GitHub repository to be used as a template for new Projects"
        ),
    )

    translations = TranslatedFields(
        name=models.CharField(max_length=64),
        clickthrough_agreement=MarkdownField(property_suffix="_markdown", blank=True),
    )

    def __str__(self) -> str:
        return str(self.name)


class UserQuerySet(models.QuerySet):
    pass


class UserManager(BaseUserManager.from_queryset(UserQuerySet)):
    def get_or_create_github_user(self):
        return self.get_or_create(username=settings.GITHUB_USER_NAME)[0]


class User(PushMixin, HashIdMixin, AbstractUser):
    objects = UserManager()
    currently_fetching_repos = models.BooleanField(default=False)
    currently_fetching_orgs = models.BooleanField(default=False)
    organizations = models.ManyToManyField(
        "api.GitHubOrganization",
        related_name="users",
        blank=True,
    )
    devhub_username = StringField(blank=True, default="")
    allow_devhub_override = models.BooleanField(default=False)
    agreed_to_tos_at = models.DateTimeField(null=True, blank=True)
    onboarded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date of the last time the user completed the interactive onboarding",
    )

    self_guided_tour_enabled = models.BooleanField(default=True)
    self_guided_tour_state = models.JSONField(null=True, blank=True)

    def notify(self, subject, body):
        # Right now, the only way we notify is via email. In future, we
        # may add in-app notifications.

        # Escape <>& in case the email gets accidentally rendered as HTML
        subject = html.escape(subject, quote=False)
        body = html.escape(body, quote=False)
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [self.email],
            fail_silently=False,
        )

    def queue_refresh_repositories(self):
        from .jobs import refresh_github_repositories_for_user_job

        if not self.currently_fetching_repos:
            self.currently_fetching_repos = True
            self.save()
            refresh_github_repositories_for_user_job.delay(self)

    def finalize_refresh_repositories(self, error=None):
        self.refresh_from_db()
        self.currently_fetching_repos = False
        self.save()
        if error is None:
            self.notify_changed(type_="USER_REPOS_REFRESH", originating_user_id=None)
        else:
            self.notify_error(error, type_="USER_REPOS_ERROR", originating_user_id=None)

    def queue_refresh_organizations(self):
        from .jobs import refresh_github_organizations_for_user_job

        if not self.currently_fetching_orgs:
            self.currently_fetching_orgs = True
            self.save()
            refresh_github_organizations_for_user_job.delay(user=self)

    def finalize_refresh_organizations(self, *, error: Exception = None):
        self.refresh_from_db()
        self.currently_fetching_orgs = False
        self.save()
        if error is None:
            self.notify_changed(
                type_="USER_ORGS_REFRESH", originating_user_id=None, include_user=True
            )
        else:
            self.notify_error(
                error, type_="USER_ORGS_REFRESH_ERROR", originating_user_id=None
            )

    def invalidate_salesforce_credentials(self):
        self.socialaccount_set.filter(provider="salesforce").delete()

    def subscribable_by(self, user):
        return self == user

    # begin PushMixin configuration:
    push_update_type = "USER_UPDATE"
    push_error_type = "USER_ERROR"

    def get_serialized_representation(self, user):
        from .serializers import FullUserSerializer

        return FullUserSerializer(
            self, context=self._create_context_with_user(user)
        ).data

    # end PushMixin configuration

    def _get_org_property(self, key):
        try:
            return self.salesforce_account.extra_data[ORGANIZATION_DETAILS][key]
        except (AttributeError, KeyError, TypeError):
            return None

    def delete(self, *args, **kwargs):
        for scratch_org_to_delete in self.scratchorg_set.all():
            scratch_org_to_delete.owner = None
            scratch_org_to_delete.save()
            scratch_org_to_delete.queue_delete(originating_user_id=self.id)

        super().delete(*args, **kwargs)

    @property
    def github_id(self) -> Optional[int]:
        try:
            return int(self.github_account.uid)
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def avatar_url(self) -> Optional[str]:
        try:
            return self.github_account.get_avatar_url()
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def org_id(self) -> Optional[str]:
        try:
            return self.salesforce_account.extra_data["organization_id"]
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def org_name(self) -> Optional[str]:
        if self.devhub_username or self.uses_global_devhub:
            return None
        return self._get_org_property("Name")

    @property
    def org_type(self) -> Optional[str]:
        if self.devhub_username or self.uses_global_devhub:
            return None
        return self._get_org_property("OrganizationType")

    @property
    def full_org_type(self) -> Optional[str]:
        org_type = self._get_org_property("OrganizationType")
        is_sandbox = self._get_org_property("IsSandbox")
        has_expiration = self._get_org_property("TrialExpirationDate") is not None
        if org_type is None or is_sandbox is None:
            return None
        if org_type == "Developer Edition" and not is_sandbox:
            return OrgType.DEVELOPER
        if org_type != "Developer Edition" and not is_sandbox:
            return OrgType.PRODUCTION
        if is_sandbox and not has_expiration:
            return OrgType.SANDBOX
        if is_sandbox and has_expiration:
            return OrgType.SCRATCH

    @property
    def instance_url(self) -> Optional[str]:
        try:
            return self.salesforce_account.extra_data["instance_url"]
        except (AttributeError, KeyError):
            return None

    @property
    def uses_global_devhub(self) -> bool:
        return bool(
            settings.DEVHUB_USERNAME
            and not self.devhub_username
            and not self.allow_devhub_override
        )

    @property
    def sf_username(self) -> Optional[str]:
        if self.devhub_username:
            return self.devhub_username

        if self.uses_global_devhub:
            return settings.DEVHUB_USERNAME

        try:
            return self.salesforce_account.extra_data["preferred_username"]
        except (AttributeError, KeyError):
            return None

    @property
    def sf_token(self) -> Tuple[Optional[str], Optional[str]]:
        try:
            token = self.salesforce_account.socialtoken_set.first()
            return (
                fernet_decrypt(token.token) if token.token else None,
                token.token_secret if token.token_secret else None,
            )
        except (InvalidToken, AttributeError):
            return (None, None)

    @property
    def gh_token(self):
        return self.socialaccount_set.get(provider="github").socialtoken_set.get().token

    @property
    def github_account(self) -> Optional[SocialAccount]:
        return self.socialaccount_set.filter(provider="github").first()

    @property
    def salesforce_account(self) -> Optional[SocialAccount]:
        return self.socialaccount_set.filter(provider="salesforce").first()

    @property
    def valid_token_for(self) -> Optional[str]:
        if self.devhub_username or self.uses_global_devhub:
            return None
        if all(self.sf_token) and self.org_id:
            return self.org_id
        return None

    @cached_property
    def is_devhub_enabled(self) -> bool:
        # We can shortcut and avoid making an HTTP request in some cases:
        if self.devhub_username or self.uses_global_devhub:
            return True
        if not self.salesforce_account:
            return False
        if self.full_org_type in (OrgType.SCRATCH, OrgType.SANDBOX):
            return False

        try:
            client = get_devhub_api(devhub_username=self.sf_username)
            resp = client.restful("sobjects/ScratchOrgInfo")
            if resp:
                return True
            return False
        except (SalesforceError, HTTPError):
            return False


class ProjectSlug(AbstractSlug):
    parent = models.ForeignKey(
        "Project", on_delete=models.CASCADE, related_name="slugs"
    )


class Project(
    PushMixin,
    PopulateRepoIdMixin,
    HashIdMixin,
    TimestampsMixin,
    SlugMixin,
    SoftDeleteMixin,
    models.Model,
):
    repo_owner = StringField()
    repo_name = StringField()
    name = StringField(unique=True)
    description = MarkdownField(blank=True, property_suffix="_markdown")
    has_truncated_issues = models.BooleanField(default=False)
    is_managed = models.BooleanField(default=False)
    repo_id = models.IntegerField(null=True, blank=True, unique=True)
    repo_image_url = models.URLField(blank=True)
    include_repo_image_url = models.BooleanField(default=True)
    branch_name = models.CharField(
        max_length=100,
        blank=True,
        validators=[validate_unicode_branch],
    )
    branch_prefix = StringField(blank=True)
    github_users = models.ManyToManyField(
        "GitHubUser", through="GitHubCollaboration", related_name="projects", blank=True
    )
    # List of {
    #   "key": str,
    #   "label": str,
    #   "description": str,
    # }
    org_config_names = models.JSONField(default=list, blank=True)
    currently_fetching_org_config_names = models.BooleanField(default=False)
    currently_fetching_github_users = models.BooleanField(default=False)
    latest_sha = StringField(blank=True)
    currently_fetching_issues = models.BooleanField(default=False)

    slug_class = ProjectSlug
    tracker = FieldTracker(fields=["name"])

    def subscribable_by(self, user):  # pragma: nocover
        return True

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        return f"/projects/{self.slug}"

    # begin PushMixin configuration:
    push_update_type = "PROJECT_UPDATE"
    push_error_type = "PROJECT_UPDATE_ERROR"

    def get_serialized_representation(self, user):
        from .serializers import ProjectSerializer

        return ProjectSerializer(
            self, context=self._create_context_with_user(user)
        ).data

    # end PushMixin configuration

    def __str__(self):
        return self.name

    class Meta:
        ordering = ("name",)
        unique_together = (("repo_owner", "repo_name"),)

    def save(self, *args, **kwargs):
        # Ignore GitHub 404 errors if the repository for a Project has not been created
        with suppress(NotFoundError):
            if not self.branch_name:
                repo = gh.get_repo_info(
                    None, repo_owner=self.repo_owner, repo_name=self.repo_name
                )
                self.branch_name = repo.default_branch
                self.latest_sha = repo.branch(repo.default_branch).latest_sha()
            elif not self.latest_sha:
                repo = gh.get_repo_info(
                    None, repo_owner=self.repo_owner, repo_name=self.repo_name
                )
                self.latest_sha = repo.branch(self.branch_name).latest_sha()

        super().save(*args, **kwargs)

    @property
    def repo_url(self) -> str:
        return f"https://github.com/{self.repo_owner}/{self.repo_name}"

    def finalize_get_social_image(self):
        self.save()
        self.notify_changed(originating_user_id=None)

    def queue_create_repository(
        self,
        *,
        user: User,
        dependencies: Iterable[str],
        template_repo_owner: str = None,
        template_repo_name: str = None,
    ):
        from .jobs import create_repository_job

        create_repository_job.delay(
            self,
            user=user,
            dependencies=dependencies,
            template_repo_owner=template_repo_owner,
            template_repo_name=template_repo_name,
        )

    def finalize_create_repository(self, *, error=None, user: User):
        originating_user_id = str(user.id)
        if error is None:
            self.save()
            self.notify_changed(
                type_="PROJECT_CREATE", originating_user_id=originating_user_id
            )
            # Get fresh permission information for each collaborator
            self.queue_refresh_github_users(originating_user_id=originating_user_id)
        else:
            self.notify_error(
                error,
                type_="PROJECT_CREATE_ERROR",
                originating_user_id=originating_user_id,
            )
            self.hard_delete()

    def queue_refresh_github_users(self, *, originating_user_id):
        from .jobs import refresh_github_users_job

        if not self.currently_fetching_github_users:
            self.currently_fetching_github_users = True
            self.save()
            refresh_github_users_job.delay(
                self, originating_user_id=originating_user_id
            )

    def finalize_refresh_github_users(self, *, error=None, originating_user_id):
        self.currently_fetching_github_users = False
        self.save()
        if error is None:
            self.notify_changed(originating_user_id=originating_user_id)
        else:
            self.notify_error(
                error,
                type_="REFRESH_GH_USERS_ERROR",
                originating_user_id=originating_user_id,
            )

    def queue_refresh_github_issues(self, *, originating_user_id):
        from .jobs import refresh_github_issues_job

        if not self.currently_fetching_issues:
            self.currently_fetching_issues = True
            self.save()
            self.notify_changed(originating_user_id=originating_user_id)
            refresh_github_issues_job.delay(
                self, originating_user_id=originating_user_id
            )

    def finalize_refresh_github_issues(self, *, error=None, originating_user_id):
        self.currently_fetching_issues = False
        self.save()
        if error is None:
            self.notify_changed(originating_user_id=originating_user_id)
        else:
            self.notify_error(
                error,
                type_="REFRESH_GH_ISSUES_ERROR",
                originating_user_id=originating_user_id,
            )

    def queue_refresh_commits(self, *, ref, originating_user_id):
        from .jobs import refresh_commits_job

        refresh_commits_job.delay(
            project=self, branch_name=ref, originating_user_id=originating_user_id
        )

    def queue_available_org_config_names(self, user=None):
        from .jobs import available_org_config_names_job

        self.currently_fetching_org_config_names = True
        self.save()
        self.notify_changed(originating_user_id=str(user.id) if user else None)
        available_org_config_names_job.delay(self, user=user)

    def finalize_available_org_config_names(self, originating_user_id=None):
        self.currently_fetching_org_config_names = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_project_update(self, *, originating_user_id=None):
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    @transaction.atomic
    def add_commits(self, *, commits, ref, sender):
        if self.branch_name == ref:
            self.latest_sha = commits[0].get("id") if commits else ""
            self.finalize_project_update()

        matching_epics = Epic.objects.filter(branch_name=ref, project=self)
        for epic in matching_epics:
            epic.add_commits(commits)

        matching_tasks = Task.objects.filter(
            Q(branch_name=ref, project=self) | Q(branch_name=ref, epic__project=self)
        )
        for task in matching_tasks:
            task.add_commits(commits, sender)

    def has_push_permission(self, user):
        return self.githubcollaboration_set.filter(
            user_id=user.github_id, permissions__push=True
        ).exists()


class ProjectDependency(HashIdMixin, TimestampsMixin):
    name = StringField()
    url = models.URLField()
    recommended = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("project dependency")
        verbose_name_plural = _("project dependencies")
        ordering = ("-recommended", "name")


class GitHubOrganization(HashIdMixin, TimestampsMixin):
    name = StringField()
    login = StringField(unique=True, help_text="Organization's 'username' on GitHub")
    avatar_url = models.URLField(_("Avatar URL"), blank=True)

    class Meta:
        verbose_name = _("GitHub organization")
        ordering = ("name",)

    def __str__(self):
        return self.name

    @property
    def github_url(self):
        return f"https://github.com/{self.login}"


class GitHubUser(models.Model):
    login = StringField()
    name = StringField()
    avatar_url = models.URLField()

    class Meta:
        ordering = ("login",)
        verbose_name = _("GitHub user")
        verbose_name_plural = _("GitHub users")

    def __str__(self):
        return self.login


class GitHubCollaboration(models.Model):
    """A record of a GitHubUser participating in a Project"""

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    user = models.ForeignKey(GitHubUser, on_delete=models.CASCADE)
    permissions = models.JSONField(null=True)


class GitHubIssue(HashIdMixin):
    github_id = models.PositiveIntegerField(db_index=True)
    title = StringField()
    number = models.PositiveIntegerField()
    state = models.CharField(choices=IssueStates.choices, max_length=50)
    html_url = models.URLField()
    project = models.ForeignKey(
        Project, related_name="issues", on_delete=models.CASCADE
    )

    # These are not automated timestamp fields, they are part of the GitHub API response
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "GitHub issue"
        verbose_name_plural = "GitHub issues"

    def __str__(self):
        return self.title


class EpicSlug(AbstractSlug):
    parent = models.ForeignKey("Epic", on_delete=models.CASCADE, related_name="slugs")


class Epic(
    CreatePrMixin,
    PushMixin,
    HashIdMixin,
    TimestampsMixin,
    SlugMixin,
    SoftDeleteMixin,
    models.Model,
):
    name = StringField()
    description = MarkdownField(blank=True, property_suffix="_markdown")
    branch_name = models.CharField(
        max_length=100, blank=True, default="", validators=[validate_unicode_branch]
    )
    has_unmerged_commits = models.BooleanField(default=False)
    currently_creating_branch = models.BooleanField(default=False)
    currently_creating_pr = models.BooleanField(default=False)
    pr_number = models.IntegerField(null=True, blank=True)
    pr_is_open = models.BooleanField(default=False)
    pr_is_merged = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20, choices=EpicStatus.choices, default=EpicStatus.PLANNED
    )
    latest_sha = StringField(blank=True)

    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="epics")
    github_users = models.ManyToManyField(GitHubUser, related_name="epics", blank=True)
    issue = models.OneToOneField(
        GitHubIssue,
        related_name="epic",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    slug_class = EpicSlug
    tracker = FieldTracker(fields=["name"])

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.update_status()
        return super().save(*args, **kwargs)

    def subscribable_by(self, user):  # pragma: nocover
        return True

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        return f"/projects/{self.project.slug}/epics/{self.slug}"

    # begin SoftDeleteMixin configuration:
    def soft_delete_child_class(self):
        return Task

    # end SoftDeleteMixin configuration

    # begin PushMixin configuration:
    push_update_type = "EPIC_UPDATE"
    push_error_type = "EPIC_CREATE_PR_FAILED"

    def get_serialized_representation(self, user):
        from .serializers import EpicSerializer

        return EpicSerializer(self, context=self._create_context_with_user(user)).data

    # end PushMixin configuration

    # begin CreatePrMixin configuration:
    create_pr_event = "EPIC_CREATE_PR"

    def get_repo_id(self):
        return self.project.get_repo_id()

    def get_base(self):
        return self.project.branch_name

    def get_head(self):
        return self.branch_name

    def try_to_notify_assigned_user(self):  # pragma: nocover
        # Does nothing in this case.
        pass

    # end CreatePrMixin configuration

    def has_push_permission(self, user):
        return self.project.has_push_permission(user)

    def create_gh_branch(self, user):
        from .jobs import create_gh_branch_for_new_epic_job

        create_gh_branch_for_new_epic_job.delay(self, user=user)

    def should_update_in_progress(self):
        task_statuses = self.tasks.values_list("status", flat=True)
        return task_statuses and any(
            status != TaskStatus.PLANNED for status in task_statuses
        )

    def should_update_review(self):
        """
        Returns truthy if:
            - there is at least one completed task
            - all tasks are completed or canceled
        """
        task_statuses = self.tasks.values_list("status", flat=True)
        return (
            task_statuses
            and all(
                status in [TaskStatus.COMPLETED, TaskStatus.CANCELED]
                for status in task_statuses
            )
            and any(status == TaskStatus.COMPLETED for status in task_statuses)
        )

    def should_update_merged(self):
        return self.pr_is_merged

    def should_update_status(self):
        if self.should_update_merged():
            return self.status != EpicStatus.MERGED
        elif self.should_update_review():
            return self.status != EpicStatus.REVIEW
        elif self.should_update_in_progress():
            return self.status != EpicStatus.IN_PROGRESS
        return False

    def update_status(self):
        if self.should_update_merged():
            self.status = EpicStatus.MERGED
        elif self.should_update_review():
            self.status = EpicStatus.REVIEW
        elif self.should_update_in_progress():
            self.status = EpicStatus.IN_PROGRESS

    def notify_created(self, originating_user_id=None):
        # Notify all users about the new epic
        group_name = CHANNELS_GROUP_NAME.format(
            model=self.project._meta.model_name, id=self.project.id
        )
        self.notify_changed(
            type_="EPIC_CREATE",
            originating_user_id=originating_user_id,
            group_name=group_name,
        )

    def finalize_pr_closed(self, pr_number, *, originating_user_id):
        self.pr_number = pr_number
        self.pr_is_open = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_pr_opened(self, pr_number, *, originating_user_id):
        self.pr_number = pr_number
        self.pr_is_open = True
        self.pr_is_merged = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_epic_update(self, *, originating_user_id=None):
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_status_completed(self, pr_number, *, originating_user_id):
        self.pr_number = pr_number
        self.pr_is_merged = True
        self.has_unmerged_commits = False
        self.pr_is_open = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def add_commits(self, commits):
        self.latest_sha = commits[0].get("id") if commits else ""
        self.finalize_epic_update()

    class Meta:
        ordering = ("-created_at", "name")
        # We enforce this in business logic, not in the database, as we
        # need to limit this constraint only to active Epics, and
        # make the name column case-insensitive:
        # unique_together = (("name", "project"),)


class TaskSlug(AbstractSlug):
    parent = models.ForeignKey("Task", on_delete=models.CASCADE, related_name="slugs")


class Task(
    CreatePrMixin,
    PushMixin,
    HashIdMixin,
    TimestampsMixin,
    SlugMixin,
    SoftDeleteMixin,
    models.Model,
):
    # Current assumption is that a Task will always be attached to at least one of
    # Project or Epic, but never both
    project = models.ForeignKey(
        Project, on_delete=models.PROTECT, blank=True, null=True, related_name="tasks"
    )
    epic = models.ForeignKey(
        Epic, on_delete=models.PROTECT, blank=True, null=True, related_name="tasks"
    )

    name = StringField()
    description = MarkdownField(blank=True, property_suffix="_markdown")
    branch_name = models.CharField(
        max_length=100, blank=True, default="", validators=[validate_unicode_branch]
    )
    org_config_name = StringField()

    issue = models.OneToOneField(
        GitHubIssue,
        related_name="task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    commits = models.JSONField(default=list, blank=True)
    origin_sha = StringField(blank=True, default="")
    metecho_commits = models.JSONField(default=list, blank=True)
    has_unmerged_commits = models.BooleanField(default=False)

    currently_creating_branch = models.BooleanField(default=False)
    currently_creating_pr = models.BooleanField(default=False)
    pr_number = models.IntegerField(null=True, blank=True)
    pr_is_open = models.BooleanField(default=False)

    currently_submitting_review = models.BooleanField(default=False)
    review_submitted_at = models.DateTimeField(null=True, blank=True)
    review_valid = models.BooleanField(default=False)
    review_status = models.CharField(
        choices=TaskReviewStatus.choices, blank=True, default="", max_length=32
    )
    review_sha = StringField(blank=True, default="")
    reviewers = models.JSONField(default=list, blank=True)

    status = models.CharField(
        choices=TaskStatus.choices, default=TaskStatus.PLANNED, max_length=16
    )

    assigned_dev = models.ForeignKey(
        GitHubUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dev_tasks",
    )
    assigned_qa = models.ForeignKey(
        GitHubUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="qa_tasks",
    )

    slug_class = TaskSlug
    tracker = FieldTracker(fields=["name"])

    class Meta:
        ordering = ("-created_at", "name")
        constraints = [
            # Ensure we always have an Epic or Project attached, but not both
            models.CheckConstraint(
                check=(Q(project__isnull=False) | Q(epic__isnull=False))
                & ~Q(project__isnull=False, epic__isnull=False),
                name="project_xor_epic",
            )
        ]

    def __str__(self):
        return self.name

    @property
    def full_name(self) -> str:
        # Used in emails to fully identify a task by its parents
        if self.epic:
            return _('"{}" on {} Epic {}').format(self, self.epic.project, self.epic)
        return _('"{}" on {}').format(self, self.project)

    @property
    def root_project(self) -> Project:
        if self.epic:
            return self.epic.project
        return self.project

    def save(self, *args, force_epic_save=False, **kwargs):
        is_new = self.pk is None
        ret = super().save(*args, **kwargs)
        save_epic = self.epic and (force_epic_save or self.epic.should_update_status())

        # To update the epic's status
        if save_epic:
            self.epic.save()

        # Notify epic about new status or new task count
        if self.epic and (save_epic or is_new):
            self.epic.notify_changed(originating_user_id=None)

        return ret

    def delete(self, *args, **kwargs):
        # Notify epic about new task count
        if self.epic:
            self.epic.notify_changed(originating_user_id=None)
        return super().delete(*args, **kwargs)

    def subscribable_by(self, user):  # pragma: nocover
        return True

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        if self.epic:
            return (
                f"/projects/{self.epic.project.slug}"
                + f"/epics/{self.epic.slug}/tasks/{self.slug}"
            )
        return f"/projects/{self.project.slug}/tasks/{self.slug}"

    # begin SoftDeleteMixin configuration:
    def soft_delete_child_class(self):
        return ScratchOrg

    # end SoftDeleteMixin configuration

    # begin PushMixin configuration:
    push_update_type = "TASK_UPDATE"
    push_error_type = "TASK_CREATE_PR_FAILED"

    def get_serialized_representation(self, user):
        from .serializers import TaskSerializer

        return TaskSerializer(self, context=self._create_context_with_user(user)).data

    # end PushMixin configuration

    # begin CreatePrMixin configuration:
    create_pr_event = "TASK_CREATE_PR"

    @property
    def get_all_users_in_commits(self):
        ret = []
        for commit in self.commits:
            if commit["author"] not in ret:
                ret.append(commit["author"])
        ret.sort(key=lambda d: d["username"])
        return ret

    def add_reviewer(self, user):
        if user not in self.reviewers:
            self.reviewers.append(user)
            self.save()

    def get_repo_id(self):
        return self.root_project.get_repo_id()

    def get_base(self):
        if self.epic:
            return self.epic.branch_name
        return self.project.branch_name

    def get_head(self):
        return self.branch_name

    def try_to_notify_assigned_user(self):
        # This takes the tester (a.k.a. assigned_qa) and sends them an
        # email when a PR has been made.
        id_ = getattr(self, "assigned_qa_id", None)
        sa = SocialAccount.objects.filter(provider="github", uid=id_).first()
        user = getattr(sa, "user", None)
        if user:
            metecho_link = get_user_facing_url(path=self.get_absolute_url())
            subject = _("Metecho Task Submitted for Testing")
            body = render_to_string(
                "pr_created_for_task.txt",
                {
                    "task_name": self.full_name,
                    "assigned_user_name": user.username,
                    "metecho_link": metecho_link,
                },
            )
            user.notify(subject, body)

    # end CreatePrMixin configuration

    def has_push_permission(self, user):
        return self.root_project.has_push_permission(user)

    def update_review_valid(self):
        review_valid = bool(
            self.review_sha
            and self.commits
            and self.review_sha == self.commits[0].get("id")
        )
        self.review_valid = review_valid

    def update_has_unmerged_commits(self):
        base = self.get_base()
        head = self.get_head()
        if head and base:
            repo = gh.get_repo_info(
                None,
                repo_owner=self.root_project.repo_owner,
                repo_name=self.root_project.repo_name,
            )
            base_sha = repo.branch(base).commit.sha
            head_sha = repo.branch(head).commit.sha
            self.has_unmerged_commits = (
                repo.compare_commits(base_sha, head_sha).ahead_by > 0
            )

    def notify_created(self, originating_user_id=None):
        # Notify all users about the new task
        group_name = CHANNELS_GROUP_NAME.format(
            model=self.root_project._meta.model_name, id=self.root_project.id
        )
        self.notify_changed(
            type_="TASK_CREATE",
            originating_user_id=originating_user_id,
            group_name=group_name,
        )

    def finalize_task_update(self, *, originating_user_id):
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_status_completed(self, pr_number, *, originating_user_id):
        self.status = TaskStatus.COMPLETED
        self.has_unmerged_commits = False
        self.pr_number = pr_number
        self.pr_is_open = False
        if self.epic:
            self.epic.has_unmerged_commits = True
        # This will save the epic, too:
        self.save(force_epic_save=True)
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_pr_closed(self, pr_number, *, originating_user_id):
        self.status = TaskStatus.CANCELED
        self.pr_number = pr_number
        self.pr_is_open = False
        self.review_valid = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_pr_opened(self, pr_number, *, originating_user_id):
        self.status = TaskStatus.IN_PROGRESS
        self.pr_number = pr_number
        self.pr_is_open = True
        self.pr_is_merged = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_provision(self, *, originating_user_id):
        if self.status == TaskStatus.PLANNED:
            self.status = TaskStatus.IN_PROGRESS
            self.save()
            self.notify_changed(originating_user_id=originating_user_id)

    def finalize_commit_changes(self, *, originating_user_id):
        if self.status != TaskStatus.IN_PROGRESS:
            self.status = TaskStatus.IN_PROGRESS
            self.save()
            self.notify_changed(originating_user_id=originating_user_id)

    def add_commits(self, commits, sender):
        self.commits = [
            gh.normalize_commit(c, sender=sender) for c in commits
        ] + self.commits
        self.update_has_unmerged_commits()
        self.update_review_valid()
        self.save()
        # This comes from the GitHub hook, and so has no originating user:
        self.notify_changed(originating_user_id=None)

    def add_metecho_git_sha(self, sha):
        self.metecho_commits.append(sha)

    def queue_submit_review(self, *, user, data, originating_user_id):
        from .jobs import submit_review_job

        self.currently_submitting_review = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)
        submit_review_job.delay(
            user=user, task=self, data=data, originating_user_id=originating_user_id
        )

    def finalize_submit_review(
        self,
        timestamp,
        *,
        error=None,
        sha=None,
        status="",
        delete_org=False,
        org=None,
        originating_user_id,
    ):
        self.currently_submitting_review = False
        if error:
            self.save()
            self.notify_error(
                error,
                type_="TASK_SUBMIT_REVIEW_FAILED",
                originating_user_id=originating_user_id,
            )
        else:
            self.review_submitted_at = timestamp
            self.review_status = status
            self.review_sha = sha
            self.update_review_valid()
            self.save()
            self.notify_changed(
                type_="TASK_SUBMIT_REVIEW", originating_user_id=originating_user_id
            )
            deletable_org = (
                org and org.task == self and org.org_type == ScratchOrgType.QA
            )
            if delete_org and deletable_org:
                org.queue_delete(originating_user_id=originating_user_id)


class ScratchOrg(
    SoftDeleteMixin, PushMixin, HashIdMixin, TimestampsMixin, models.Model
):
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="orgs",
        null=True,
        blank=True,
    )
    epic = models.ForeignKey(
        Epic,
        on_delete=models.PROTECT,
        related_name="orgs",
        null=True,
        blank=True,
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.PROTECT,
        related_name="orgs",
        null=True,
        blank=True,
    )
    description = MarkdownField(blank=True, property_suffix="_markdown")
    org_type = StringField(choices=ScratchOrgType.choices)
    org_config_name = StringField()
    owner = models.ForeignKey(User, on_delete=models.PROTECT, blank=True, null=True)
    last_modified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    latest_commit = StringField(blank=True)
    latest_commit_url = models.URLField(blank=True)
    latest_commit_at = models.DateTimeField(null=True, blank=True)
    url = models.URLField(blank=True, default="")
    last_checked_unsaved_changes_at = models.DateTimeField(null=True, blank=True)
    unsaved_changes = models.JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )
    ignored_changes = models.JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )
    latest_revision_numbers = models.JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )
    currently_refreshing_changes = models.BooleanField(default=False)
    currently_retrieving_metadata = models.BooleanField(default=False)
    currently_parsing_datasets = models.BooleanField(default=False)
    currently_retrieving_dataset = models.BooleanField(default=False)
    currently_retrieving_omnistudio = models.BooleanField(default=False)
    currently_refreshing_org = models.BooleanField(default=False)
    currently_reassigning_user = models.BooleanField(default=False)
    is_created = models.BooleanField(default=False)
    config = models.JSONField(default=dict, encoder=DjangoJSONEncoder, blank=True)
    installed_packages = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    delete_queued_at = models.DateTimeField(null=True, blank=True)
    expiry_job_id = StringField(blank=True, default="")
    has_been_visited = models.BooleanField(default=False)
    valid_target_directories = models.JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )
    cci_log = models.TextField(blank=True)

    def _build_message_extras(self):
        return {
            "model": {
                "task": str(self.task.id) if self.task else None,
                "epic": str(self.epic.id) if self.epic else None,
                "project": str(self.project.id) if self.project else None,
                "org_type": self.org_type,
                "id": str(self.id),
            }
        }

    def subscribable_by(self, user):  # pragma: nocover
        return True

    @property
    def is_omnistudio_installed(self) -> bool:
        return any(
            namespace in self.installed_packages
            for namespace in ["omnistudio", "vlocity_cmt", "vlocity_ins", "vlocity_ps"]
        )

    @property
    def parent(self):
        return self.project or self.epic or self.task

    @property
    def root_project(self):
        if self.project:
            return self.project
        if self.epic:
            return self.epic.project
        if self.task:
            return self.task.root_project
        return None

    @property
    def owner_sf_username(self) -> Optional[str]:
        return getattr(self.owner, "sf_username", None)

    @property
    def owner_gh_username(self) -> str:
        return getattr(self.owner, "username", "")

    @property
    def owner_gh_id(self) -> Optional[int]:
        return getattr(self.owner, "github_id", None)

    def save(self, *args, **kwargs):
        is_new = self.id is None
        self.clean_config()
        ret = super().save(*args, **kwargs)

        if is_new and self.owner:
            self.queue_provision(originating_user_id=str(self.owner.id))
            self.notify_org_provisioning(originating_user_id=str(self.owner.id))

        return ret

    def clean(self):
        if len([x for x in [self.project, self.epic, self.task] if x is not None]) != 1:
            raise ValidationError(
                _("A Scratch Org must belong to either a Project, an Epic, or a Task.")
            )
        if self.org_type != ScratchOrgType.PLAYGROUND and not self.task:
            raise ValidationError(
                {"org_type": _("Dev and Test Orgs must belong to a Task.")}
            )
        return super().clean()

    def clean_config(self):
        banned_keys = {"email", "access_token", "refresh_token"}
        self.config = {k: v for (k, v) in self.config.items() if k not in banned_keys}

    def mark_visited(self, *, originating_user_id):
        self.has_been_visited = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def get_refreshed_org_config(self, org_name=None, keychain=None):
        org_config = refresh_access_token(
            scratch_org=self,
            config=self.config,
            org_name=org_name or self.org_config_name,
            keychain=keychain,
        )
        return org_config

    def get_login_url(self):
        org_config = self.get_refreshed_org_config()
        return org_config.start_url

    # begin PushMixin configuration:
    push_update_type = "SCRATCH_ORG_UPDATE"
    push_error_type = "SCRATCH_ORG_ERROR"

    def get_serialized_representation(self, user):
        from .serializers import ScratchOrgSerializer

        return ScratchOrgSerializer(
            self, context=self._create_context_with_user(user)
        ).data

    # end PushMixin configuration

    def queue_delete(self, *, originating_user_id):
        from .jobs import delete_scratch_org_job

        # If the scratch org has no `last_modified_at`, it did not
        # successfully complete the initial flow run on Salesforce, and
        # therefore we don't need to notify of its destruction; this
        # should only happen when it is destroyed during the initial
        # flow run.
        if self.last_modified_at:
            self.delete_queued_at = timezone.now()
            self.save()
            self.notify_changed(originating_user_id=originating_user_id)

        delete_scratch_org_job.delay(self, originating_user_id=originating_user_id)

    def finalize_delete(self, *, originating_user_id):
        self.notify_changed(
            type_="SCRATCH_ORG_DELETE",
            originating_user_id=originating_user_id,
            message=self._build_message_extras(),
        )

    def delete(self, *args, should_finalize=True, originating_user_id=None, **kwargs):
        # If the scratch org has no `last_modified_at`, it did not
        # successfully complete the initial flow run on Salesforce, and
        # therefore we don't need to notify of its destruction; this
        # should only happen when it is destroyed during provisioning or
        # the initial flow run.
        if self.last_modified_at and should_finalize:
            self.finalize_delete(originating_user_id=originating_user_id)
        super().delete(*args, **kwargs)

    def queue_provision(self, *, originating_user_id):
        from .jobs import create_branches_on_github_then_create_scratch_org_job

        create_branches_on_github_then_create_scratch_org_job.delay(
            scratch_org=self, originating_user_id=originating_user_id
        )

    def finalize_provision(self, *, error=None, originating_user_id):
        if error is None:
            self.save()
            self.notify_changed(
                type_="SCRATCH_ORG_PROVISION", originating_user_id=originating_user_id
            )
            if self.task:
                self.task.finalize_provision(originating_user_id=originating_user_id)
        else:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_PROVISION_FAILED",
                originating_user_id=originating_user_id,
                message=self._build_message_extras(),
            )
            # If the scratch org has already been created on Salesforce,
            # we need to delete it there as well.
            if self.url:
                self.queue_delete(originating_user_id=originating_user_id)
            else:
                self.delete(originating_user_id=originating_user_id)

    def queue_convert_to_dev_org(self, task, *, originating_user_id=None):
        from .jobs import convert_to_dev_org_job

        convert_to_dev_org_job.delay(
            scratch_org=self, task=task, originating_user_id=originating_user_id
        )

    def finalize_convert_to_dev_org(self, task, *, error=None, originating_user_id):
        if error:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_CONVERT_FAILED",
                originating_user_id=originating_user_id,
            )
            return

        self.org_type = ScratchOrgType.DEV
        self.task = task
        self.epic = None
        self.project = None
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def queue_get_unsaved_changes(self, *, force_get=False, originating_user_id):
        from .jobs import get_unsaved_changes_job

        minutes_since_last_check = (
            self.last_checked_unsaved_changes_at is not None
            and timezone.now() - self.last_checked_unsaved_changes_at
        )
        should_bail = (
            not force_get
            and minutes_since_last_check
            and minutes_since_last_check
            < timedelta(minutes=settings.ORG_RECHECK_MINUTES)
        )
        if should_bail:
            return

        self.currently_refreshing_changes = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

        get_unsaved_changes_job.delay(self, originating_user_id=originating_user_id)

    def finalize_get_unsaved_changes(self, *, error=None, originating_user_id):
        self.currently_refreshing_changes = False
        if error is None:
            self.last_checked_unsaved_changes_at = timezone.now()
            self.save()
            self.notify_changed(originating_user_id=originating_user_id)
        else:
            self.unsaved_changes = {}
            self.save()
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_FETCH_CHANGES_FAILED",
                originating_user_id=originating_user_id,
            )

    def queue_commit_changes(
        self,
        *,
        user,
        desired_changes,
        commit_message,
        target_directory,
        originating_user_id,
    ):
        from .jobs import commit_changes_from_org_job

        self.currently_retrieving_metadata = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

        commit_changes_from_org_job.delay(
            scratch_org=self,
            user=user,
            desired_changes=desired_changes,
            commit_message=commit_message,
            target_directory=target_directory,
            originating_user_id=originating_user_id,
        )

    def finalize_commit_changes(self, *, error=None, originating_user_id):
        self.currently_retrieving_metadata = False
        self.save()
        if error is None:
            self.notify_changed(
                type_="SCRATCH_ORG_COMMIT_CHANGES",
                originating_user_id=originating_user_id,
            )
            if self.task:
                self.task.finalize_commit_changes(
                    originating_user_id=originating_user_id
                )
        else:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_COMMIT_CHANGES_FAILED",
                originating_user_id=originating_user_id,
            )

    def queue_parse_datasets(self, *, user: User):
        from .jobs import parse_datasets_job

        self.currently_parsing_datasets = True
        self.save()
        self.notify_changed(originating_user_id=user.id)
        parse_datasets_job.delay(org=self, user=user)

    def finalize_parse_datasets(
        self,
        *,
        error: Exception | None = None,
        schema: dict[str, Any] | None = None,
        dataset_errors: list[str] | None = None,
        datasets: dict[str, Any] | None = None,
        originating_user_id=None,
    ):
        # Notify about the boolean flag changing
        self.currently_parsing_datasets = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

        # The dataset information is not stored in the model, it's only pushed via WS
        type_ = "SCRATCH_ORG_PARSE_DATASETS"
        message = {
            "schema": schema,
            "dataset_errors": dataset_errors,
            "datasets": datasets,
        }
        if error is not None:
            type_ = "SCRATCH_ORG_PARSE_DATASETS_FAILED"
            message = {
                "dataset_errors": [
                    str(
                        _("Unable to parse dataset schema from Org: {}").format(
                            str(error)
                        )
                    )
                ],
            }
        self.notify_changed(
            type_=type_, message=message, originating_user_id=originating_user_id
        )

    def queue_commit_dataset(
        self,
        *,
        user: User,
        commit_message: str,
        dataset_name: str,
        dataset_definition: dict,
    ):
        from .jobs import commit_dataset_from_org_job

        self.currently_retrieving_dataset = True
        self.save()
        self.notify_changed(originating_user_id=user.id)

        commit_dataset_from_org_job.delay(
            org=self,
            user=user,
            commit_message=commit_message,
            dataset_name=dataset_name,
            dataset_definition=dataset_definition,
        )

    def queue_commit_omnistudio(
        self,
        *,
        user: User,
        commit_message: str,
        yaml_path: str,
    ):
        from .jobs import commit_omnistudio_from_org_job

        self.currently_retrieving_omnistudio = True
        self.save()
        self.notify_changed(originating_user_id=user.id)

        commit_omnistudio_from_org_job.delay(
            org=self,
            user=user,
            commit_message=commit_message,
            yaml_path=yaml_path,
        )

    def finalize_commit_dataset(self, *, error=None, originating_user_id):
        self.currently_retrieving_dataset = False
        self.save()
        if error is None:
            self.notify_changed(
                type_="SCRATCH_ORG_COMMIT_DATASET",
                originating_user_id=originating_user_id,
            )
            if self.task:
                self.task.finalize_commit_changes(
                    originating_user_id=originating_user_id
                )
        else:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_COMMIT_DATASET_FAILED",
                originating_user_id=originating_user_id,
            )

    def finalize_commit_omnistudio(self, *, error=None, originating_user_id):
        self.currently_retrieving_omnistudio = False
        self.save()
        if error is None:
            self.notify_changed(
                type_="SCRATCH_ORG_COMMIT_OMNISTUDIO",
                originating_user_id=originating_user_id,
            )
            if self.task:
                self.task.finalize_commit_changes(
                    originating_user_id=originating_user_id
                )
        else:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_COMMIT_OMNISTUDIO_FAILED",
                originating_user_id=originating_user_id,
            )

    def remove_scratch_org(self, error, *, originating_user_id):
        self.notify_scratch_org_error(
            error=error,
            type_="SCRATCH_ORG_REMOVE",
            originating_user_id=originating_user_id,
            message=self._build_message_extras(),
        )
        # set should_finalize=False to avoid accidentally sending a
        # SCRATCH_ORG_DELETE event:
        self.delete(should_finalize=False, originating_user_id=originating_user_id)

    def queue_refresh_org(self, *, originating_user_id):
        from .jobs import refresh_scratch_org_job

        self.has_been_visited = False
        self.currently_refreshing_org = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)
        refresh_scratch_org_job.delay(self, originating_user_id=originating_user_id)

    def finalize_refresh_org(self, *, error=None, originating_user_id):
        self.currently_refreshing_org = False
        self.save()
        if error is None:
            self.notify_changed(
                type_="SCRATCH_ORG_REFRESH", originating_user_id=originating_user_id
            )
        else:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_REFRESH_FAILED",
                originating_user_id=originating_user_id,
                message=self._build_message_extras(),
            )
            self.queue_delete(originating_user_id=originating_user_id)

    def queue_reassign(self, *, new_user, originating_user_id):
        from .jobs import user_reassign_job

        self.currently_reassigning_user = True
        was_deleted = self.deleted_at is not None
        self.deleted_at = None
        self.save()
        if was_deleted:
            self.notify_changed(
                type_="SCRATCH_ORG_RECREATE",
                originating_user_id=originating_user_id,
                for_list=True,
            )
        user_reassign_job.delay(
            self, new_user=new_user, originating_user_id=originating_user_id
        )

    def finalize_reassign(self, *, error=None, originating_user_id):
        self.currently_reassigning_user = False
        self.save()
        if error is None:
            self.notify_changed(
                type_="SCRATCH_ORG_REASSIGN", originating_user_id=originating_user_id
            )
        else:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_REASSIGN_FAILED",
                originating_user_id=originating_user_id,
            )
            self.delete()

    def notify_org_provisioning(self, originating_user_id):
        parent = self.parent
        if parent:
            group_name = CHANNELS_GROUP_NAME.format(
                model=parent._meta.model_name, id=parent.id
            )
            self.notify_changed(
                type_="SCRATCH_ORG_PROVISIONING",
                originating_user_id=originating_user_id,
                group_name=group_name,
            )


@receiver(user_logged_in)
def user_logged_in_handler(sender, *, user, **kwargs):
    user.queue_refresh_repositories()
    user.queue_refresh_organizations()


def ensure_slug_handler(sender, *, created, instance, **kwargs):
    slug_field_name = getattr(instance, "slug_field_name", "name")
    if created:
        instance.ensure_slug()
    elif instance.tracker.has_changed(slug_field_name):
        # Create new slug off new name:
        sluggable_name = getattr(instance, slug_field_name)
        slug = slugify(sluggable_name)
        slug = instance._find_unique_slug(slug)
        instance.slug_class.objects.create(
            parent=instance.slug_parent, slug=slug, is_active=True
        )
    with suppress(AttributeError):
        del instance.slug_cache  # Clear cached property


post_save.connect(ensure_slug_handler, sender=Project)
post_save.connect(ensure_slug_handler, sender=Epic)
post_save.connect(ensure_slug_handler, sender=Task)
