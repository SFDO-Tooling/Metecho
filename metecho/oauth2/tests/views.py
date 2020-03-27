from ..views import LoggingOAuth2CallbackView, LoggingOAuth2LoginView


class TestLoggingOAuth2LoginView:
    def test_dispatch(self, rf, mocker):
        mocker.patch("metecho.oauth2.views.OAuth2LoginView.dispatch")
        logger = mocker.patch("metecho.oauth2.views.logger.info")
        request = rf.get("/")
        request.session = {"socialaccount_state": (None, "some-verifier")}

        LoggingOAuth2LoginView().dispatch(request)

        assert logger.called


class TestLoggingOAuth2CallbackView:
    def test_dispatch(self, rf, mocker):
        mocker.patch("metecho.oauth2.views.OAuth2CallbackView.dispatch")
        logger = mocker.patch("metecho.oauth2.views.logger.info")
        request = rf.get("/")
        request.session = {"state": "some-verifier"}

        LoggingOAuth2CallbackView().dispatch(request)

        assert logger.called
