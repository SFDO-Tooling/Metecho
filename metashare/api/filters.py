from django_filters import rest_framework as filters

from .models import Project, Repository, Task


class RepositoryFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Repository
        fields = ("slug",)


class ProjectFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Project
        fields = ("repository", "slug")


class TaskFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Task
        fields = ("project", "slug")
