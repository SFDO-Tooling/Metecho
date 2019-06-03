from functools import partial

from allauth.utils import import_attribute
from django.urls import include, path

from .provider import (
    SalesforceCustomProvider,
    SalesforceProductionProvider,
    SalesforceTestProvider,
)


def default_urlpatterns(provider, version):
    import_attribute_tpl = partial(
        "{package}.views.{version}_oauth2_{kind}".format,
        package=provider.get_package(),
        version=version,
    )
    login_view = import_attribute(import_attribute_tpl(kind="login"))
    callback_view = import_attribute(import_attribute_tpl(kind="callback"))

    urlpatterns = [
        path("login/", login_view, name=f"{provider.id}_login"),
        path("login/callback/", callback_view, name=f"{provider.id}_callback"),
    ]

    return [path(f"{provider.get_slug()}/", include(urlpatterns))]


urlpatterns = default_urlpatterns(SalesforceProductionProvider, "prod")
urlpatterns += default_urlpatterns(SalesforceTestProvider, "sandbox")
urlpatterns += default_urlpatterns(SalesforceCustomProvider, "custom")
