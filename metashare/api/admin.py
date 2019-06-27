from django.contrib import admin

from .models import Product, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("username",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
