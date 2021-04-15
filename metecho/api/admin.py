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
    search_fields = ("username",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectForm
    list_display = ("name", "repo_owner", "repo_name", "created_at")


@admin.register(ProjectSlug)
class ProjectSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(GitHubRepository)
class GitHubRepositoryAdmin(admin.ModelAdmin):
    list_display = ("repo_url", "user")


@admin.register(Epic)
class EpicAdmin(admin.ModelAdmin):
    list_display = ("name", "project", "created_at", "deleted_at")
    list_filter = (SoftDeletedListFilter,)


@admin.register(EpicSlug)
class EpicSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "epic", "created_at", "deleted_at")
    list_filter = (SoftDeletedListFilter,)
    fields = (
        ("name", "epic"),
        "description",
        ("branch_name", "org_config_name"),
        "commits",
        "origin_sha",
        "metecho_commits",
        "has_unmerged_commits",
        ("pr_number", "pr_is_open"),
        ("review_submitted_at", "review_valid", "review_status", "review_sha"),
        ("reviewers", "get_all_users_in_commits"),
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
    list_display = ("slug", "parent")


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
    list_filter = (SoftDeletedListFilter,)
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
