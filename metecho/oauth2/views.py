import logging

from allauth.socialaccount.providers.oauth2.views import (
    OAuth2CallbackView,
    OAuth2LoginView,
)
from allauth.utils import get_request_param

logger = logging.getLogger(__name__)


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
