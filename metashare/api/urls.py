from django.urls import path
from rest_framework import routers

from .views import UserView

router = routers.DefaultRouter()
urlpatterns = router.urls + [path("user/", UserView.as_view(), name="user")]
