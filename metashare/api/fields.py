import bleach
from markdown import markdown
from rest_framework.fields import CharField

from sfdo_template_helpers.fields.markdown import MarkdownFieldMixin

# Get the allowed values off the the library we use for the underpinning Model field:
ALLOWED_TAGS = MarkdownFieldMixin.allowed_tags
ALLOWED_ATTRS = MarkdownFieldMixin.allowed_attrs


def render_clean_markdown(raw_md):
    return bleach.clean(markdown(raw_md), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)


class MarkdownField(CharField):
    def to_representation(self, value):
        return render_clean_markdown(value)
