"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os

import django
from channels.routing import get_default_application
from newrelic import agent

agent.initialize()
agent.wrap_web_transaction("django.core.handlers.base", "BaseHandler.get_response")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django.setup()

application = get_default_application()
