import factory
import pytest
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from django.contrib.auth import get_user_model
from pytest_factoryboy import register
from rest_framework.test import APIClient

from sfdo_template_helpers.crypto import fernet_encrypt

from .api.models import GitHubRepository, Product, Project

User = get_user_model()


@register
class SocialAppFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialApp
        django_get_or_create = ("provider",)

    name = "GitHub"
    provider = "github"


@register
class SocialTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialToken

    token = fernet_encrypt("0123456789abcdef")
    token_secret = fernet_encrypt("secret.0123456789abcdef")
    app = factory.SubFactory(SocialAppFactory)


@register
class SocialAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialAccount

    provider = "github"
    uid = factory.Sequence("https://example.com/{}".format)
    socialtoken_set = factory.RelatedFactory(SocialTokenFactory, "account")
    extra_data = {
        "instance_url": "https://example.com",
        "organization_details": {
            "Id": "00Dxxxxxxxxxxxxxxx",
            "Name": "Sample Org",
            "OrganizationType": "Developer Edition",
            "IsSandbox": False,
        },
    }


@register
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence("user_{}@example.com".format)
    username = factory.Sequence("user_{}@example.com".format)
    password = factory.PostGenerationMethodCall("set_password", "foobar")
    socialaccount_set = factory.RelatedFactory(SocialAccountFactory, "user")


@register
class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    name = factory.Sequence("Product {}".format)


@register
class GitHubRepositoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubRepository

    url = "https://example.com/repo.git"
    user = factory.SubFactory(UserFactory)


@register
class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    name = factory.Sequence("Project {}".format)
    product = factory.SubFactory(ProductFactory)


@pytest.fixture
def client(user_factory):
    user = user_factory()
    client = APIClient()
    client.force_login(user)
    client.user = user
    return client


# @pytest.fixture
# def admin_api_client(user_factory):
#     user = user_factory(is_superuser=True)
#     client = APIClient()
#     client.force_login(user)
#     client.user = user
#     return client


# @pytest.fixture
# def anon_client():
#     return APIClient()
