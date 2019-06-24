from django.urls import path
from rest_framework import routers

from .views import ProductViewSet, UserView

router = routers.DefaultRouter()
router.register("products", ProductViewSet)
urlpatterns = router.urls + [path("user/", UserView.as_view(), name="user")]
