from django.conf import settings


def env(request):
    GLOBALS = {
        "SENTRY_DSN": settings.SENTRY_DSN,
        "DEVHUB_USERNAME_SET": bool(settings.DEVHUB_USERNAME),
        "ORG_RECHECK_MINUTES": settings.ORG_RECHECK_MINUTES,
    }
    return {"GLOBALS": GLOBALS}
