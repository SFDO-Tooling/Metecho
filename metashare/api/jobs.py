import itertools
import logging
import os
import shutil
import zipfile
from glob import glob
from urllib.parse import urlparse

import github3
from cumulusci.core.config import BaseProjectConfig, ScratchOrgConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.utils import temporary_dir
from django.conf import settings
from django_rq import job

logger = logging.getLogger(__name__)


def extract_user_and_repo(gh_url):
    path = urlparse(gh_url).path
    _, user, repo, *_ = path.split("/")
    return user, repo


class MetadeployProjectConfig(BaseProjectConfig):
    def __init__(
        self, *args, repo_root=None, repo_url=None, commit_ish=None, **kwargs
    ):  # pragma: nocover

        user, repo_name = extract_user_and_repo(repo_url)

        repo_info = {
            "root": repo_root,
            "url": repo_url,
            "name": repo_name,
            "owner": user,
            "commit": commit_ish,
        }

        super().__init__(*args, repo_info=repo_info, **kwargs)


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig


def is_safe_path(path):
    return not os.path.isabs(path) and ".." not in path.split(os.path.sep)


def zip_file_is_safe(zip_file):
    return all(is_safe_path(info.filename) for info in zip_file.infolist())


def create_scratch_org(*, user, repo_url, commit_ish):
    token, token_secret = user.token
    organization_url = user.instance_url

    org_config = ScratchOrgConfig(
        {"config_file": "orgs/dev.json", "scratch": True}, "dev"
    )
    org_config.create_scratch_org()
    # with temporary_dir() as tmpdirname:
    #     # Let's clone the repo locally:
    #     gh = github3.login(token=settings.GITHUB_TOKEN)
    #     user, repo_name = extract_user_and_repo(repo_url)
    #     repo = gh.repository(user, repo_name)
    #     # Make sure we have the actual owner/repo name if we were redirected
    #     user = repo.owner.login
    #     repo_name = repo.name
    #     zip_file_name = "archive.zip"
    #     repo.archive("zipball", path=zip_file_name, ref=commit_ish)
    #     zip_file = zipfile.ZipFile(zip_file_name)
    #     if not zip_file_is_safe(zip_file):
    #         # This is very unlikely, as we get the zipfile from GitHub,
    #         # but must be considered:
    #         url = f"https://github.com/{user}/{repo_name}#{commit_ish}"
    #         logger.error(f"Malformed or malicious zip file from {url}.")
    #         return
    #     zip_file.extractall()
    #     # We know that the zipball contains a root directory named
    #     # something like this by GitHub's convention. If that ever
    #     # breaks, this will break:
    #     zipball_root = glob(f"{user}-{repo_name}-*")[0]
    #     # It's not unlikely that the zipball root contains a directory
    #     # with the same name, so we pre-emptively rename it to probably
    #     # avoid collisions:
    #     shutil.move(zipball_root, "zipball_root")
    #     for path in itertools.chain(glob("zipball_root/*"), glob("zipball_root/.*")):
    #         shutil.move(path, ".")
    #     shutil.rmtree("zipball_root")

    #     ctx = MetaDeployCCI(
    #         repo_root=tmpdirname, repo_url=repo_url, commit_ish=commit_ish
    #     )
    #     ctx.keychain.get_org(org_config)


create_scratch_org_job = job(create_scratch_org)
