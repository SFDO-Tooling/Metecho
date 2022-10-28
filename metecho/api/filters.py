from django.db.models.query_utils import Q
from django.utils.translation import gettext_lazy as _
from django_filters import rest_framework as filters

from .models import Epic, GitHubIssue, Project, ScratchOrg, Task


def slug_is_active(queryset, name, value):
    return queryset.filter(**{f"{name}__slug": value, f"{name}__is_active": True})


class GitHubIssueFilter(filters.FilterSet):
    id = filters.CharFilter()
    search = filters.CharFilter(
        label="Search",
        method="do_search",
        help_text="Search in issue titles and numbers",
    )
    is_attached = filters.BooleanFilter(
        label="Is attached",
        method="filter_by_is_attached",
        help_text="Filter/exclude issues attached to Epics or Tasks",
    )

    class Meta:
        model = GitHubIssue
        # Filtering by ID allows the front-end to reuse existing logic
        fields = ("project", "id")

    def do_search(self, queryset, name, query):
        return queryset.filter(Q(title__icontains=query) | Q(number__icontains=query))

    def filter_by_is_attached(self, queryset, name, is_attached):
        lookup = queryset.exclude if is_attached else queryset.filter
        return lookup(epic__isnull=True, task__isnull=True)


class ProjectFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs", method=slug_is_active)

    class Meta:
        model = Project
        fields = ("slug",)


class EpicFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs", method=slug_is_active)

    class Meta:
        model = Epic
        fields = ("project", "slug")


class TaskFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs", method=slug_is_active)
    epic = filters.ModelChoiceFilter(queryset=Epic.objects.all(), null_label=_("None"))
    project = filters.ModelChoiceFilter(
        queryset=Project.objects.all(), method="filter_project"
    )
    assigned_to_me = filters.BooleanFilter(
        label="Assigned to me",
        method="filter_by_assigned",
        help_text="Filter/exclude tasks assigned to the current user",
    )

    class Meta:
        model = Task
        fields = ("epic", "project", "slug")

    def filter_project(self, queryset, name, project):
        return queryset.filter(Q(project=project) | Q(epic__project=project))

    def filter_by_assigned(self, queryset, name, assigned_to_me):
        gh_id = self.request.user.github_id
        lookup = queryset.filter if assigned_to_me else queryset.exclude
        return lookup(Q(assigned_dev_id=gh_id) | Q(assigned_qa_id=gh_id))


class ScratchOrgFilter(filters.FilterSet):
    class Meta:
        model = ScratchOrg
        fields = (
            "project",
            "epic",
            "task",
        )
