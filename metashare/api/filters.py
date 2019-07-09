from django_filters import rest_framework as filters

from .models import Product


class ProductFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="slugs__slug")

    class Meta:
        model = Product
        fields = ("slug",)
