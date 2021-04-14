import mimetypes

from .base import *  # NOQA

INSTALLED_APPS = INSTALLED_APPS + ["django_extensions"]  # NOQA

mimetypes.add_type("text/css", ".css", True)
