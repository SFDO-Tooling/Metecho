import json

import pytest
from django.utils.html import escape

from ..templatetags.api_bootstrap import serialize


@pytest.mark.django_db
def test_serialize(user_factory):
    user = user_factory(
        email="template_tags@example.com", username="template_tags@example.com"
    )
    actual = serialize(user)
    expected = escape(
        json.dumps(
            {
                "id": str(user.id),
                "username": "template_tags@example.com",
                "email": "template_tags@example.com",
                "is_staff": False,
                "valid_token_for": None,
                "org_name": None,
                "org_type": None,
                "is_devhub_enabled": False,
                "sf_username": None,
            }
        )
    )
    assert actual == expected
