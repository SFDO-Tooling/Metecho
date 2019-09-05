from cumulusci.core.config import BaseGlobalConfig, BaseProjectConfig
from cumulusci.core.runtime import BaseCumulusCI


class ProjectConfig(BaseProjectConfig):
    def __init__(
        self,
        global_config_obj,
        *args,
        repo_root,
        repo_name,
        repo_url,
        repo_owner,
        repo_branch,
        repo_commit,
        **kwargs,
    ):
        self._repo_root = repo_root
        self._repo_name = repo_name
        self._repo_url = repo_url
        self._repo_owner = repo_owner
        self._repo_branch = repo_branch
        self._repo_commit = repo_commit

        super().__init__(global_config_obj, *args, **kwargs)

    @property
    def config_project_local_path(self):
        """ MetaShare never uses the local path """
        return

    @property
    def repo_root(self):
        return self._repo_root

    @property
    def repo_name(self):
        return self._repo_name

    @property
    def repo_url(self):
        return self._repo_url

    @property
    def repo_owner(self):
        return self._repo_owner

    @property
    def repo_branch(self):
        return self._repo_branch

    @property
    def repo_commit(self):
        return self._repo_commit


class GlobalConfig(BaseGlobalConfig):
    project_config_class = ProjectConfig

    @property
    def config_global_local_path(self):
        """ MetaShare never uses the local path """
        return

    def get_project_config(
        self, *, repo_root, repo_name, repo_url, repo_owner, repo_branch, repo_commit
    ):
        kwargs = {
            "repo_root": repo_root,
            "repo_name": repo_name,
            "repo_url": repo_url,
            "repo_owner": repo_owner,
            "repo_branch": repo_branch,
            "repo_commit": repo_commit,
        }

        return self.project_config_class(self, **kwargs)


class MetaShareCCI(BaseCumulusCI):
    project_config_class = ProjectConfig
