"""
GitHub utilities
"""

from django.core.exceptions import (
    MultipleObjectsReturned,
    ObjectDoesNotExist,
    ValidationError,
)
from github3 import login
from purl import URL


def get_all_org_repos(user):
    try:
        token = (
            user.socialaccount_set.get(provider="github").socialtoken_set.get().token
        )
    except (ObjectDoesNotExist, MultipleObjectsReturned):
        return []
    gh = login(token=token)
    return [repo.url for repo in gh.repositories()]


def normalize_github_url(url):
    url = URL(url).scheme("https").host("www.github.com")
    if url.path().endswith(".git"):
        url = url.path(url.path()[: -len(".git")])
    if url.path().startswith("/repos"):
        url = url.path(url.path()[len("/repos") :])
    return str(url)


def validate_gh_url(value):
    if value != normalize_github_url(value):
        raise ValidationError(
            "%(value)s should be of the form 'https://www.github.com/:org/:repo'.",
            params={"value": value},
        )
