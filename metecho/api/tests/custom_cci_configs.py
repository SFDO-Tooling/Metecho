from contextlib import ExitStack
from unittest.mock import patch

from ..custom_cci_configs import GlobalConfig, ProjectConfig


def test_project_config():
    with patch("metecho.api.custom_cci_configs.BaseProjectConfig.__init__") as init:
        init.return_value = None
        project_config = ProjectConfig(
            {},
            repo_root="repo_root",
            repo_name="repo_name",
            repo_url="repo_url",
            repo_owner="repo_owner",
            repo_branch="repo_branch",
            repo_commit="repo_commit",
        )

        assert project_config.config_project_local_path is None
        assert project_config.repo_root == "repo_root"
        assert project_config.repo_name == "repo_name"
        assert project_config.repo_url == "repo_url"
        assert project_config.repo_owner == "repo_owner"
        assert project_config.repo_branch == "repo_branch"
        assert project_config.repo_commit == "repo_commit"


def test_global_config():
    with ExitStack() as stack:
        project_init = stack.enter_context(
            patch("metecho.api.custom_cci_configs.BaseProjectConfig.__init__")
        )
        global_init = stack.enter_context(
            patch("metecho.api.custom_cci_configs.BaseGlobalConfig.__init__")
        )
        project_init.return_value = None
        global_init.return_value = None
        global_config = GlobalConfig()

        assert global_config.config_global_local_path is None
