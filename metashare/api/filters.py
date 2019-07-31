from django_filters import rest_framework as filters

from .models import Product, Project, Task


class ProductFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Product
        fields = ("slug",)


class ProjectFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Project
        fields = ("product", "slug")


class TaskFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Task
        fields = ("project", "slug")
