from django.urls import path
from rest_framework import routers

from .views import (
    AgreeToTosView,
    HookView,
    ProjectViewSet,
    RepositoryViewSet,
    ScratchOrgViewSet,
    TaskViewSet,
    UserDisconnectSFView,
    UserRefreshView,
    UserView,
    UserViewSet,
)

router = routers.DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("repositories", RepositoryViewSet, basename="repository")
router.register("projects", ProjectViewSet, basename="project")
router.register("tasks", TaskViewSet, basename="task")
router.register("scratch-orgs", ScratchOrgViewSet, basename="scratch-org")
urlpatterns = router.urls + [
    path("hook/", HookView.as_view(), name="hook"),
    path("user/", UserView.as_view(), name="user"),
    path("agree_to_tos/", AgreeToTosView.as_view(), name="agree-to-tos"),
    path("user/disconnect/", UserDisconnectSFView.as_view(), name="user-disconnect-sf"),
    path("user/refresh/", UserRefreshView.as_view(), name="user-refresh"),
]
