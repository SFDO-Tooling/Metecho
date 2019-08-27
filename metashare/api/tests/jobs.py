from unittest.mock import patch

from ..jobs import create_scratch_org


def test_create_scratch_org():
    scratch_org = None
    user = None
    with patch("metashare.api.jobs.make_scratch_org") as make_scratch_org:
        create_scratch_org(
            scratch_org,
            user=user,
            repo_url="https://github.com/test/repo",
            commit_ish="master",
        )
        assert make_scratch_org.called
