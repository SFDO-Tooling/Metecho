from io import StringIO

import pytest
from allauth.socialaccount.models import SocialApp
from django.core.management import call_command


@pytest.mark.django_db
def test_populate_social_apps__success():
    out = StringIO()
    call_command(
        "populate_social_apps",
        stdout=out,
        gh_id="gh-id",
        gh_secret="gh-secret",
        sf_id="sf-id",
        sf_secret="sf-secret",
    )

    gh = SocialApp.objects.get(name="GitHub")
    sf = SocialApp.objects.get(name="Salesforce Production")

    assert sf.provider == "salesforce-production"
    assert sf.client_id == "sf-id"
    assert sf.secret == "sf-secret"
    assert sf.key == "https://login.salesforce.com/"
    assert sf.sites.exists()

    assert gh.provider == "github"
    assert gh.client_id == "gh-id"
    assert gh.secret == "gh-secret"
    assert gh.key == ""
    assert gh.sites.exists()
