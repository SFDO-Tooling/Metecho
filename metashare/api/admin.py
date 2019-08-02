from django.contrib import admin

from .models import GitHubRepository, Product, ProductSlug, Project, ProjectSlug, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("username",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "repo_url")


@admin.register(ProductSlug)
class ProductSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(GitHubRepository)
class GitHubRepositoryAdmin(admin.ModelAdmin):
    list_display = ("url", "user")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "product")


@admin.register(ProjectSlug)
class ProjectSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")
