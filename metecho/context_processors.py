from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site

from metecho.api.serializers import SiteSerializer


def env(request):
    site_profile = SiteSerializer(
        getattr(get_current_site(request), "siteprofile", None)
    )
    GLOBALS = {
        "SITE": site_profile.data,
        "GITHUB_ISSUE_LIMIT": settings.GITHUB_ISSUE_LIMIT,
        "SENTRY_DSN": settings.SENTRY_DSN,
        "ORG_RECHECK_MINUTES": settings.ORG_RECHECK_MINUTES,
        "ENABLE_WALKTHROUGHS": settings.ENABLE_WALKTHROUGHS,
    }
    return {"GLOBALS": GLOBALS}
