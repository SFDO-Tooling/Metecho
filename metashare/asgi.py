"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os

import django
import sentry_sdk
from channels.routing import get_default_application
from newrelic import agent
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

agent.initialize()
agent.wrap_web_transaction("django.core.handlers.base", "BaseHandler.get_response")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
SENTRY_DSN = os.environ.get("SENTRY_DSN")
if SENTRY_DSN:  # pragma: nocover
    sentry_sdk.init(dsn=SENTRY_DSN)

django.setup()

if SENTRY_DSN:  # pragma: nocover
    application = SentryAsgiMiddleware(get_default_application())
else:
    application = get_default_application()
