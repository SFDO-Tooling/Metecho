from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter

from ..views import (
    LoggingOAuth2CallbackView,
    LoggingOAuth2LoginView,
    ensure_socialapp_in_db,
)


class CustomGitHubOAuth2Adapter(GitHubOAuth2Adapter):
    """GitHub adapter that can handle the app being configured in settings"""

    def complete_login(self, request, app, token, **kwargs):
        # make sure token is attached to a SocialApp in the db
        ensure_socialapp_in_db(token)
        return super().complete_login(request, app, token, **kwargs)


oauth2_login = LoggingOAuth2LoginView.adapter_view(CustomGitHubOAuth2Adapter)
oauth2_callback = LoggingOAuth2CallbackView.adapter_view(CustomGitHubOAuth2Adapter)
