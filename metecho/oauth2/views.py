import logging

from allauth.socialaccount import providers
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2CallbackView,
    OAuth2LoginView,
)
from allauth.utils import get_request_param

logger = logging.getLogger(__name__)


def ensure_socialapp_in_db(token):
    """Make sure that token is attached to a SocialApp in the db.

    Since we are using SocialApps constructed from settings,
    there are none in the db for tokens to be related to
    unless we create them here.
    """
    if token.app.pk is None:
        provider = providers.registry.get_class(token.app.provider)
        app, created = SocialApp.objects.get_or_create(
            provider=provider.id,
            name=provider.name,
            client_id="-",
        )
        token.app = app


class LoggingOAuth2LoginView(OAuth2LoginView):
    def dispatch(self, request, *args, **kwargs):
        ret = super().dispatch(request, *args, **kwargs)

        verifier = request.session["socialaccount_state"][1]
        logger.info(
            "Dispatching OAuth login",
            extra={"tag": "oauth", "context": {"verifier": verifier}},
        )

        return ret


class LoggingOAuth2CallbackView(OAuth2CallbackView):
    def dispatch(self, request, *args, **kwargs):
        verifier = get_request_param(request, "state")
        logger.info(
            "Dispatching OAuth callback",
            extra={"tag": "oauth", "context": {"verifier": verifier}},
        )
        return super().dispatch(request, *args, **kwargs)
