from rest_framework.fields import CharField
import bleach
from markdown import markdown


# These two constants are duplicated from sfdo-template-helpers' MarkdownField.
# Not the best thing, but the clearest way to render markdown out of a serializer.
ALLOWED_TAGS = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "b",
    "i",
    "strong",
    "em",
    "tt",
    "p",
    "br",
    "span",
    "div",
    "blockquote",
    "code",
    "hr",
    "ul",
    "ol",
    "li",
    "dd",
    "dt",
    "img",
    "a",
]

ALLOWED_ATTRS = {"img": ["src", "alt", "title"], "a": ["href", "alt", "title"]}


def render_clean_markdown(raw_md):
    return bleach.clean(markdown(raw_md), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)


class MarkdownField(CharField):
    def to_representation(self, value):
        return render_clean_markdown(value)
