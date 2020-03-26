"""Metecho URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from urllib.parse import urljoin

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import RedirectView, TemplateView

from .routing import websockets

PREFIX = settings.ADMIN_AREA_PREFIX


urlpatterns = [
    path(urljoin(PREFIX, r"django-rq/"), include("django_rq.urls")),
    path(
        urljoin(PREFIX, r"rest/"),
        include("metashare.adminapi.urls", namespace="admin_rest"),
    ),
    # Put this after all other things using `PREFIX`:
    re_path(PREFIX + "$", RedirectView.as_view(url=f"/{PREFIX}/")),
    path(PREFIX + "/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api/", include("metashare.api.urls")),
    # Catchall for the rest. Right now, it just trusts that PREFIX ==
    # 'admin', because we don't want to do string munging to get just
    # the part without the regex and path cruft on it.
    re_path(
        r"^(?!{admin}|accounts|api|static)".format(admin=PREFIX),
        TemplateView.as_view(template_name="index.html"),
        name="frontend",
    ),
    # Add WebSocket routes so that non-HTTP paths can be accessible by
    # `reverse` in Python and `window.api_urls` in JavaScript. These will
    # usually only be the path component, not a full URL, and so the caller
    # will have to build them with the right scheme and authority sections.
] + websockets.routes
