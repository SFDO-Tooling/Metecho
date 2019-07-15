from django.conf import settings


def env(request):
    GLOBALS = {"SENTRY_DSN": settings.SENTRY_DSN}
    return {"GLOBALS": GLOBALS}
