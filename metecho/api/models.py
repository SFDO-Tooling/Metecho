from datetime import timedelta

from allauth.account.signals import user_logged_in
from asgiref.sync import async_to_sync
from cryptography.fernet import InvalidToken
from cumulusci.core.config import OrgConfig
from cumulusci.oauth.salesforce import jwt_session
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as BaseUserManager
from django.contrib.postgres.fields import JSONField
from django.contrib.sites.models import Site
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.functional import cached_property
from model_utils import Choices
from parler.models import TranslatableModel, TranslatedFields
from sfdo_template_helpers.crypto import fernet_decrypt
from sfdo_template_helpers.fields import MarkdownField, StringField
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin
from simple_salesforce.exceptions import SalesforceError

from . import gh, push
from .constants import ORGANIZATION_DETAILS
from .model_mixins import (
    CreatePrMixin,
    HashIdMixin,
    PopulateRepoIdMixin,
    PushMixin,
    TimestampsMixin,
)
from .sf_run_flow import get_devhub_api
from .validators import validate_unicode_branch

ORG_TYPES = Choices("Production", "Scratch", "Sandbox", "Developer")
SCRATCH_ORG_TYPES = Choices("Dev", "QA")
PROJECT_STATUSES = Choices("Planned", "In progress", "Review", "Merged")
TASK_STATUSES = Choices(
    ("Planned", "Planned"), ("In progress", "In progress"), ("Completed", "Completed")
)
TASK_REVIEW_STATUS = Choices(
    ("Approved", "Approved"), ("Changes requested", "Changes requested")
)


class SiteProfile(TranslatableModel):
    site = models.OneToOneField(Site, on_delete=models.CASCADE)

    translations = TranslatedFields(
        name=models.CharField(max_length=64),
        clickthrough_agreement=MarkdownField(property_suffix="_markdown", blank=True),
    )


class UserQuerySet(models.QuerySet):
    pass


class UserManager(BaseUserManager.from_queryset(UserQuerySet)):
    def get_or_create_github_user(self):
        return self.get_or_create(username=settings.GITHUB_USER_NAME)[0]


