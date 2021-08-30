from django_filters import rest_framework as filters

from .models import Epic, Project, ScratchOrg, Task


def slug_is_active(queryset, name, value):
    return queryset.filter(**{f"{name}__slug": value, f"{name}__is_active": True})


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
        fields = ("epic", "epic__project", "slug")


class ScratchOrgFilter(filters.FilterSet):
    class Meta:
        model = ScratchOrg
        fields = (
            "project",
            "epic",
            "task",
        )
