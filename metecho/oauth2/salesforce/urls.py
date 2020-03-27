from allauth.socialaccount.providers.oauth2.urls import default_urlpatterns

from .provider import CustomSalesforceProvider

urlpatterns = default_urlpatterns(CustomSalesforceProvider)
