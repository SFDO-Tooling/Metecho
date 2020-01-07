from django.core.validators import RegexValidator, _lazy_re_compile
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError
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

    def filter_queryset(self, attrs, queryset, serializer):
        """
        Filter the queryset to all instances matching the given attributes.
        """
        # This is a modified version of `UniqueTogetherValidator.filter_queryset`,
        # modifed to preprocess field names for case-insensitive matching.

        # field names => field sources
        sources = [serializer.fields[field_name].source for field_name in self.fields]

        # If this is an update, then any unprovided field should
        # have its value set based on the existing instance attribute.
        if serializer.instance is not None:
            for source in sources:
                if source not in attrs:
                    attrs[source] = getattr(serializer.instance, source)

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


class GitHubUserValidator:
    def __init__(self, *, parent):
        self.parent = parent

    def __call__(self, cleaned_data):
        parent = cleaned_data.get(self.parent)
        github_users = cleaned_data["github_users"]
        for user in github_users:
            if user not in parent.github_users:
                raise ValidationError(f"Invalid github_users value: {user}")
