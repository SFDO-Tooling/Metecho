from io import StringIO

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_promote_superuser__no_such_user():
    out = StringIO()
    call_command("promote_superuser", "test@example.com", stdout=out)

    assert "No such email(s)." in out.getvalue()


@pytest.mark.django_db
def test_promote_superuser__success(user_factory):
    user = user_factory(email="test@example.com")
    out = StringIO()
    call_command("promote_superuser", "test@example.com", stdout=out)
    user.refresh_from_db()

    assert "Promoted!" in out.getvalue()
    assert user.is_superuser
    assert user.is_staff
