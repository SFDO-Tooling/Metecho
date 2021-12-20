from contextlib import suppress

from django.core.validators import RegexValidator, _lazy_re_compile
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator, qs_filter


class UnattachedIssueValidator:
    """
    Check a GitHubIssue doesn't have an Epic nor a Task attached
    """

    requires_context = True

    def __call__(self, data, serializer):
        from .models import Epic, Task

        issue = data.get("issue")
        if issue is None:
            return

        with suppress(Task.DoesNotExist):
            if issue.task != serializer.instance:
                raise serializers.ValidationError(
                    {"issue": _("This issue is already attached to a task")}
                )
        with suppress(Epic.DoesNotExist):
            if issue.epic != serializer.instance:
                raise serializers.ValidationError(
                    {"issue": _("This issue is already attached to an epic")}
                )


class CaseInsensitiveUniqueTogetherValidator(UniqueTogetherValidator):
    def process_field_name(self, field_name):
        """
        Right now, we presume that certain names are string-y, and can be
        case-insensitive compared.
        """
        if field_name == "name":
            return "name__iexact"
        return field_name

    def filter_queryset(self, attrs, queryset, serializer):
        """
        Filter the queryset to all instances matching the given attributes.
        """
        # This is a modified version of `UniqueTogetherValidator.filter_queryset`,
        # modifed to preprocess field names for case-insensitive matching.
        # It also handles filtering on soft-deletes if appropriate.

        # field names => field sources
        sources = [serializer.fields[field_name].source for field_name in self.fields]

        # If this is an update, then any unprovided field should
        # have its value set based on the existing instance attribute.
        if serializer.instance is not None:
            for source in sources:
                if source not in attrs:
                    attrs[source] = getattr(serializer.instance, source)

        if hasattr(queryset, "active"):
            queryset = queryset.active()
        # Determine the filter keyword arguments and filter the queryset.
        filter_kwargs = {
            self.process_field_name(source): attrs[source] for source in sources
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
