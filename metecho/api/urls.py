from django.conf import settings
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView
from rest_framework import routers

from .views import (
    CurrentUserViewSet,
    EpicViewSet,
    GitHubIssueViewSet,
    GitHubOrganizationViewSet,
    HookView,
    ProjectDependencyViewSet,
    ProjectViewSet,
    ScratchOrgViewSet,
    TaskViewSet,
    UserViewSet,
)

router = routers.DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("user", CurrentUserViewSet, basename="current-user")
router.register("issues", GitHubIssueViewSet, basename="issue")
router.register("projects", ProjectViewSet, basename="project")
router.register("epics", EpicViewSet, basename="epic")
router.register("tasks", TaskViewSet, basename="task")
router.register("scratch-orgs", ScratchOrgViewSet, basename="scratch-org")
router.register("organizations", GitHubOrganizationViewSet, basename="organization")
router.register("dependencies", ProjectDependencyViewSet, basename="dependency")
urlpatterns = router.urls + [
    path("hook/", HookView.as_view(), name="hook"),
    path(  # Current user detail action without PK
        "user/",
        CurrentUserViewSet.as_view({"get": "get"}),
        name="current-user-detail",
    ),
]

if settings.API_DOCS_ENABLED:  # pragma: nocover
    urlpatterns += [
        path("schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "schema/redoc/",
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        ),
    ]
