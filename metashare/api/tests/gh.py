from unittest.mock import MagicMock, patch

import pytest

from ..gh import get_all_org_repos


@pytest.mark.django_db
class TestGetAllOrgRepos:
    def test_good_social_auth(self, user_factory):
        user = user_factory()
        with patch("metashare.api.gh.login") as login:
            repo = MagicMock()
            repo.url = "test"
            gh = MagicMock()
            gh.repositories.return_value = [repo]
            login.return_value = gh
            assert get_all_org_repos(user) == {"https://www.github.com/test"}

    def test_bad_social_auth(self, user_factory):
        user = user_factory(socialaccount_set=[])
        assert get_all_org_repos(user) == set()
