import pytest
from django.test import override_settings

from ..context_processors import env


@pytest.mark.django_db
@override_settings(SENTRY_DSN="https://example.com")
def test_env(rf):
    result = env(rf.get("/"))

    assert "GLOBALS" in result
    assert "SENTRY_DSN" in result["GLOBALS"]
    assert "GITHUB_ISSUE_LIMIT" in result["GLOBALS"]
    assert "SITE" in result["GLOBALS"]
    assert "ORG_RECHECK_MINUTES" in result["GLOBALS"]
