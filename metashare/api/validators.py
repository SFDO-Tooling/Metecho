from django.core.validators import RegexValidator, _lazy_re_compile
from django.utils.translation import gettext_lazy as _
from rest_framework.validators import UniqueTogetherValidator, qs_filter


class CaseInsensitiveUniqueTogetherValidator(UniqueTogetherValidator):
    def process_field_name(self, field_name):
        """
        Right now, we presume that certain names are string-y, and can be
        case-insensitive compared.
        """
        if field_name == "name":
            return "name__iexact"
        return field_name

    def filter_queryset(self, attrs, queryset):
        """
        Filter the queryset to all instances matching the given attributes.
        """
        # If this is an update, then any unprovided field should
        # have its value set based on the existing instance attribute.
        if self.instance is not None:
            for field_name in self.fields:
                if field_name not in attrs:
                    attrs[field_name] = getattr(self.instance, field_name)

        # Determine the filter keyword arguments and filter the queryset.
        filter_kwargs = {
            self.process_field_name(field_name): attrs[field_name]
            for field_name in self.fields
        }
        return qs_filter(queryset, **filter_kwargs)


branch_unicode_re = _lazy_re_compile(r"^[-\w/]+\Z")
validate_unicode_branch = RegexValidator(
    branch_unicode_re,
    _(
        "Enter a valid 'branch' consisting of Unicode letters, numbers, underscores, "
        "slashes, or hyphens."
    ),
    "invalid",
)
