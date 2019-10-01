from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest

from ..sf_org_changes import (
    build_package_xml,
    commit_changes_to_github,
    compare_revisions,
    get_latest_revision_numbers,
    run_retrieve_task,
)

PATCH_ROOT = "metashare.api.sf_org_changes"


def test_build_package_xml():
    with patch(f"{PATCH_ROOT}.open") as open_mock:
        scratch_org = MagicMock(unsaved_changes=["test:value"])
        desired_changes = {"name": ["member"]}
        build_package_xml(scratch_org, "package_xml_path", desired_changes)

        assert open_mock.called


@pytest.mark.django_db
def test_run_retrieve_task(user_factory, scratch_org_factory):
    user = user_factory()
    scratch_org = scratch_org_factory()
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))
        stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
        stack.enter_context(patch(f"{PATCH_ROOT}.build_package_xml"))
        RetrieveUnpackaged = stack.enter_context(
            patch(f"{PATCH_ROOT}.RetrieveUnpackaged")
        )

        desired_changes = {"name": ["member"]}
        run_retrieve_task(user, scratch_org, ".", desired_changes)

        assert RetrieveUnpackaged.called


@pytest.mark.django_db
def test_commit_changes_to_github(user_factory, scratch_org_factory):
    user = user_factory()
    scratch_org = scratch_org_factory()
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
        stack.enter_context(patch(f"{PATCH_ROOT}.run_retrieve_task"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        CommitDir = stack.enter_context(patch(f"{PATCH_ROOT}.CommitDir"))

        desired_changes = {"name": ["member"]}
        commit_changes_to_github(
            user=user,
            scratch_org=scratch_org,
            repo_url="https://github.com/user/repo",
            branch="test-branch",
            desired_changes=desired_changes,
        )

        assert CommitDir.called


def test_get_latest_revision_numbers():
    with ExitStack() as stack:
        Salesforce = stack.enter_context(
            patch(f"{PATCH_ROOT}.simple_salesforce.Salesforce")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))

        conn = MagicMock()
        conn.query_all.return_value = {
            "records": [
                {
                    "MemberType": "some-type-1",
                    "MemberName": "some-name-1",
                    "RevisionNum": 3,
                },
                {
                    "MemberType": "some-type-1",
                    "MemberName": "some-name-2",
                    "RevisionNum": 3,
                },
                {
                    "MemberType": "some-type-2",
                    "MemberName": "some-name-1",
                    "RevisionNum": 3,
                },
                {
                    "MemberType": "some-type-2",
                    "MemberName": "some-name-2",
                    "RevisionNum": 3,
                },
            ]
        }
        Salesforce.return_value = conn

        scratch_org = MagicMock()
        scratch_org.task.project.repository.repo_url = "https://github.com/test/repo"

        get_latest_revision_numbers(scratch_org=scratch_org)

        assert conn.query_all.called


def test_compare_revisions__true():
    old = {}
    new = {"type": {"name": 1}}
    assert compare_revisions(old, new)


def test_compare_revisions__false():
    old = {"type": {"name": 1}}
    new = {"type": {"name": 1}}
    assert not compare_revisions(old, new)
