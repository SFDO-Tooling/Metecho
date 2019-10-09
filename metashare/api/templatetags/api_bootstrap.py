import json

from django import template
from django.utils.html import escape

from ..serializers import FullUserSerializer

register = template.Library()


@register.filter
def serialize(user):
    from ..jobs import refresh_github_repositories_for_user_job

    if not user.repositories.exists():
        refresh_github_repositories_for_user_job.delay(user)
    return escape(json.dumps(FullUserSerializer(user).data))
