import json

from django import template
from django.utils.html import escape

from ..serializers import FullUserSerializer

register = template.Library()


@register.filter
def serialize(user):
    return escape(json.dumps(FullUserSerializer(user).data))