class User(HashIdMixin, AbstractUser):
    objects = UserManager()
    currently_fetching_repos = models.BooleanField(default=False)
    devhub_username = StringField(null=True, blank=True)
    allow_devhub_override = models.BooleanField(default=False)
    agreed_to_tos_at = models.DateTimeField(null=True, blank=True)

    def queue_refresh_repositories(self):
        """Queue a job to refresh repositories unless we're already doing so"""
        from .jobs import refresh_github_repositories_for_user_job

        if not self.currently_fetching_repos:
            self.currently_fetching_repos = True
            self.save()
            refresh_github_repositories_for_user_job.delay(self)

    def refresh_repositories(self):
        try:
            repos = gh.get_all_org_repos(self)
            with transaction.atomic():
                GitHubRepository.objects.filter(user=self).delete()
                GitHubRepository.objects.bulk_create(
                    [
                        GitHubRepository(
                            user=self, repo_id=repo.id, repo_url=repo.html_url
                        )
                        for repo in repos
                    ]
                )
        finally:
            self.refresh_from_db()
            self.currently_fetching_repos = False
            self.save()
            self.notify_repositories_updated()

    def notify_repositories_updated(self):
        message = {"type": "USER_REPOS_REFRESH"}
        async_to_sync(push.push_message_about_instance)(self, message)

    def invalidate_salesforce_credentials(self):
        self.socialaccount_set.filter(provider="salesforce").delete()

    def subscribable_by(self, user):
        return self == user

    def _get_org_property(self, key):
        try:
            return self.salesforce_account.extra_data[ORGANIZATION_DETAILS][key]
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def avatar_url(self):
        try:
            return self.github_account.get_avatar_url()
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def org_id(self):
        try:
            return self.salesforce_account.extra_data["organization_id"]
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def org_name(self):
        if self.devhub_username or self.uses_global_devhub:
            return None
        return self._get_org_property("Name")

    @property
    def org_type(self):
        if self.devhub_username or self.uses_global_devhub:
            return None
        return self._get_org_property("OrganizationType")

    @property
    def full_org_type(self):
        org_type = self._get_org_property("OrganizationType")
        is_sandbox = self._get_org_property("IsSandbox")
        has_expiration = self._get_org_property("TrialExpirationDate") is not None
        if org_type is None or is_sandbox is None:
            return None
        if org_type == "Developer Edition" and not is_sandbox:
            return ORG_TYPES.Developer
        if org_type != "Developer Edition" and not is_sandbox:
            return ORG_TYPES.Production
        if is_sandbox and not has_expiration:
            return ORG_TYPES.Sandbox
        if is_sandbox and has_expiration:
            return ORG_TYPES.Scratch

    @property
    def instance_url(self):
        try:
            return self.salesforce_account.extra_data["instance_url"]
        except (AttributeError, KeyError):
            return None

    @property
    def uses_global_devhub(self):
        return bool(
            settings.DEVHUB_USERNAME
            and not self.devhub_username
            and not self.allow_devhub_override
        )

    @property
    def sf_username(self):
        if self.devhub_username:
            return self.devhub_username

        if self.uses_global_devhub:
            return settings.DEVHUB_USERNAME

        try:
            return self.salesforce_account.extra_data["preferred_username"]
        except (AttributeError, KeyError):
            return None

    @property
    def sf_token(self):
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
    def github_account(self):
        return self.socialaccount_set.filter(provider="github").first()

    @property
    def salesforce_account(self):
        return self.socialaccount_set.filter(provider="salesforce").first()

    @property
    def valid_token_for(self):
        if self.devhub_username or self.uses_global_devhub:
            return None
        if all(self.sf_token) and self.org_id:
            return self.org_id
        return None

    @cached_property
    def is_devhub_enabled(self):
        # We can shortcut and avoid making an HTTP request in some cases:
        if self.devhub_username or self.uses_global_devhub:
            return True
        if not self.salesforce_account:
            return False
        if self.full_org_type in (ORG_TYPES.Scratch, ORG_TYPES.Sandbox):
            return False

        client = get_devhub_api(devhub_username=self.sf_username)
        try:
            resp = client.restful("sobjects/ScratchOrgInfo")
            if resp:
                return True
            return False
        except SalesforceError:
            return False


class RepositorySlug(AbstractSlug):
    parent = models.ForeignKey(
        "Repository", on_delete=models.PROTECT, related_name="slugs"
    )


class Repository(
    PushMixin,
    PopulateRepoIdMixin,
    HashIdMixin,
    TimestampsMixin,
    SlugMixin,
    models.Model,
):
    repo_owner = StringField()
    repo_name = StringField()
    name = StringField(unique=True)
    description = MarkdownField(blank=True, property_suffix="_markdown")
    is_managed = models.BooleanField(default=False)
    repo_id = models.IntegerField(null=True, blank=True, unique=True)
    branch_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        validators=[validate_unicode_branch],
        default="master",
    )
    # User data is shaped like this:
    #   {
    #     "id": str,
    #     "login": str,
    #     "avatar_url": str,
    #   }
    github_users = JSONField(default=list, blank=True)

    slug_class = RepositorySlug

    def subscribable_by(self, user):  # pragma: nocover
        return True

    # begin PushMixin configuration:
    push_update_type = "REPOSITORY_UPDATE"
    push_error_type = "REPOSITORY_UPDATE_ERROR"

    def get_serialized_representation(self, user):
        from .serializers import RepositorySerializer

        return RepositorySerializer(
            self, context=self._create_context_with_user(user)
        ).data

    # end PushMixin configuration

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "repositories"
        ordering = ("name",)
        unique_together = (("repo_owner", "repo_name"),)

    def save(self, *args, **kwargs):
        if not self.branch_name:
            user = self.get_a_matching_user()
            if user:
                repo = gh.get_repo_info(user, repo_id=self.id)
                self.branch_name = repo.default_branch

        if not self.github_users:
            self.queue_populate_github_users(originating_user_id=None)

        super().save(*args, **kwargs)

    def get_a_matching_user(self):
        github_repository = GitHubRepository.objects.filter(
            repo_id=self.repo_id
        ).first()

        if github_repository:
            return github_repository.user

        return None

    def queue_populate_github_users(self, *, originating_user_id):
        from .jobs import populate_github_users_job

        populate_github_users_job.delay(self, originating_user_id=originating_user_id)

    def finalize_populate_github_users(self, *, error=None, originating_user_id):
        self.save()
        if error is None:
            self.notify_changed(originating_user_id=originating_user_id)
        else:
            self.notify_error(error, originating_user_id=originating_user_id)

    def queue_refresh_commits(self, *, ref, originating_user_id):
        from .jobs import refresh_commits_job

        refresh_commits_job.delay(
            repository=self, branch_name=ref, originating_user_id=originating_user_id
        )

    @transaction.atomic
    def add_commits(self, *, commits, ref, sender):
        matching_tasks = Task.objects.filter(branch_name=ref, project__repository=self)

        for task in matching_tasks:
            task.add_commits(commits, sender)


