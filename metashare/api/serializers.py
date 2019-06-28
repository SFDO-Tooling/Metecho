from django.contrib.auth import get_user_model
from rest_framework import serializers

from .gh import validate_gh_url
from .models import Product

User = get_user_model()


class FullUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_staff")


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = serializers.CharField(source="description_markdown", allow_blank=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "repo_url",
            "description",
            "is_managed",
            "slug",
            "old_slugs",
        )
