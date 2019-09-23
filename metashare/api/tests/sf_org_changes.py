from contextlib import ExitStack
from unittest.mock import MagicMock, patch

from ..sf_org_changes import sf_org_has_changes

PATCH_ROOT = "metashare.api.sf_org_changes"


def test_sf_org_has_changes():
    with ExitStack() as stack:
        get_simple_salesforce_connection = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_simple_salesforce_connection")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
        stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
        stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))

        conn = MagicMock()
        get_simple_salesforce_connection.return_value = conn

        scratch_org = MagicMock()
        scratch_org.task.project.repository.repo_url = "https://github.com/test/repo"

        sf_org_has_changes(scratch_org=scratch_org, user=MagicMock())

        assert conn.query_all.called
