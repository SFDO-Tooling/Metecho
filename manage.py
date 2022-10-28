#!/usr/bin/env python
import os
import sys

ALLOWED_PRODUCTION_COMMANDS = [
    "collectstatic",
    "promote_superuser",
    "migrate",
    "rqscheduler",
    "rqworker",
    "showmigrations",
]


if __name__ == "__main__":
    settings_module = os.environ.setdefault(
        "DJANGO_SETTINGS_MODULE", "config.settings.base"
    )
    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        # The above import may fail for some other reason. Ensure that the
        # issue is really that Django is missing to avoid masking other
        # exceptions on Python 2.
        try:
            import django  # noqa: F401
        except ImportError:
            raise ImportError(
                "Couldn't import Django. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable? Did you "
                "forget to activate a virtual environment?"
            )
        raise

    if len(sys.argv) > 1 and settings_module == "config.settings.production":
        command = sys.argv[1]
        if command not in ALLOWED_PRODUCTION_COMMANDS:
            raise RuntimeError(
                f"Access to the {command} command has been disabled in production."
            )

    execute_from_command_line(sys.argv)