class GitHubRepository(HashIdMixin, models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="repositories"
    )
    repo_id = models.IntegerField()
    repo_url = models.URLField()

    class Meta:
        verbose_name_plural = "GitHub repositories"
        unique_together = (("user", "repo_id"),)

    def __str__(self):
        return self.repo_url


class ProjectSlug(AbstractSlug):
    parent = models.ForeignKey(
        "Project", on_delete=models.PROTECT, related_name="slugs"
    )


class Project(
    CreatePrMixin, PushMixin, HashIdMixin, TimestampsMixin, SlugMixin, models.Model
):
    name = StringField()
    description = MarkdownField(blank=True, property_suffix="_markdown")
    branch_name = models.CharField(
        max_length=100, blank=True, null=True, validators=[validate_unicode_branch]
    )
    has_unmerged_commits = models.BooleanField(default=False)
    currently_creating_pr = models.BooleanField(default=False)
    pr_number = models.IntegerField(null=True, blank=True)
    pr_is_open = models.BooleanField(default=False)
    pr_is_merged = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20, choices=PROJECT_STATUSES, default=PROJECT_STATUSES.Planned
    )

    repository = models.ForeignKey(
        Repository, on_delete=models.PROTECT, related_name="projects"
    )

    # User data is shaped like this:
    #   {
    #     "id": str,
    #     "login": str,
    #     "avatar_url": str,
    #   }
    github_users = JSONField(default=list, blank=True)

    slug_class = ProjectSlug

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.update_status()
        return super().save(*args, **kwargs)

    def subscribable_by(self, user):  # pragma: nocover
        return True

    # begin PushMixin configuration:
    push_update_type = "PROJECT_UPDATE"
    push_error_type = "PROJECT_CREATE_PR_FAILED"

    def get_serialized_representation(self, user):
        from .serializers import ProjectSerializer

        return ProjectSerializer(
            self, context=self._create_context_with_user(user)
        ).data

    # end PushMixin configuration

    # begin CreatePrMixin configuration:
    create_pr_event = "PROJECT_CREATE_PR"

    def get_repo_id(self, user):
        return self.repository.get_repo_id(user)

    def get_base(self):
        return self.repository.branch_name

    def get_head(self):
        return self.branch_name

    # end CreatePrMixin configuration

    def should_update_in_progress(self):
        task_statuses = self.tasks.values_list("status", flat=True)
        return task_statuses and any(
            status != TASK_STATUSES.Planned for status in task_statuses
        )

    def should_update_review(self):
        task_statuses = self.tasks.values_list("status", flat=True)
        return task_statuses and all(
            status == TASK_STATUSES.Completed for status in task_statuses
        )

    def should_update_merged(self):
        return self.pr_is_merged

    def should_update_status(self):
        return (
            self.should_update_in_progress()
            or self.should_update_review()
            or self.should_update_merged()
        )

    def update_status(self):
        if self.should_update_merged():
            self.status = PROJECT_STATUSES.Merged
        elif self.should_update_review():
            self.status = PROJECT_STATUSES.Review
        elif self.should_update_in_progress():
            self.status = PROJECT_STATUSES["In progress"]

    def finalize_pr_closed(self, *, originating_user_id):
        self.pr_is_open = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_pr_reopened(self, *, originating_user_id):
        self.pr_is_open = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_project_update(self, *, originating_user_id):
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_status_completed(self, *, originating_user_id):
        self.pr_is_merged = True
        self.has_unmerged_commits = False
        self.pr_is_open = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "repository"),)


