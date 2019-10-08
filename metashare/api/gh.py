"""
GitHub utilities
"""

import contextlib
import itertools
import logging
import os
import shutil
import zipfile
from glob import glob
from urllib.parse import urlparse

from cumulusci.utils import temporary_dir
from django.core.exceptions import (
    MultipleObjectsReturned,
    ObjectDoesNotExist,
    ValidationError,
)
from github3 import login
from purl import URL

from .custom_cci_configs import GlobalConfig

logger = logging.getLogger(__name__)


class UnsafeZipfileError(Exception):
    pass


class NoGitHubTokenError(Exception):
    pass


def gh_given_user(user):
    try:
        token = (
            user.socialaccount_set.get(provider="github").socialtoken_set.get().token
        )
    except (ObjectDoesNotExist, MultipleObjectsReturned):
        raise NoGitHubTokenError
    return login(token=token)


def get_all_org_repos(user):
    gh = gh_given_user(user)
    repos = set(
        [
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


def extract_owner_and_repo(gh_url):
    path = urlparse(gh_url).path
    _, owner, repo, *_ = path.split("/")
    return owner, repo


def is_safe_path(path):
    return not os.path.isabs(path) and ".." not in path.split(os.path.sep)


def zip_file_is_safe(zip_file):
    return all(is_safe_path(info.filename) for info in zip_file.infolist())


def get_repo_info(user, repo_url):
    gh = gh_given_user(user)
    owner, repo_name = extract_owner_and_repo(repo_url)
    return gh.repository(owner, repo_name)


def normalize_owner_and_repo_name(repo):
    """
    Make sure we have the _actual_ owner/repo name if we were
    redirected.
    """
    owner = repo.owner.login
    repo_name = repo.name
    return owner, repo_name


def get_zip_file(repo, commit_ish):
    zip_file_name = "archive.zip"
    repo.archive("zipball", path=zip_file_name, ref=commit_ish)
    return zipfile.ZipFile(zip_file_name)


def log_unsafe_zipfile_error(owner, repo_name, commit_ish):
    """
    It is very unlikely that we will get an unsafe zipfile, as we get it
    from GitHub, but must be considered.
    """
    url = f"https://github.com/{owner}/{repo_name}#{commit_ish}"
    logger.error(f"Malformed or malicious zip file from {url}.")


def extract_zip_file(zip_file, owner, repo_name):
    zip_file.extractall()
    # We know that the zipball contains a root directory named something
    # like this by GitHub's convention. If that ever breaks, this will
    # break:
    zipball_root = glob(f"{owner}-{repo_name}-*")[0]
    # It's not unlikely that the zipball root contains a directory with
    # the same name, so we pre-emptively rename it to probably avoid
    # collisions:
    shutil.move(zipball_root, "zipball_root")
    for path in itertools.chain(glob("zipball_root/*"), glob("zipball_root/.*")):
        shutil.move(path, ".")
    shutil.rmtree("zipball_root")


@contextlib.contextmanager
def local_github_checkout(user, repo_url, commit_ish=None):
    with temporary_dir() as repo_root:
        repo = get_repo_info(user, repo_url)
        if commit_ish is None:
            commit_ish = repo.default_branch
        owner, repo_name = normalize_owner_and_repo_name(repo)
        zip_file = get_zip_file(repo, commit_ish)

        if not zip_file_is_safe(zip_file):
            log_unsafe_zipfile_error(owner, repo_name, commit_ish)
            raise UnsafeZipfileError
        else:
            # Because subsequent operations require certain things to be
            # present in the filesystem at cwd, things that are in the
            # repo (we hope):
            extract_zip_file(zip_file, owner, repo_name)
            yield repo_root


def get_cumulus_prefix(**kwargs):
    """
    Expects to be in a local_github_checkout.
    """
    global_config = GlobalConfig()
    project_config = global_config.get_project_config(**kwargs)
    return project_config.project__git__prefix_feature
