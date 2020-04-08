from django_filters import rest_framework as filters

from .models import Project, Repository, ScratchOrg, Task


def slug_is_active(queryset, name, value):
    return queryset.filter(**{f"{name}__slug": value, f"{name}__is_active": True})


class RepositoryFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs", method=slug_is_active)

    class Meta:
        model = Repository
        fields = ("slug",)


class ProjectFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs", method=slug_is_active)

    class Meta:
        model = Project
        fields = ("repository", "slug")


class TaskFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs", method=slug_is_active)

    class Meta:
        model = Task
        fields = ("project", "slug")


class ScratchOrgFilter(filters.FilterSet):
    class Meta:
        model = ScratchOrg
        fields = ("task",)
