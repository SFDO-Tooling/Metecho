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
from github3.repos.branch import Branch

from .custom_cci_configs import MetechoUniversalConfig, ProjectConfig

logger = logging.getLogger(__name__)


APP_ID = settings.GITHUB_APP_ID
APP_KEY = settings.GITHUB_APP_KEY
ZIP_FILE_NAME = "archive.zip"


class UnsafeZipfileError(Exception):
    pass


class NoGitHubTokenError(Exception):
    pass


def copy_branch_protection(source: Branch, target: Branch):
    """
    Copy the branch protection [output][1] of one branch into the [input][2] of another.

    As of May 2022 it appears the following settings are only available to the GUI, not
    the API:

    - Require signed commits
    - Require deployments to succeed before merging

    [1]: https://docs.github.com/en/rest/branches/branch-protection#get-branch-protection
    [2]: https://docs.github.com/en/rest/branches/branch-protection#update-branch-protection
    """
    protection = source.protection().as_dict()
    reviews = protection["required_pull_request_reviews"]

    required_pull_request_reviews = {
        key: reviews[key]
        for key in (
            "dismiss_stale_reviews",
            "require_code_owner_reviews",
            "required_approving_review_count",
        )
    } | {
        "dismissal_restrictions": {
            "users": [u["login"] for u in reviews["dismissal_restrictions"]["users"]],
            "teams": [t["slug"] for t in reviews["dismissal_restrictions"]["teams"]],
        },
        "bypass_pull_request_allowances": {
            "users": [
                u["login"] for u in reviews["bypass_pull_request_allowances"]["users"]
            ],
            "teams": [
                t["slug"] for t in reviews["bypass_pull_request_allowances"]["teams"]
            ],
        },
    }

    data = {
        key: protection[key]["enabled"]
        for key in (
            "enforce_admins",
            "required_linear_history",
            "allow_force_pushes",
            "allow_deletions",
            "block_creations",
            "required_conversation_resolution",
        )
    } | {
        "required_pull_request_reviews": required_pull_request_reviews,
        "required_status_checks": {
            key: protection["required_status_checks"][key]
            for key in ("strict", "checks")
        },
        "restrictions": {
            "users": [user["login"] for user in protection["restrictions"]["users"]],
            "teams": [team["slug"] for team in protection["restrictions"]["teams"]],
            "apps": [app["slug"] for app in protection["restrictions"]["apps"]],
        },
    }
    # Setting the protection rules on the destination could be achieved by calling
    # `target.protect()`, but that relies on github3py supporting all GitHub API fields
    # as function arguments. Instead of waiting for that we `_put` the data directly and
    # can update at our own pace if GitHub changes the protection schema
    target_url = target._build_url("protection", base_url=target._api)
    resp = target._put(target_url, json=data)
    return target._json(resp, 200)


def gh_as_user(user):
    try:
        token = (
            user.socialaccount_set.get(provider="github").socialtoken_set.get().token
        )
    except (ObjectDoesNotExist, MultipleObjectsReturned):
        raise NoGitHubTokenError
    return login(token=token)


def gh_as_app():
    gh = GitHub()
    gh.login_as_app(APP_KEY, APP_ID, expire_in=120)
    return gh


def gh_as_repo(repo_owner: str, repo_name: str):
    gh = gh_as_app()
    installation = gh.app_installation_for_repository(repo_owner, repo_name)
    gh.login_as_app_installation(APP_KEY, APP_ID, installation.id)
    return gh


def gh_as_org(orgname: str):
    gh = gh_as_app()
    installation = gh.app_installation_for_organization(orgname)
    gh.login_as_app_installation(APP_KEY, APP_ID, installation.id)
    return gh


def get_all_org_repos(user):
    gh = gh_as_user(user)
    return set(gh.repositories())


def is_safe_path(path):
    return not os.path.isabs(path) and ".." not in path.split(os.path.sep)


def zip_file_is_safe(zip_file):
    return all(is_safe_path(info.filename) for info in zip_file.infolist())


def get_repo_info(user, repo_id=None, repo_owner=None, repo_name=None):
    if user is None and (repo_owner is None or repo_name is None):
        raise TypeError("If user=None, you must call with repo_owner and repo_name")
    gh = gh_as_user(user) if user else gh_as_repo(repo_owner, repo_name)
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

            # Ensure the CumulusCI config is always up to date with the default branch
            # (even if the current branch has an old version)
            try:
                text = repo.file_contents(
                    "cumulusci.yml", ref=repo.default_branch
                ).decoded.decode("utf-8")
                pathlib.Path("cumulusci.yml").write_text(text)
            except (NotFoundError, IOError) as error:
                raise Exception(
                    "Failed to copy cumulusci.yml from default branch"
                ) from error

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


def try_to_make_branch(repository, *, new_branch, base_sha):
    branch_name = new_branch
    counter = 0
    max_length = 100  # From models.Epic.branch_name
    while True:
        suffix = f"-{counter}" if counter else ""
        branch_name = f"{new_branch[:max_length-len(suffix)]}{suffix}"
        try:
            repository.create_branch_ref(branch_name, base_sha)
            return branch_name
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
