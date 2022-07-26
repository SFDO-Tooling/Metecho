import json

from django import template
from django.utils.html import escape

from metecho.api.models import GitHubCollaboration

from ..serializers import FullUserSerializer

register = template.Library()


@register.filter
def serialize(user):
    if not GitHubCollaboration.objects.filter(user_id=user.github_id).exists():
        user.queue_refresh_repositories()
    return escape(json.dumps(FullUserSerializer(user).data))
