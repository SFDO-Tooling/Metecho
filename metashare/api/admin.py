from django.contrib import admin
from django.contrib.postgres.fields import ArrayField
from django.forms.widgets import CheckboxSelectMultiple

from .models import LICENSES, Product, User


class ArrayFieldCheckboxSelectMultiple(CheckboxSelectMultiple):
    def format_value(self, value):
        if isinstance(value, str):
            value = value.split(",")
        return super().format_value(value)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("username",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    prepopulated_fields = {"repo_name": ("name",)}
    formfield_overrides = {
        ArrayField: {"widget": ArrayFieldCheckboxSelectMultiple(choices=LICENSES)}
    }
