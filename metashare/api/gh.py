"""
GitHub utilities
"""

import contextlib
import hmac
import itertools
import logging
import os
import shutil
import zipfile
from glob import glob

from cumulusci.utils import temporary_dir
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from github3 import login
from github3.exceptions import UnprocessableEntity

from .custom_cci_configs import GlobalConfig

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


def get_all_org_repos(user):
    gh = gh_given_user(user)
    repos = set(
        [repo for repo in gh.repositories() if repo.permissions.get("push", False)]
    )
    return repos


def is_safe_path(path):
    return not os.path.isabs(path) and ".." not in path.split(os.path.sep)


def zip_file_is_safe(zip_file):
    return all(is_safe_path(info.filename) for info in zip_file.infolist())


def get_repo_info(user, repo_id=None, repo_owner=None, repo_name=None):
    gh = gh_given_user(user)
    if repo_id is None:
        return gh.repository(repo_owner, repo_name)
    return gh.repository_with_id(repo_id)


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
            yield repo_root


def get_cumulus_prefix(**kwargs):
    """
    Expects to be in a local_github_checkout.
    """
    global_config = GlobalConfig()
    project_config = global_config.get_project_config(**kwargs)
    return project_config.project__git__prefix_feature


def try_to_make_branch(repository, *, new_branch, base_branch):
    branch_name = new_branch
    counter = 0
    max_length = 100  # From models::Project.branch_name
    while True:
        suffix = f"-{counter}" if counter else ""
        branch_name = f"{new_branch[:max_length-len(suffix)]}{suffix}"
        try:
            latest_sha = repository.branch(base_branch).latest_sha()
            repository.create_branch_ref(branch_name, latest_sha)
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
    print("\033[1;92m======>", local_signature, "\033[0m")
    return hmac.compare_digest(local_signature, signature)
