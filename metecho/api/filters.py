from django.db.models.query_utils import Q
from django_filters import rest_framework as filters

from .models import Epic, GitHubIssue, Project, ScratchOrg, Task


def slug_is_active(queryset, name, value):
    return queryset.filter(**{f"{name}__slug": value, f"{name}__is_active": True})


class GitHubIssueFilter(filters.FilterSet):
    search = filters.CharFilter(label="Search", method="do_search")
    is_attached = filters.BooleanFilter(
        label="Is attached", method="filter_by_is_attached"
    )

    class Meta:
        model = GitHubIssue
        fields = ("project",)

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

    class Meta:
        model = Task
        fields = ("epic", "slug")


class ScratchOrgFilter(filters.FilterSet):
    class Meta:
        model = ScratchOrg
        fields = (
            "project",
            "epic",
            "task",
        )
