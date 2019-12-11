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
from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.functional import cached_property
from model_utils import Choices
from sfdo_template_helpers.crypto import fernet_decrypt
from sfdo_template_helpers.fields import MarkdownField, StringField
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin
from simple_salesforce.exceptions import SalesforceError

from . import gh, push
from .constants import ORGANIZATION_DETAILS
from .model_mixins import HashIdMixin, PopulateRepoIdMixin, PushMixin, TimestampsMixin
from .sf_run_flow import get_devhub_api
from .validators import validate_unicode_branch

ORG_TYPES = Choices("Production", "Scratch", "Sandbox", "Developer")


class UserQuerySet(models.QuerySet):
    pass


class UserManager(BaseUserManager.from_queryset(UserQuerySet)):
    pass


class User(HashIdMixin, AbstractUser):
    objects = UserManager()
    currently_fetching_repos = models.BooleanField(default=False)

    def refresh_repositories(self):
        repos = gh.get_all_org_repos(self)
        GitHubRepository.objects.filter(user=self).delete()
        GitHubRepository.objects.bulk_create(
            [
                GitHubRepository(user=self, repo_id=repo.id, repo_url=repo.html_url)
                for repo in repos
            ]
        )
        self.currently_fetching_repos = False
        self.save()
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
    PopulateRepoIdMixin, HashIdMixin, TimestampsMixin, SlugMixin, models.Model
):
    repo_owner = StringField()
    repo_name = StringField()
    name = StringField(unique=True)
    description = MarkdownField(blank=True, property_suffix="_markdown")
    is_managed = models.BooleanField(default=False)
    repo_id = models.IntegerField(null=True, blank=True, unique=True)

    slug_class = RepositorySlug

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "repositories"
        ordering = ("name",)
        unique_together = (("repo_owner", "repo_name"),)

    def get_a_matching_user(self):
        github_repository = GitHubRepository.objects.filter(
            repo_id=self.repo_id
        ).first()

        if github_repository:
            return github_repository.user

        return None

    def refresh_commits(self, user):
        from .jobs import refresh_commits_job

        refresh_commits_job.delay(user=user, repository=self)

    @transaction.atomic
    def add_commits(self, *, commits, ref, user):
        branch_prefix = "refs/heads/"
        if not ref.startswith(branch_prefix):
            self.refresh_commits(user)
        else:
            prefix_len = len(branch_prefix)
            ref = ref[prefix_len:]
            matching_projects = self.projects.filter(branch_name=ref)
            matching_tasks = Task.objects.filter(
                branch_name=ref, project__repository=self
            )
            for project in matching_projects:
                project.commits += commits
                project.save()

            for task in matching_tasks:
                task.commits += commits
                task.save()


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


class Project(PushMixin, HashIdMixin, TimestampsMixin, SlugMixin, models.Model):
    name = StringField()
    description = MarkdownField(blank=True, property_suffix="_markdown")
    branch_name = models.CharField(
        max_length=100, blank=True, null=True, validators=[validate_unicode_branch]
    )
    commits = JSONField(default=list)

    repository = models.ForeignKey(
        Repository, on_delete=models.PROTECT, related_name="projects"
    )

    slug_class = ProjectSlug

    def __str__(self):
        return self.name

    def subscribable_by(self, user):  # pragma: nocover
        return True

    # begin PushMixin configuration:
    push_update_type = "PROJECT_UPDATE"
    push_error_type = None

    def get_serialized_representation(self):
        from .serializers import ProjectSerializer

        return ProjectSerializer(self).data

    # end PushMixin configuration

    def finalize_project_update(self):
        self.save()
        self.notify_changed()

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "repository"),)


class TaskSlug(AbstractSlug):
    parent = models.ForeignKey("Task", on_delete=models.PROTECT, related_name="slugs")


