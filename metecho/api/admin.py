from django import forms
from django.contrib import admin
from django.contrib.postgres.fields import JSONField
from django.contrib.sites.admin import SiteAdmin
from django.contrib.sites.models import Site
from django.forms.widgets import Textarea
from django.utils.translation import gettext_lazy as _
from github3.exceptions import NotFoundError
from parler.admin import TranslatableAdmin

from . import gh
from .models import (
    GitHubRepository,
    Project,
    ProjectSlug,
    Repository,
    RepositorySlug,
    ScratchOrg,
    SiteProfile,
    Task,
    TaskSlug,
    User,
)


class RepositoryForm(forms.ModelForm):
    class Meta:
        model = Repository
        exclude = ()

    def clean(self):
        cleaned_data = super().clean()
        repo_name = cleaned_data.get("repo_name")
        repo_owner = cleaned_data.get("repo_owner")

        try:
            gh.get_repo_info(None, repo_owner=repo_owner, repo_name=repo_name)
        except NotFoundError:
            raise forms.ValidationError(
                _("No repository with this name and owner exists.")
            )
        try:
            app = gh.gh_as_app()
            app.app_installation_for_repository(repo_owner, repo_name)
        except NotFoundError:
            raise forms.ValidationError(
                _("The associated GitHub app is not installed for that repository.")
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


@admin.register(Repository)
class RepositoryAdmin(admin.ModelAdmin):
    form = RepositoryForm
    list_display = ("name", "repo_owner", "repo_name")


@admin.register(RepositorySlug)
class RepositorySlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(GitHubRepository)
class GitHubRepositoryAdmin(admin.ModelAdmin):
    list_display = ("repo_url", "user")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "repository", "deleted_at")
    list_filter = (SoftDeletedListFilter,)


@admin.register(ProjectSlug)
class ProjectSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "project", "deleted_at")
    list_filter = (SoftDeletedListFilter,)


@admin.register(TaskSlug)
class TaskSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(ScratchOrg)
class ScratchOrgAdmin(admin.ModelAdmin):
    list_display = ("owner", "org_type", "task", "deleted_at")
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
