from django.db import DatabaseError, InterfaceError, connections
from newrelic import agent
from rq.job import Job
from rq.worker import HerokuWorker, Worker


def wrap_job_as_background_task(Job):
    orig = Job.perform

    def wrapper(self):
        with agent.BackgroundTask(agent.application(), self.func_name):
            return orig(self)

    Job.perform = wrapper


wrap_job_as_background_task(Job)


class ConnectionClosingWorkerMixin(object):
    """Mixin for rq workers to ensure db connections are closed."""

    def close_database(self):
        for connection in connections.all():
            try:
                connection.close()
            except InterfaceError:
                pass
            except DatabaseError as e:
                str_exc = str(e)
                if "closed" not in str_exc and "not connected" not in str_exc:
                    raise

    def perform_job(self, *args, **kwargs):
        self.close_database()
        agent.register_application(timeout=10.0)
        try:
            return super().perform_job(*args, **kwargs)
        finally:
            agent.shutdown_agent(timeout=10.0)
            self.close_database()

    def work(self, *args, **kwargs):
        self.close_database()
        return super().work(*args, **kwargs)


class ConnectionClosingWorker(ConnectionClosingWorkerMixin, Worker):
    """Connection-closing worker for non-Heroku environments"""


class ConnectionClosingHerokuWorker(ConnectionClosingWorkerMixin, HerokuWorker):
    """Connection-closing worker for Heroku

    The HerokuWorker prevents child workhorse processes from handling the
    SIGTERM that Heroku sends prior to restarting a dyno. Instead the parent
    process handles it and relays it to children using SIGRTMIN,
    which triggers a ShutDownImminentException.

    SIGRTMIN is undefined on macOS, so we can't use this worker everywhere.
    """
