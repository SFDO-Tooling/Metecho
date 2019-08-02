from django_filters import rest_framework as filters

from .models import Product, Project


class ProductFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Product
        fields = ("slug",)


class ProjectFilter(filters.FilterSet):
    class Meta:
        model = Project
        fields = ("product",)
