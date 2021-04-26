from operator import itemgetter
from typing import Callable, Union

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


class ProjectCollaboratorValidator:
    def __init__(
        self,
        *,
        field: str,
        parent: Union[str, Callable],
        enforce_push_permission: bool = False,
    ):
        """
        Checks a list or single GitHub user IDs to ensure they are collaborators in the parent
        """
        self.field = field
        self.enforce_push_permission = enforce_push_permission
        self.parent = parent if callable(parent) else itemgetter(parent)

    def __call__(self, cleaned_data):
        github_users = cleaned_data.get(self.field)
        if github_users is None:
            return  # None-values will be handled by standard validation (if at all)

        seen_github_users = []
        parent = self.parent(cleaned_data)
        parent_github_users = [user.get("id") for user in parent.github_users]
        permissions = {
            user["id"]: user.get("permissions", {}) for user in parent.github_users
        }
        if isinstance(github_users, (str, int)):
            github_users = [str(github_users)]

        for id in github_users:
            if not id or id not in parent_github_users:
                raise ValidationError({self.field: _(f"Invalid GitHub user: {id}")})

            if id in seen_github_users:
                raise ValidationError({self.field: _(f"Duplicate GitHub user: {id}")})
            else:
                seen_github_users.append(id)

            if self.enforce_push_permission:
                perms = permissions.get(id, {})
                if not perms.get("push"):
                    raise ValidationError(
                        {self.field: _(f"Missing permissions for GitHub user: {id}")}
                    )
