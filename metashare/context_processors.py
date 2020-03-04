from django.conf import settings


def env(request):
    GLOBALS = {
        "SENTRY_DSN": settings.SENTRY_DSN,
        "DEVHUB_USERNAME": settings.DEVHUB_USERNAME,
    }
    return {"GLOBALS": GLOBALS}