class TaskSlug(AbstractSlug):
    parent = models.ForeignKey("Task", on_delete=models.PROTECT, related_name="slugs")


class Task(
    CreatePrMixin, PushMixin, HashIdMixin, TimestampsMixin, SlugMixin, models.Model
):
    name = StringField()
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="tasks")
    description = MarkdownField(blank=True, property_suffix="_markdown")
    branch_name = models.CharField(
        max_length=100, null=True, blank=True, validators=[validate_unicode_branch]
    )

    commits = JSONField(default=list, blank=True)
    origin_sha = StringField(null=True, blank=True)
    ms_commits = JSONField(default=list, blank=True)
    has_unmerged_commits = models.BooleanField(default=False)

    currently_creating_pr = models.BooleanField(default=False)
    pr_number = models.IntegerField(null=True, blank=True)
    pr_is_open = models.BooleanField(default=False)

    currently_submitting_review = models.BooleanField(default=False)
    review_submitted_at = models.DateTimeField(null=True, blank=True)
    review_valid = models.BooleanField(default=False)
    review_status = models.CharField(
        choices=TASK_REVIEW_STATUS, null=True, blank=True, max_length=32
    )
    review_sha = StringField(null=True, blank=True)

    status = models.CharField(
        choices=TASK_STATUSES, default=TASK_STATUSES.Planned, max_length=16
    )

    # Assignee user data is shaped like this:
    #   {
    #     "id": str,
    #     "login": str,
    #     "avatar_url": str,
    #   }
    assigned_dev = JSONField(null=True, blank=True)
    assigned_qa = JSONField(null=True, blank=True)

    slug_class = TaskSlug

    def __str__(self):
        return self.name

    def save(self, *args, force_project_save=True, **kwargs):
        ret = super().save(*args, **kwargs)
        # To update the project's status:
        if force_project_save or self.project.should_update_status():
            self.project.save()
            self.project.notify_changed(originating_user_id=None)
        return ret

    def subscribable_by(self, user):  # pragma: nocover
        return True

    # begin PushMixin configuration:
    push_update_type = "TASK_UPDATE"
    push_error_type = "TASK_CREATE_PR_FAILED"

    def get_serialized_representation(self, user):
        from .serializers import TaskSerializer

        return TaskSerializer(self, context=self._create_context_with_user(user)).data

    # end PushMixin configuration

    # begin CreatePrMixin configuration:
    create_pr_event = "TASK_CREATE_PR"

    def get_repo_id(self, user):
        return self.project.repository.get_repo_id(user)

    def get_base(self):
        return self.project.branch_name

    def get_head(self):
        return self.branch_name

    # end CreatePrMixin configuration

    def update_review_valid(self):
        review_valid = bool(
            self.review_sha
            and self.commits
            and self.review_sha == self.commits[0].get("id")
        )
        self.review_valid = review_valid

    def finalize_task_update(self, *, originating_user_id):
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_status_completed(self, *, originating_user_id):
        self.status = TASK_STATUSES.Completed
        self.has_unmerged_commits = False
        self.pr_is_open = False
        self.project.has_unmerged_commits = True
        # This will save the project, too:
        self.save(force_project_save=True)
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_pr_closed(self, *, originating_user_id):
        self.pr_is_open = False
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_pr_reopened(self, *, originating_user_id):
        self.pr_is_open = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def finalize_provision(self, *, originating_user_id):
        if self.status == TASK_STATUSES.Planned:
            self.status = TASK_STATUSES["In progress"]
            self.save()
            self.notify_changed(originating_user_id=originating_user_id)

    def finalize_commit_changes(self, *, originating_user_id):
        if self.status != TASK_STATUSES["In progress"]:
            self.status = TASK_STATUSES["In progress"]
            self.save()
            self.notify_changed(originating_user_id=originating_user_id)

    def add_commits(self, commits, sender):
        self.commits = [
            gh.normalize_commit(c, sender=sender) for c in commits
        ] + self.commits
        self.update_review_valid()
        self.save()
        # This comes from the GitHub hook, and so has no originating user:
        self.notify_changed(originating_user_id=None)

    def add_ms_git_sha(self, sha):
        self.ms_commits.append(sha)

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
        status=None,
        delete_org=False,
        org=None,
        originating_user_id
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
                org and org.task == self and org.org_type == SCRATCH_ORG_TYPES.QA
            )
            if delete_org and deletable_org:
                org.queue_delete(originating_user_id=originating_user_id)

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "project"),)


