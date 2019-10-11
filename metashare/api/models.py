import requests
from allauth.account.signals import user_logged_in
from asgiref.sync import async_to_sync
from cryptography.fernet import InvalidToken
from cumulusci.core.config import OrgConfig
from cumulusci.oauth.salesforce import jwt_session
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as BaseUserManager
from django.contrib.postgres.fields import JSONField
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.functional import cached_property
from model_utils import Choices

from sfdo_template_helpers.crypto import fernet_decrypt
from sfdo_template_helpers.fields import MarkdownField, StringField
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin

from . import gh
from . import model_mixins as mixins
from . import push
from .constants import ORGANIZATION_DETAILS

ORG_TYPES = Choices("Production", "Scratch", "Sandbox", "Developer")


class UserQuerySet(models.QuerySet):
    pass


class UserManager(BaseUserManager.from_queryset(UserQuerySet)):
    pass


class User(mixins.HashIdMixin, AbstractUser):
    objects = UserManager()

    def refresh_repositories(self):
        repos = gh.get_all_org_repos(self)
        GitHubRepository.objects.filter(user=self).delete()
        GitHubRepository.objects.bulk_create(
            [GitHubRepository(user=self, url=repo) for repo in repos]
        )
        self.notify_repositories_updated()

    def notify_repositories_updated(self):
        message = {"type": "USER_REPOS_REFRESH"}
        async_to_sync(push.push_message_about_instance)(self, message)

    def invalidate_salesforce_credentials(self):
        self.socialaccount_set.filter(provider__startswith="salesforce-").delete()

    def subscribable_by(self, user):
        return self == user

    def _get_org_property(self, key):
        try:
            return self.salesforce_account.extra_data[ORGANIZATION_DETAILS][key]
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
        return self._get_org_property("Name")

    @property
    def org_type(self):
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
    def sf_username(self):
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
    def salesforce_account(self):
        return self.socialaccount_set.filter(provider__startswith="salesforce-").first()

    @property
    def valid_token_for(self):
        if all(self.sf_token) and self.org_id:
            return self.org_id
        return None

    @cached_property
    def is_devhub_enabled(self):
        # We can shortcut and avoid making an HTTP request in some cases:
        if self.full_org_type in (ORG_TYPES.Scratch, ORG_TYPES.Sandbox):
            return None

        token, _ = self.sf_token
        if token is None:
            return None
        instance_url = self.salesforce_account.extra_data["instance_url"]
        url = f"{instance_url}/services/data/v45.0/sobjects/ScratchOrgInfo"
        resp = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 200:
            return True
        if resp.status_code == 404:
            return False
        return None


class RepositorySlug(AbstractSlug):
    parent = models.ForeignKey(
        "Repository", on_delete=models.PROTECT, related_name="slugs"
    )


class Repository(mixins.HashIdMixin, mixins.TimestampsMixin, SlugMixin, models.Model):
    name = StringField(unique=True)
    repo_url = models.URLField(unique=True, validators=[gh.validate_gh_url])
    description = MarkdownField(blank=True, property_suffix="_markdown")
    is_managed = models.BooleanField(default=False)

    slug_class = RepositorySlug

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "repositories"
        ordering = ("name",)


class GitHubRepository(mixins.HashIdMixin, models.Model):
    url = models.URLField()
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="repositories"
    )

    class Meta:
        verbose_name_plural = "GitHub repositories"

    def __str__(self):
        return self.url


class ProjectSlug(AbstractSlug):
    parent = models.ForeignKey(
        "Project", on_delete=models.PROTECT, related_name="slugs"
    )


class Project(mixins.HashIdMixin, mixins.TimestampsMixin, SlugMixin, models.Model):
    name = StringField()
    description = MarkdownField(blank=True, property_suffix="_markdown")
    branch_name = models.SlugField(max_length=100, null=True, blank=True)

    repository = models.ForeignKey(
        Repository, on_delete=models.PROTECT, related_name="projects"
    )

    slug_class = ProjectSlug

    def __str__(self):
        return self.name

    def subscribable_by(self, user):  # pragma: nocover
        return True

    def finalize_branch_update(self):
        from .serializers import ProjectSerializer

        self.save()
        payload = ProjectSerializer(self).data
        message = {"type": "PROJECT_UPDATE", "payload": payload}
        async_to_sync(push.push_message_about_instance)(self, message)

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "repository"),)


class TaskSlug(AbstractSlug):
    parent = models.ForeignKey("Task", on_delete=models.PROTECT, related_name="slugs")


class Task(mixins.HashIdMixin, mixins.TimestampsMixin, SlugMixin, models.Model):
    name = StringField()
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="tasks")
    description = MarkdownField(blank=True, property_suffix="_markdown")
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    branch_name = models.SlugField(max_length=100, null=True, blank=True)

    slug_class = TaskSlug

    def __str__(self):
        return self.name

    def subscribable_by(self, user):  # pragma: nocover
        return True

    def finalize_branch_update(self):
        from .serializers import TaskSerializer

        self.save()
        payload = TaskSerializer(self).data
        message = {"type": "TASK_UPDATE", "payload": payload}
        async_to_sync(push.push_message_about_instance)(self, message)

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "project"),)


