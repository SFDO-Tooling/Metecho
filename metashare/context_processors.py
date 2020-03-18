from django.conf import settings


def env(request):
    GLOBALS = {
        "SENTRY_DSN": settings.SENTRY_DSN,
        "ORG_RECHECK_MINUTES": settings.ORG_RECHECK_MINUTES,
    }
    return {"GLOBALS": GLOBALS}
