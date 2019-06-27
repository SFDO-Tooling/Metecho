"""
GitHub utilities
"""

from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from github3 import login


def get_all_org_repos(user):
    try:
        token = (
            user.socialaccount_set.get(provider="github").socialtoken_set.get().token
        )
    except (ObjectDoesNotExist, MultipleObjectsReturned):
        return []
    gh = login(token=token)
    return [repo.url for repo in gh.repositories()]
