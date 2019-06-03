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
        prod_id="prod-id",
        prod_secret="prod-secret",
        test_id="test-id",
        test_secret="test-secret",
        cust_id="cust-id",
        cust_secret="cust-secret",
    )

    prod = SocialApp.objects.get(name="Salesforce Production")
    test = SocialApp.objects.get(name="Salesforce Test")
    cust = SocialApp.objects.get(name="Salesforce Custom")

    assert prod.provider == "salesforce-production"
    assert prod.client_id == "prod-id"
    assert prod.secret == "prod-secret"
    assert prod.key == "https://login.salesforce.com/"
    assert prod.sites.exists()

    assert test.provider == "salesforce-test"
    assert test.client_id == "test-id"
    assert test.secret == "test-secret"
    assert test.key == "https://test.salesforce.com/"
    assert test.sites.exists()

    assert cust.provider == "salesforce-custom"
    assert cust.client_id == "cust-id"
    assert cust.secret == "cust-secret"
    assert cust.key == ""
    assert cust.sites.exists()
