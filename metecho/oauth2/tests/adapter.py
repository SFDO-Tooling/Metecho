from ..adapter import CustomSocialAccountAdapter


def test_authentication_error_logs(mocker):
    mocker.patch(
        "allauth.socialaccount.adapter.DefaultSocialAccountAdapter.on_authentication_error"
    )  # noqa
    error = mocker.patch("metecho.oauth2.adapter.logger.error")
    adapter = CustomSocialAccountAdapter()
    adapter.authentication_error()
    assert error.called
