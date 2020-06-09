import json

from django import template
from django.utils.html import escape

from ..serializers import FullUserSerializer

register = template.Library()


@register.filter
def serialize(user):
    if not user.repositories.exists():
        user.queue_refresh_repositories()
    return escape(json.dumps(FullUserSerializer(user).data))
