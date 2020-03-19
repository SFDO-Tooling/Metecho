from ..adapter import CustomSocialAccountAdapter


def test_authentication_error_logs(mocker):
    mocker.patch(
        "allauth.socialaccount.adapter.DefaultSocialAccountAdapter.authentication_error"
    )  # noqa
    error = mocker.patch("metashare.oauth2.adapter.logger.error")
    adapter = CustomSocialAccountAdapter()
    adapter.authentication_error()
    assert error.called
