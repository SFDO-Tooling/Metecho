import bleach
from django.core.validators import RegexValidator, _lazy_re_compile
from django.db import models
from django.utils.translation import gettext_lazy as _
from markdown import markdown
from rest_framework.fields import CharField
from sfdo_template_helpers.fields.markdown import MarkdownFieldMixin

# Get the allowed values off the the library we use for the underpinning Model field:
ALLOWED_TAGS = MarkdownFieldMixin.allowed_tags
ALLOWED_ATTRS = MarkdownFieldMixin.allowed_attrs


def render_clean_markdown(raw_md):
    return bleach.clean(markdown(raw_md), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)


# A Serializer field.
class MarkdownField(CharField):
    def to_representation(self, value):
        return render_clean_markdown(value)


branch_unicode_re = _lazy_re_compile(r"^[-\w]+\Z/")
validate_unicode_branch = RegexValidator(
    branch_unicode_re,
    _(
        "Enter a valid 'branch' consisting of Unicode letters, numbers, underscores, "
        "slashes, or hyphens."
    ),
    "invalid",
)


# A Model field
class BranchField(models.SlugField):
    default_validators = [validate_unicode_branch]
    description = _("Branch (up to %(max_length)s)")

    def __init__(self, *args, **kwargs):
        kwargs["max_length"] = 100
        kwargs["null"] = True
        kwargs["blank"] = True
        return super().__init__(*args, **kwargs)