class Task(PushMixin, HashIdMixin, TimestampsMixin, SlugMixin, models.Model):
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
    branch_name = models.CharField(
        max_length=100, null=True, blank=True, validators=[validate_unicode_branch],
    )
    commits = JSONField(default=list)
    has_unmerged_commits = models.BooleanField(default=False)
    currently_creating_pr = models.BooleanField(default=False)
    pr_number = models.IntegerField(null=True, blank=True)

    slug_class = TaskSlug

    def __str__(self):
        return self.name

    def subscribable_by(self, user):  # pragma: nocover
        return True

    # begin PushMixin configuration:
    push_update_type = "TASK_UPDATE"
    push_error_type = "TASK_CREATE_PR_FAILED"

    def get_serialized_representation(self):
        from .serializers import TaskSerializer

        return TaskSerializer(self).data

    # end PushMixin configuration

    def finalize_task_update(self):
        self.save()
        self.notify_changed()

    def queue_create_pr(
        self, user, *, title, critical_changes, additional_changes, issues, notes
    ):
        from .jobs import create_pr_job

        self.currently_creating_pr = True
        self.save()
        self.notify_changed()

        create_pr_job.delay(
            self,
            user,
            title=title,
            critical_changes=critical_changes,
            additional_changes=additional_changes,
            issues=issues,
            notes=notes,
        )

    def finalize_create_pr(self, error=None):
        self.currently_creating_pr = False
        self.save()
        if error is None:
            self.notify_changed("TASK_CREATE_PR")
        else:
            self.notify_error(error)

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "project"),)


SCRATCH_ORG_TYPES = Choices("Dev", "QA")


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
    unsaved_changes = JSONField(default=dict, encoder=DjangoJSONEncoder, blank=True)
    latest_revision_numbers = JSONField(
        default=dict, encoder=DjangoJSONEncoder, blank=True
    )
    currently_refreshing_changes = models.BooleanField(default=False)
    currently_capturing_changes = models.BooleanField(default=False)
    config = JSONField(default=dict, encoder=DjangoJSONEncoder, blank=True)
    delete_queued_at = models.DateTimeField(null=True, blank=True)
    owner_sf_id = StringField(blank=True)

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

    # begin PushMixin configuration:
    push_update_type = "SCRATCH_ORG_UPDATE"
    push_error_type = "SCRATCH_ORG_ERROR"

    def get_serialized_representation(self):
        from .serializers import ScratchOrgSerializer

        return ScratchOrgSerializer(self).data

    # end PushMixin configuration

    def queue_delete(self):
        from .jobs import delete_scratch_org_job

        # If the scratch org has no `last_modified_at`, it did not
        # successfully complete the initial flow run on Salesforce, and
        # therefore we don't need to notify of its destruction; this
        # should only happen when it is destroyed during the initial
        # flow run.
        if self.last_modified_at:
            self.delete_queued_at = timezone.now()
            self.save()
            self.notify_changed()

        delete_scratch_org_job.delay(self)

    def finalize_delete(self):
        self.notify_changed("SCRATCH_ORG_DELETE")

    def delete(self, *args, should_finalize=True, **kwargs):
        # If the scratch org has no `last_modified_at`, it did not
        # successfully complete the initial flow run on Salesforce, and
        # therefore we don't need to notify of its destruction; this
        # should only happen when it is destroyed during provisioning or
        # the initial flow run.
        if self.last_modified_at and should_finalize:
            self.finalize_delete()
        super().delete(*args, **kwargs)

    def queue_provision(self):
        from .jobs import create_branches_on_github_then_create_scratch_org_job

        create_branches_on_github_then_create_scratch_org_job.delay(scratch_org=self)

    def finalize_provision(self, error=None):
        if error is None:
            self.save()
            self.notify_changed("SCRATCH_ORG_PROVISION")
        else:
            self.notify_scratch_org_error(error, "SCRATCH_ORG_PROVISION_FAILED")
            # If the scratch org has already been created on Salesforce,
            # we need to delete it there as well.
            if self.url:
                self.queue_delete()
            else:
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
            self.notify_scratch_org_error(error, "SCRATCH_ORG_FETCH_CHANGES_FAILED")

    def queue_commit_changes(self, user, desired_changes, commit_message):
        from .jobs import commit_changes_from_org_job

        self.currently_capturing_changes = True
        self.save()
        self.notify_changed()

        commit_changes_from_org_job.delay(self, user, desired_changes, commit_message)

    def finalize_commit_changes(self, error=None):
        self.currently_capturing_changes = False
        self.save()
        if error is None:
            self.notify_changed("SCRATCH_ORG_COMMIT_CHANGES")
        else:
            self.notify_scratch_org_error(error, "SCRATCH_ORG_COMMIT_CHANGES_FAILED")

    def remove_scratch_org(self, error):
        self.notify_error(error, "SCRATCH_ORG_REMOVE")
        # set should_finalize=False to avoid accidentally sending a
        # SCRATCH_ORG_DELETE event:
        self.delete(should_finalize=False)


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
