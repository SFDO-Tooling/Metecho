from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions

from .gh import validate_gh_hook_signature

User = get_user_model()


class GitHubHookAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        valid_signature = validate_gh_hook_signature(
            hook_secret=settings.GITHUB_HOOK_SECRET,
            signature=request.META.get("HTTP_X_HUB_SIGNATURE", ""),
            message=request.body,
        )
        if not valid_signature:
            raise exceptions.AuthenticationFailed("Invalid signature")
        user = User.objects.get_or_create_github_user()
        return (user, None)
