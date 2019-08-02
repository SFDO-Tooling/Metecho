from django.urls import path
from rest_framework import routers

from .views import ProductViewSet, ProjectViewSet, UserRefreshView, UserView

router = routers.DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("projects", ProjectViewSet, basename="project")
urlpatterns = router.urls + [
    path("user/", UserView.as_view(), name="user"),
    path("user/refresh/", UserRefreshView.as_view(), name="user-refresh"),
]