SCRATCH_ORG_TYPES = Choices("Dev", "QA")


class ScratchOrg(mixins.HashIdMixin, mixins.TimestampsMixin, models.Model):
    task = models.ForeignKey(Task, on_delete=models.PROTECT)
    org_type = StringField(choices=SCRATCH_ORG_TYPES)
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    last_modified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    latest_commit = StringField(blank=True)
    latest_commit_url = models.URLField(blank=True)
    latest_commit_at = models.DateTimeField(null=True, blank=True)
    url = models.URLField(null=True, blank=True)
    unsaved_changes = JSONField(default=dict, encoder=DjangoJSONEncoder, blank=True)
    latest_revision_numbers = JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )
    currently_refreshing_changes = models.BooleanField(default=False)
    currently_capturing_changes = models.BooleanField(default=False)
    config = JSONField(default=dict, encoder=DjangoJSONEncoder, blank=True)
    login_url = models.URLField(null=True, blank=True)
    delete_queued_at = models.DateTimeField(null=True, blank=True)

    def subscribable_by(self, user):  # pragma: nocover
        return True

    def save(self, *args, **kwargs):
        is_new = self.id is None
        ret = super().save(*args, **kwargs)

        if is_new:
            self.queue_provision()

        return ret

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

    def notify_changed(self):
        from .serializers import ScratchOrgSerializer

        payload = ScratchOrgSerializer(self).data
        message = {"type": "SCRATCH_ORG_UPDATE", "payload": payload}

        async_to_sync(push.push_message_about_instance)(self, message)

    def queue_delete(self):
        from .jobs import delete_scratch_org_job

        self.delete_queued_at = timezone.now()
        self.save()
        self.notify_changed()

        delete_scratch_org_job.delay(self)

    def finalize_delete(self):
        from .serializers import ScratchOrgSerializer

        payload = ScratchOrgSerializer(self).data
        message = {"type": "SCRATCH_ORG_DELETE", "payload": payload}

        async_to_sync(push.push_message_about_instance)(self, message)

    def delete(self, *args, **kwargs):
        # If the scratch org has no URL, it has not really been created
        # on Salesforce, and therefore we don't need to notify of its
        # destruction; this should only happen when it is destroyed
        # during provisioning.
        if self.url:
            self.finalize_delete()
        super().delete(*args, **kwargs)

    def queue_provision(self):
        from .jobs import create_branches_on_github_then_create_scratch_org_job

        create_branches_on_github_then_create_scratch_org_job.delay(
            project=self.task.project,
            repo_url=self.task.project.repository.repo_url,
            scratch_org=self,
            task=self.task,
            user=self.owner,
        )

    def finalize_provision(self, error=None):
        from .serializers import ScratchOrgSerializer

        if error is None:
            self.save()
            async_to_sync(push.push_message_about_instance)(
                self,
                {
                    "type": "SCRATCH_ORG_PROVISION",
                    "payload": ScratchOrgSerializer(self).data,
                },
            )
        else:
            async_to_sync(push.report_scratch_org_error)(
                self, error, "SCRATCH_ORG_PROVISION_FAILED"
            )
            self.delete()

    def queue_get_unsaved_changes(self):
        from .jobs import get_unsaved_changes_job

        self.currently_refreshing_changes = True
        self.save()
        self.notify_changed()

        get_unsaved_changes_job.delay(self)

    def finalize_get_unsaved_changes(self, error=None):
        self.currently_refreshing_changes = False
        if error is None:
            self.save()
            self.notify_changed()
        else:
            self.unsaved_changes = {}
            self.save()
            async_to_sync(push.report_scratch_org_error)(
                self, error, "SCRATCH_ORG_FETCH_CHANGES_FAILED"
            )

    def queue_commit_changes(self, user, desired_changes, commit_message):
        from .jobs import commit_changes_from_org_job

        self.currently_capturing_changes = True
        self.save()
        self.notify_changed()

        commit_changes_from_org_job.delay(self, user, desired_changes, commit_message)

    def finalize_commit_changes(self, error=None):
        from .serializers import ScratchOrgSerializer

        self.currently_capturing_changes = False
        self.save()
        if error is None:
            async_to_sync(push.push_message_about_instance)(
                self,
                {
                    "type": "SCRATCH_ORG_COMMIT_CHANGES",
                    "payload": ScratchOrgSerializer(self).data,
                },
            )
        else:
            async_to_sync(push.report_scratch_org_error)(
                self, error, "SCRATCH_ORG_COMMIT_CHANGES_FAILED"
            )


@receiver(user_logged_in)
def user_logged_in_handler(sender, *, user, **kwargs):
    from .jobs import refresh_github_repositories_for_user_job

    refresh_github_repositories_for_user_job.delay(user)


def ensure_slug_handler(sender, *, created, instance, **kwargs):
    if created:
        instance.ensure_slug()


post_save.connect(ensure_slug_handler, sender=Repository)
post_save.connect(ensure_slug_handler, sender=Project)
post_save.connect(ensure_slug_handler, sender=Task)
