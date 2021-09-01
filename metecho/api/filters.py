from django.db.models.query_utils import Q
from django.utils.translation import gettext_lazy as _
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
    epic = filters.ModelChoiceFilter(queryset=Epic.objects.all(), null_label=_("None"))
    project = filters.ModelChoiceFilter(
        queryset=Project.objects.all(), method="filter_project"
    )

    class Meta:
        model = Task
        fields = ("epic", "project", "slug")

    def filter_project(self, queryset, name, project):
        return queryset.filter(Q(project=project) | Q(epic__project=project))


class ScratchOrgFilter(filters.FilterSet):
    class Meta:
        model = ScratchOrg
        fields = (
            "project",
            "epic",
            "task",
        )
