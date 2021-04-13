import ssl

from .base import *  # NOQA
from .base import CACHES, CHANNEL_LAYERS, PROJECT_ROOT, REDIS_LOCATION, TEMPLATES

STATICFILES_DIRS = [
    str(PROJECT_ROOT / "static"),
    str(PROJECT_ROOT / "dist" / "prod"),
    str(PROJECT_ROOT / "locales"),
]

TEMPLATES[0]["DIRS"] = [
    str(PROJECT_ROOT / "dist" / "prod"),
    str(PROJECT_ROOT / "templates"),
]

RQ = {"WORKER_CLASS": "metecho.rq_worker.ConnectionClosingHerokuWorker"}

if REDIS_LOCATION.startswith("rediss://"):
    # Fix Redis errors with Heroku self-signed certificates
    # See:
    #   - https://github.com/django/channels_redis/issues/235
    #   - https://github.com/jazzband/django-redis/issues/353

    CACHES["default"]["OPTIONS"]["CONNECTION_POOL_KWARGS"] = {"ssl_cert_reqs": False}

    ssl_context = ssl.SSLContext()
    ssl_context.check_hostname = False

    heroku_redis_ssl_host = {
        "address": REDIS_LOCATION,
        "ssl": ssl_context,
    }

    CHANNEL_LAYERS["default"]["CONFIG"] = {"hosts": (heroku_redis_ssl_host,)}
