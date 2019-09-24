from contextlib import ExitStack
from unittest.mock import MagicMock, patch

from ..sf_org_changes import compare_revisions, get_latest_revision_numbers

PATCH_ROOT = "metashare.api.sf_org_changes"


def test_get_latest_revision_numbers():
    with ExitStack() as stack:
        Salesforce = stack.enter_context(
            patch(f"{PATCH_ROOT}.simple_salesforce.Salesforce")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))

        conn = MagicMock()
        Salesforce.return_value = conn

        scratch_org = MagicMock()
        scratch_org.task.project.repository.repo_url = "https://github.com/test/repo"

        get_latest_revision_numbers(scratch_org=scratch_org)

        assert conn.query_all.called


def test_compare_revisions__true():
    old = {}
    new = {"type:name": 1}
    assert compare_revisions(old, new)


def test_compare_revisions__false():
    old = {"type:name": 1}
    new = {"type:name": 1}
    assert not compare_revisions(old, new)
