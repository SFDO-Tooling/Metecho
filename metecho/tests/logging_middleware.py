import pytest

from ..logging_middleware import LoggingMiddleware


class Response(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.status_code = 200


@pytest.mark.django_db
class TestLoggingMiddleware:
    def test_process_request(self, rf):
        request = rf.get("/")
        assert not hasattr(request, "id")

        LoggingMiddleware().process_request(request)

        assert hasattr(request, "id")

    def test_process_response(self, rf, user_factory):
        response = Response()
        request = rf.get("/")
        request.id = "sentinel"
        request.user = user_factory()
        ret = LoggingMiddleware().process_response(request, response)

        assert ret["X-Request-ID"] == request.id