class ScratchOrg(PushMixin, HashIdMixin, TimestampsMixin, models.Model):
    task = models.ForeignKey(Task, on_delete=models.PROTECT)
    org_type = StringField(choices=SCRATCH_ORG_TYPES)
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    last_modified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    latest_commit = StringField(blank=True)
    latest_commit_url = models.URLField(blank=True)
    latest_commit_at = models.DateTimeField(null=True, blank=True)
    url = models.URLField(null=True, blank=True)
    last_checked_unsaved_changes_at = models.DateTimeField(null=True, blank=True)
    unsaved_changes = JSONField(default=dict, encoder=DjangoJSONEncoder, blank=True)
    latest_revision_numbers = JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )
    currently_refreshing_changes = models.BooleanField(default=False)
    currently_capturing_changes = models.BooleanField(default=False)
    currently_refreshing_org = models.BooleanField(default=False)
    config = JSONField(default=dict, encoder=DjangoJSONEncoder, blank=True)
    delete_queued_at = models.DateTimeField(null=True, blank=True)
    expiry_job_id = StringField(null=True, blank=True)
    owner_sf_username = StringField(blank=True)
    owner_gh_username = StringField(blank=True)
    has_been_visited = models.BooleanField(default=False)
    valid_target_directories = JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )

    def _build_message_extras(self):
        return {
            "model": {
                "task": str(self.task.id),
                "org_type": self.org_type,
                "id": str(self.id),
            }
        }

    def subscribable_by(self, user):  # pragma: nocover
        return True

    def save(self, *args, **kwargs):
        is_new = self.id is None
        self.clean_config()
        ret = super().save(*args, **kwargs)

        if is_new:
            self.queue_provision(originating_user_id=str(self.owner.id))

        return ret

    def clean_config(self):
        banned_keys = {"access_token"}
        self.config = {k: v for (k, v) in self.config.items() if k not in banned_keys}

    def mark_visited(self, *, originating_user_id):
        self.has_been_visited = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

    def get_refreshed_org_config(self):
        org_config = OrgConfig(self.config, "dev")
        info = jwt_session(
            settings.SF_CLIENT_ID,
            settings.SF_CLIENT_KEY,
            org_config.username,
            org_config.instance_url,
        )
        org_config.config.update(info)
        org_config._load_userinfo()
        org_config._load_orginfo()
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
        originating_user_id
    ):
        from .jobs import commit_changes_from_org_job

        self.currently_capturing_changes = True
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
        self.currently_capturing_changes = False
        self.save()
        if error is None:
            self.notify_changed(
                type_="SCRATCH_ORG_COMMIT_CHANGES",
                originating_user_id=originating_user_id,
            )
            self.task.finalize_commit_changes(originating_user_id=originating_user_id)
        else:
            self.notify_scratch_org_error(
                error=error,
                type_="SCRATCH_ORG_COMMIT_CHANGES_FAILED",
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


@receiver(user_logged_in)
def user_logged_in_handler(sender, *, user, **kwargs):
    user.queue_refresh_repositories()


def ensure_slug_handler(sender, *, created, instance, **kwargs):
    if created:
        instance.ensure_slug()


post_save.connect(ensure_slug_handler, sender=Repository)
post_save.connect(ensure_slug_handler, sender=Project)
post_save.connect(ensure_slug_handler, sender=Task)
