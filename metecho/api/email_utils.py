from django.conf import settings
from django.contrib.sites.models import Site
from furl import furl


def get_user_facing_url(*, path):
    domain = Site.objects.first().domain
    should_be_http = not settings.SECURE_SSL_REDIRECT or domain.startswith("localhost")
    scheme = "http" if should_be_http else "https"
    return furl(f"{scheme}://{domain}").set(path=path.split("/")).url
