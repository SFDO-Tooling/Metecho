from django.test import override_settings

from ..context_processors import env


@override_settings(SENTRY_DSN="https://example.com")
def test_env(rf):
    result = env(rf.get("/"))

    assert "GLOBALS" in result
    assert "SENTRY_DSN" in result["GLOBALS"]
