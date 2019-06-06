from rest_framework import routers


def _get_api_basename(viewset):  # pragma: nocover
    return viewset.model_name.lower()


app_name = "admin_api"
router = routers.DefaultRouter(trailing_slash=False)
router.get_default_basename = _get_api_basename
urlpatterns = router.urls
