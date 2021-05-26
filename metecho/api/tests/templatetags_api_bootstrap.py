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
                "avatar_url": None,
                "github_id": str(user.github_id),
                "is_staff": False,
                "valid_token_for": None,
                "org_name": None,
                "org_type": None,
                "is_devhub_enabled": False,
                "sf_username": None,
                "currently_fetching_repos": True,
                "devhub_username": "",
                "uses_global_devhub": False,
                "agreed_to_tos_at": None,
                "onboarded_at": None,
                "self_guided_tour_enabled": True,
                "self_guided_tour_state": None,
            }
        )
    )
    assert actual == expected
