import logging

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

logger = logging.getLogger(__name__)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def on_authentication_error(self, *args, **kwargs):
        """Make sure that auth errors get logged"""
        logger.error(f"Social Account authentication error: {args}, {kwargs}")
        return super().on_authentication_error(*args, **kwargs)
