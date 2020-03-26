from unittest.mock import MagicMock

import pytest
from django.db import DatabaseError, InterfaceError
from django_rq import get_worker


class TestConnectionClosingWorker:
    def test_close_database__good(self, mocker):
        conn = MagicMock()
        all_ = mocker.patch("django.db.connections.all")
        all_.return_value = [conn]

        worker = get_worker()
        worker.close_database()

        assert conn.close.called

    def test_close_database__interface_error(self, mocker):
        conn = MagicMock()
        conn.close.side_effect = InterfaceError()
        all_ = mocker.patch("django.db.connections.all")
        all_.return_value = [conn]

        worker = get_worker()
        worker.close_database()

        assert conn.close.called

    def test_close_database__database_error__reraise(self, mocker):
        conn = MagicMock()
        conn.close.side_effect = DatabaseError("reraise me")
        all_ = mocker.patch("django.db.connections.all")
        all_.return_value = [conn]

        worker = get_worker()
        with pytest.raises(DatabaseError):
            worker.close_database()

    def test_close_database__database_error__no_reraise(self, mocker):
        conn = MagicMock()
        conn.close.side_effect = DatabaseError("closed not connected don't reraise me")
        all_ = mocker.patch("django.db.connections.all")
        all_.return_value = [conn]

        worker = get_worker()
        worker.close_database()

        assert conn.close.called

    def test_perform_job(self, mocker):
        close_database = mocker.patch(
            "metecho.rq_worker.ConnectionClosingWorker.close_database"
        )
        mocker.patch("rq.worker.Worker.perform_job")

        worker = get_worker()
        # Symbolic call only, since we've mocked out the super:
        worker.perform_job(None, None)

        assert close_database.called

    def test_work(self, mocker):
        close_database = mocker.patch(
            "metecho.rq_worker.ConnectionClosingWorker.close_database"
        )
        worker = get_worker()
        worker.work(burst=True)

        assert close_database.called
