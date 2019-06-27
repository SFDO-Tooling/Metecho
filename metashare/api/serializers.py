from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Product

User = get_user_model()


class FullUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    repositories = serializers.StringRelatedField(many=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_staff", "repositories")


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "repo_name",
            "version_number",
            "description",
            "is_managed",
        )
