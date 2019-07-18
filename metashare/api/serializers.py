from django.contrib.auth import get_user_model
from rest_framework import serializers

from . import gh
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
    description = MarkdownField(allow_blank=True)

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
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), pk_field=serializers.CharField()
    )
    branch_url = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "slug",
            "old_slugs",
            "product",
            "branch_url",
        )

    def get_branch_url(self, obj):
        return f"{obj.product.repo_url}/tree/{obj.branch_name}"

    def create(self, validated_data):
        instance = super().create(validated_data)
        gh.create_branch(
            self.context["request"].user,
            instance.product.repo_url,
            instance.branch_name,
        )
        return instance
