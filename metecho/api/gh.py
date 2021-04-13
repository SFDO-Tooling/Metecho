"""
GitHub utilities
"""

import contextlib
import hmac
import itertools
import logging
import os
import pathlib
import shutil
import zipfile
from glob import glob

from cumulusci.utils import temporary_dir
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from github3 import GitHub, login, users
from github3.exceptions import NotFoundError, UnprocessableEntity

from .custom_cci_configs import MetechoUniversalConfig, ProjectConfig

logger = logging.getLogger(__name__)


ZIP_FILE_NAME = "archive.zip"


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


def gh_as_app(repo_owner, repo_name):
    app_id = settings.GITHUB_APP_ID
    app_key = settings.GITHUB_APP_KEY
    gh = GitHub()
    gh.login_as_app(app_key, app_id, expire_in=120)
    installation = gh.app_installation_for_repository(repo_owner, repo_name)
    gh.login_as_app_installation(app_key, app_id, installation.id)
    return gh


def get_all_org_repos(user):
    gh = gh_given_user(user)
    return set(gh.repositories())


def is_safe_path(path):
    return not os.path.isabs(path) and ".." not in path.split(os.path.sep)


def zip_file_is_safe(zip_file):
    return all(is_safe_path(info.filename) for info in zip_file.infolist())


def get_repo_info(user, repo_id=None, repo_owner=None, repo_name=None):
    if user is None and (repo_owner is None or repo_name is None):
        raise TypeError("If user=None, you must call with repo_owner and repo_name")
    gh = gh_given_user(user) if user else gh_as_app(repo_owner, repo_name)
    if repo_id is None:
        return gh.repository(repo_owner, repo_name)
    return gh.repository_with_id(repo_id)


def get_cached_user(gh: GitHub, username: str) -> users.User:
    """
    Get a GitHub user by username. Results are cached to stay under API limits.
    """
    key = f"gh_user_{username}"
    user_dict = cache.get(key)
    if user_dict is not None:
        return users.User.from_dict(user_dict, gh.session)

    user = gh.user(username)
    cache.set(key, user.as_dict(), timeout=60 * 60 * 24)  # 1 day
    return user


def get_zip_file(repo, commit_ish):
    repo.archive("zipball", path=ZIP_FILE_NAME, ref=commit_ish)
    return zipfile.ZipFile(ZIP_FILE_NAME)


def log_unsafe_zipfile_error(repo_url, commit_ish):
    """
    It is very unlikely that we will get an unsafe zipfile, as we get it
    from GitHub, but must be considered.
    """
    url = f"{repo_url}#{commit_ish}"
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
    os.remove(ZIP_FILE_NAME)


@contextlib.contextmanager
def local_github_checkout(user, repo_id, commit_ish=None):
    with temporary_dir() as repo_root:
        # pretend it's a git clone to satisfy cci
        os.mkdir(".git")

        repo = get_repo_info(user, repo_id=repo_id)
        if commit_ish is None:
            commit_ish = repo.default_branch
        zip_file = get_zip_file(repo, commit_ish)

        if not zip_file_is_safe(zip_file):
            log_unsafe_zipfile_error(repo.html_url, commit_ish)
            raise UnsafeZipfileError
        else:
            # Because subsequent operations require certain things to be
            # present in the filesystem at cwd, things that are in the
            # repo (we hope):
            extract_zip_file(zip_file, repo.owner.login, repo.name)

            # validate that cumulusci.yml is the same as default_branch
            validate_cumulusci_yml_unchanged(repo)

            yield repo_root


def get_project_config(**kwargs):
    """
    Expects to be in a local_github_checkout.
    """
    universal_config = MetechoUniversalConfig()
    return ProjectConfig(universal_config, **kwargs)


def get_cumulus_prefix(**kwargs):
    """
    Expects to be in a local_github_checkout.
    """
    project_config = get_project_config(**kwargs)
    return project_config.project__git__prefix_feature


def get_source_format(**kwargs):
    """
    Expects to be in a local_github_checkout.
    """
    project_config = get_project_config(**kwargs)
    return project_config.project__source_format


def try_to_make_branch(repository, *, new_branch, base_branch):
    branch_name = new_branch
    counter = 0
    max_length = 100  # From models.Epic.branch_name
    while True:
        suffix = f"-{counter}" if counter else ""
        branch_name = f"{new_branch[:max_length-len(suffix)]}{suffix}"
        try:
            latest_sha = repository.branch(base_branch).latest_sha()
            repository.create_branch_ref(branch_name, latest_sha)
            return branch_name, latest_sha
        except UnprocessableEntity as err:
            if err.msg == "Reference already exists":
                counter += 1
            else:
                raise


def validate_gh_hook_signature(
    *, hook_secret: bytes, signature: bytes, message: bytes
) -> bool:
    local_signature = "sha1=" + hmac.new(hook_secret, message, "sha1").hexdigest()
    # Uncomment this when writing webhook tests to confirm the signature
    # for the test:
    # print("\033[1;92m======>", local_signature, "\033[0m")
    return hmac.compare_digest(local_signature, signature)


def normalize_commit(commit, **kwargs):
    """
    This takes commits either in the JSON format provided by a GitHub
    webhook, or the object format provided by github3.py, and returns a
    normalized Python dict.
    """
    if isinstance(commit, dict):
        # If GitHub webhook payload:
        sender = kwargs.get("sender", {})
        avatar_url = ""
        if sender["avatar_url"] and sender["login"] == commit["author"]["username"]:
            avatar_url = sender["avatar_url"]
        return {
            "id": commit["id"],
            "timestamp": commit["timestamp"],
            "author": {
                "name": commit["author"]["name"],
                "email": commit["author"]["email"],
                "username": commit["author"]["username"],
                "avatar_url": avatar_url,
            },
            "message": commit["message"],
            "url": commit["url"],
        }
    else:
        # If github3.py object:
        return {
            "id": commit.sha,
            "timestamp": commit.commit.author.get("date", ""),
            "author": {
                "name": commit.commit.author.get("name", ""),
                "email": commit.commit.author.get("email", ""),
                "username": commit.author.login if commit.author else "",
                "avatar_url": commit.author.avatar_url if commit.author else "",
            },
            "message": commit.message,
            "url": commit.html_url,
        }


def validate_cumulusci_yml_unchanged(repo):
    """Confirm cumulusci.yml is unchanged between default_branch and the cwd."""
    try:
        cci_config_default_branch = repo.file_contents(
            "cumulusci.yml", ref=repo.default_branch
        ).decoded.decode("utf-8")
    except NotFoundError:
        cci_config_default_branch = ""
    try:
        cci_config_branch = pathlib.Path("cumulusci.yml").read_text()
    except IOError:
        cci_config_branch = ""
    if cci_config_default_branch != cci_config_branch:
        raise Exception("cumulusci.yml contains unreviewed changes.")
