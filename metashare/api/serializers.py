from django.contrib.auth import get_user_model
from rest_framework import serializers

from .fields import MarkdownField
from .models import Product, Project

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


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    commit_message = MarkdownField(allow_blank=True)
    release_notes = MarkdownField(allow_blank=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "pr_url",
            "description",
            "commit_message",
            "release_notes",
            "slug",
            "old_slugs",
        )
