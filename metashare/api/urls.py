from django.urls import path
from rest_framework import routers

from .views import ProductViewSet, UserRefreshView, UserView

router = routers.DefaultRouter()
router.register("products", ProductViewSet, basename="product")
urlpatterns = router.urls + [
    path("user/", UserView.as_view(), name="user"),
    path("user/refresh/", UserRefreshView.as_view(), name="user-refresh"),
]
