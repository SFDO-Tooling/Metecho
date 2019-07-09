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
        return set()
    gh = login(token=token)
    repos = set(
        [
            normalize_github_url(repo.url)
            for org in gh.organizations()
            for repo in org.repositories()
            if repo.permissions.get("push", False)
        ]
        + [
            normalize_github_url(repo.url)
            for repo in gh.repositories()
            if repo.permissions.get("push", False)
        ]
    )
    return repos


def normalize_github_url(url):
    # Stupid variable assignment to help Black and the linter get along:
    prefix = "/repos"
    prefix_len = len(prefix)
    suffix = ".git"
    suffix_len = len(suffix)

    url = URL(url).scheme("https").host("www.github.com")
    if url.path().startswith(prefix):
        url = url.path(url.path()[prefix_len:])
    if url.path().endswith(suffix):
        url = url.path(url.path()[:-suffix_len])
    return str(url)


def validate_gh_url(value):
    if value != normalize_github_url(value):
        raise ValidationError(
            "%(value)s should be of the form 'https://www.github.com/:org/:repo'.",
            params={"value": value},
        )
