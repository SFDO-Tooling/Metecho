import factory
import pytest
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from django.contrib.auth import get_user_model
from pytest_factoryboy import register
from rest_framework.test import APIClient
from sfdo_template_helpers.crypto import fernet_encrypt

from .api.models import Epic, GitHubRepository, Project, ScratchOrg, Task

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
    token_secret = "secret.0123456789abcdef"
    app = factory.SubFactory(SocialAppFactory)


@register
class SocialAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialAccount

    provider = "github"
    uid = factory.Sequence("{}".format)
    socialtoken_set = factory.RelatedFactory(SocialTokenFactory, "account")
    extra_data = {
        "instance_url": "https://example.com",
        "organization_id": "00Dxxxxxxxxxxxxxxx",
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
class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    name = factory.Sequence("Project {}".format)
    repo_owner = factory.Sequence("user_{}".format)
    repo_name = factory.Sequence("repo_{}".format)
    repo_id = factory.Sequence(lambda n: n)
    branch_name = "main"
    latest_sha = "abcd1234"


@register
class GitHubRepositoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubRepository

    repo_url = "https://github.com/test/repo.git"
    repo_id = factory.Sequence(lambda n: n)
    user = factory.SubFactory(UserFactory)


@register
class EpicFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Epic

    name = factory.Sequence("Epic {}".format)
    project = factory.SubFactory(ProjectFactory)


@register
class TaskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Task

    name = factory.Sequence("Task {}".format)
    org_config_name = "dev"

    @factory.post_generation
    def epic(obj, create, extracted, **kwargs):
        # Creates an optional Subfactory:
        # - No epic: task_factory()
        # - Epic with default factory values: task_factory(epic=True)
        # - Epic with custom values: task_factory(epic__name="Foo")
        # - Existing epic instance: task_factory(epic=Epic.objects.get(...))
        if not (create and extracted or kwargs):
            return
        obj.epic = extracted if isinstance(extracted, Epic) else EpicFactory(**kwargs)
        obj.save()

    @factory.post_generation
    def project(obj, create, extracted, **kwargs):
        # Same as `epic()`, but for projects
        if not (create and extracted or kwargs):
            return
        obj.project = (
            extracted if isinstance(extracted, Project) else ProjectFactory(**kwargs)
        )
        obj.save()


@register
class ScratchOrgFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ScratchOrg

    task = factory.SubFactory(TaskFactory)
    owner = factory.SubFactory(UserFactory)
    org_type = "Dev"
    org_config_name = "dev"
    valid_target_directories = {"source": []}


@pytest.fixture
def client(user_factory):
    user = user_factory()
    client = APIClient()
    client.force_login(user)
    client.user = user
    return client
