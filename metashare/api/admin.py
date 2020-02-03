from django import forms
from django.contrib import admin
from django.contrib.postgres.fields import JSONField
from django.contrib.sites.admin import SiteAdmin
from django.contrib.sites.models import Site
from django.forms.widgets import Textarea

from .models import (
    GitHubRepository,
    Project,
    ProjectSlug,
    Repository,
    RepositorySlug,
    ScratchOrg,
    Task,
    TaskSlug,
    User,
)


class JSONWidget(Textarea):
    def value_from_datadict(self, data, files, name):
        value = data.get(name)
        return value if value else "{}"


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("username",)


@admin.register(Repository)
class RepositoryAdmin(admin.ModelAdmin):
    list_display = ("name", "repo_owner", "repo_name")


@admin.register(RepositorySlug)
class RepositorySlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(GitHubRepository)
class GitHubRepositoryAdmin(admin.ModelAdmin):
    list_display = ("repo_url", "user")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "repository")


@admin.register(ProjectSlug)
class ProjectSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "project")


@admin.register(TaskSlug)
class TaskSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(ScratchOrg)
class ScratchOrgAdmin(admin.ModelAdmin):
    list_display = ("owner", "org_type", "task")
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
                "Please enter a bare domain, with no scheme or path components."
            )
        return data


SiteAdmin.form = SiteAdminForm
