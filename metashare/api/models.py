from allauth.account.signals import user_logged_in
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as BaseUserManager
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify
from model_utils import Choices

from sfdo_template_helpers.crypto import fernet_decrypt
from sfdo_template_helpers.fields import MarkdownField
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin

from . import gh
from . import model_mixins as mixins
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

    def subscribable_by(self, user):
        return self == user

    def _get_org_property(self, key):
        try:
            return self.social_account.extra_data[ORGANIZATION_DETAILS][key]
        except (AttributeError, KeyError):
            return None

    @property
    def org_id(self):
        return self._get_org_property("Id")

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
            return self.social_account.extra_data["instance_url"]
        except (AttributeError, KeyError):
            return None

    @property
    def token(self):
        account = self.social_account
        if account and account.socialtoken_set.exists():
            token = self.social_account.socialtoken_set.first()
            return (fernet_decrypt(token.token), fernet_decrypt(token.token_secret))
        return (None, None)

    @property
    def social_account(self):
        return self.socialaccount_set.first()

    @property
    def valid_token_for(self):
        if all(self.token) and self.org_id:
            return self.org_id
        return None


class ProductSlug(AbstractSlug):
    parent = models.ForeignKey(
        "Product", on_delete=models.PROTECT, related_name="slugs"
    )


class Product(mixins.HashIdMixin, mixins.TimestampsMixin, SlugMixin, models.Model):
    name = models.CharField(max_length=50, unique=True)
    repo_url = models.URLField(unique=True, validators=[gh.validate_gh_url])
    description = MarkdownField(blank=True, property_suffix="_markdown")
    is_managed = models.BooleanField(default=False)

    slug_class = ProductSlug

    def __str__(self):
        return self.name

    class Meta:
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
    name = models.CharField(max_length=50)
    description = MarkdownField(blank=True, property_suffix="_markdown")
    branch_name = models.SlugField(max_length=50)

    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="projects"
    )

    slug_class = ProjectSlug

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.branch_name:
            self.branch_name = slugify(self.name)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "product"), ("branch_name", "product"))


class TaskSlug(AbstractSlug):
    parent = models.ForeignKey("Task", on_delete=models.PROTECT, related_name="slugs")


class Task(mixins.HashIdMixin, mixins.TimestampsMixin, SlugMixin, models.Model):
    name = models.CharField(max_length=50)
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="tasks")
    description = MarkdownField(blank=True, property_suffix="_markdown")
    assignee = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="assigned_tasks"
    )

    slug_class = TaskSlug

    class Meta:
        ordering = ("-created_at", "name")
        unique_together = (("name", "project"),)


@receiver(user_logged_in)
def user_logged_in_handler(sender, *, user, **kwargs):
    user.refresh_repositories()


def ensure_slug_handler(sender, *, created, instance, **kwargs):
    if created:
        instance.ensure_slug()


post_save.connect(ensure_slug_handler, sender=Product)
post_save.connect(ensure_slug_handler, sender=Project)
post_save.connect(ensure_slug_handler, sender=Task)
