import logging
from pathlib import Path

from django.apps import AppConfig
from django.utils.autoreload import file_changed

autoreload_logger = logging.getLogger("django.utils.autoreload")


def skip_dist(sender, file_path: Path, **kwargs):  # pragma: no cover
    """
    Don't restart the dev server for changes in the /dist folder. Otherwise the server
    goes down while webpack hot-reloads the frontend.
    """
    if "dist/" in str(file_path):
        autoreload_logger.info(f"Skipping autoreload for {file_path}")
        return True


class ApiConfig(AppConfig):
    name = "metecho.api"
    verbose_name = "API"

    def ready(self):
        super().ready()
        file_changed.connect(skip_dist, dispatch_uid="Skip dist autoreload")
