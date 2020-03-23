from unittest import mock

import pytest
from allauth.socialaccount.models import SocialApp

from ..views import CustomGitHubOAuth2Adapter


class TestGitHubOAuth2Adapter:
    @pytest.mark.django_db
    def test_complete_login(self, mocker, rf):
        mocker.patch("metashare.oauth2.github.views.GitHubOAuth2Adapter.complete_login")
        token = mock.MagicMock(app=SocialApp(provider="github"))
        request = rf.get("/")
        adapter = CustomGitHubOAuth2Adapter(request)
        adapter.complete_login(request, None, token)

        # make sure this created a SocialApp in the db
        assert token.app.pk is not None
