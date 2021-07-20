from django import forms
from django.contrib import admin
from django.contrib.sites.admin import SiteAdmin
from django.contrib.sites.models import Site
from django.db.models import JSONField
from django.forms.widgets import Textarea
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from . import gh
from .models import (
    Epic,
    EpicSlug,
    GitHubRepository,
    Project,
    ProjectSlug,
    ScratchOrg,
    SiteProfile,
    Task,
    TaskSlug,
    User,
)


class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        exclude = ()

    def clean(self):
        cleaned_data = super().clean()
        repo_name = cleaned_data.get("repo_name")
        repo_owner = cleaned_data.get("repo_owner")

        # Make sure we can access the repository
        try:
            gh.get_repo_info(None, repo_owner=repo_owner, repo_name=repo_name)
        except Exception:
            raise forms.ValidationError(
                _(
                    f"Could not access {repo_owner}/{repo_name} using GitHub app. "
                    "Does the Metecho app need to be installed for this repository?"
                )
            )


class JSONWidget(Textarea):
    def value_from_datadict(self, data, files, name):
        value = data.get(name)
        return value if value else "{}"


class SoftDeletedListFilter(admin.SimpleListFilter):
    title = _("deleted")
    parameter_name = "deleted_at"

    def lookups(self, request, model_admin):
        return (("true", _("Deleted")),)

    def queryset(self, request, queryset):
        if self.value() == "true":
            return queryset.filter(deleted_at__isnull=False)
        return queryset.filter(deleted_at__isnull=True)

    def choices(self, changelist):
        yield {
            "selected": self.value() is None,
            "query_string": changelist.get_query_string(remove=[self.parameter_name]),
            "display": _("Active"),
        }
        for lookup, title in self.lookup_choices:
            yield {
                "selected": self.value() == str(lookup),
                "query_string": changelist.get_query_string(
                    {self.parameter_name: lookup}
                ),
                "display": title,
            }


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email")
    filter_horizontal = ("groups", "user_permissions")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectForm
    list_display = ("name", "repo_owner", "repo_name", "created_at")
    search_fields = ("name", "repo_owner", "repo_name")

    def save_model(self, request, obj, form, change):
        if not obj.repo_image_url:
            from .jobs import get_social_image_job

            get_social_image_job.delay(project=obj)
        return super().save_model(request, obj, form, change)


@admin.register(ProjectSlug)
class ProjectSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent", "is_active")
    list_filter = ("is_active",)
    list_select_related = ("parent",)
    search_fields = ("slug",)


@admin.register(GitHubRepository)
class GitHubRepositoryAdmin(admin.ModelAdmin):
    list_display = ("repo_url", "user")
    list_filter = ("user",)
    list_select_related = ("user",)
    search_fields = ("repo_url", "repo_id")


@admin.register(Epic)
class EpicAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "project", "created_at", "deleted_at")
    list_filter = (SoftDeletedListFilter, "status", "project")
    list_select_related = ("project",)
    search_fields = ("name", "branch_name")


@admin.register(EpicSlug)
class EpicSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent", "is_active")
    list_filter = ("is_active",)
    list_select_related = ("parent",)
    search_fields = ("slug",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "epic", "created_at", "deleted_at")
    list_filter = (SoftDeletedListFilter, "status", "epic__project")
    search_fields = ("name", "epic__name")
    fields = (
        "name",
        ("project", "epic"),
        "description",
        ("branch_name", "org_config_name"),
        ("commits", "get_all_users_in_commits"),
        "origin_sha",
        "metecho_commits",
        "has_unmerged_commits",
        ("currently_creating_branch", "currently_creating_pr"),
        ("pr_is_open", "pr_number"),
        "currently_submitting_review",
        "review_submitted_at",
        ("review_valid", "review_status", "review_sha"),
        ("reviewers"),
        "status",
        ("assigned_dev", "assigned_qa"),
    )
    readonly_fields = (
        "commits",
        "reviewers",
        "get_all_users_in_commits",
    )


@admin.register(TaskSlug)
class TaskSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent", "is_active")
    list_filter = ("is_active",)
    list_select_related = ("parent",)
    search_fields = ("slug",)


@admin.register(ScratchOrg)
class ScratchOrgAdmin(admin.ModelAdmin):
    list_display = (
        "owner",
        "org_type",
        "project",
        "epic",
        "task",
        "created_at",
        "deleted_at",
    )
    list_filter = (SoftDeletedListFilter, "owner", "org_type")
    search_fields = ("project__name", "epic__name", "task__name")
    formfield_overrides = {JSONField: {"widget": JSONWidget}}


class SiteAdminForm(forms.ModelForm):
    class Meta:
        model = Site
        fields = (
            "name",
            "domain",
        )

    def clean_domain(self):
        data = self.cleaned_data["domain"]
        if "/" in data:
            raise forms.ValidationError(
                _("Please enter a bare domain, with no scheme or path components.")
            )
        return data


SiteAdmin.form = SiteAdminForm


@admin.register(SiteProfile)
class SiteProfileAdmin(TranslatableAdmin):
    list_display = ("name", "site")
