from django.urls import path
from rest_framework import routers

from .views import (
    ProjectViewSet,
    RepositoryViewSet,
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
urlpatterns = router.urls + [
    path("user/", UserView.as_view(), name="user"),
    path("user/disconnect/", UserDisconnectSFView.as_view(), name="user-disconnect-sf"),
    path("user/refresh/", UserRefreshView.as_view(), name="user-refresh"),
]
