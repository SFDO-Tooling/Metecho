from django.urls import path
from rest_framework import routers

from .views import (
    ProductViewSet,
    ProjectViewSet,
    TaskViewSet,
    UserRefreshView,
    UserView,
    UserViewSet,
)

router = routers.DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("products", ProductViewSet, basename="product")
router.register("projects", ProjectViewSet, basename="project")
router.register("tasks", TaskViewSet, basename="task")
urlpatterns = router.urls + [
    path("user/", UserView.as_view(), name="user"),
    path("user/refresh/", UserRefreshView.as_view(), name="user-refresh"),
]
