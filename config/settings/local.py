from .base import *  # NOQA
from .base import LOGGING

INSTALLED_APPS = INSTALLED_APPS + ["django_extensions"]  # NOQA

LOGGING["loggers"]["werkzeug"] = {
    "handlers": ["console"],
    "level": "DEBUG",
    "propagate": True,
}
