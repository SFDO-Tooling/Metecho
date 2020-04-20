from django import forms
from django.contrib import admin
from django.contrib.postgres.fields import JSONField
from django.contrib.sites.admin import SiteAdmin
from django.contrib.sites.models import Site
from django.forms.widgets import Textarea
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

        # Make sure we can access the repository
        try:
            gh.get_repo_info(None, repo_owner=repo_owner, repo_name=repo_name)
        except Exception:
            raise forms.ValidationError(
                f"Could not access {repo_owner}/{repo_name} using GitHub app. "
                "Does the Metecho app need to be installed for this repository?"
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


@admin.register(SiteProfile)
class SiteProfileAdmin(TranslatableAdmin):
    list_display = ("name", "site")
