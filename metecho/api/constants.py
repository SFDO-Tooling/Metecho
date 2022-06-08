from django.utils.translation import gettext as _

CHANNELS_GROUP_NAME = "{model}.{id}"
ORGANIZATION_DETAILS = "organization_details"
LIST = "list"


class GitHubAppErrors:
    NO_MEMBER = _("You are not a member of this organization")
    NOT_INSTALLED = _("GitHub App has not been installed on this organization")
    MEMBERS_PERM = _(
        "GitHub App is missing write permission for Organization / Members"
    )
    ADMIN_PERM = _(
        "GitHub App is missing write permission for Repository / Administration"
    )
    LIMITED_REPOS = _(
        "GitHub App has not been granted access to all organization repositories"
    )
