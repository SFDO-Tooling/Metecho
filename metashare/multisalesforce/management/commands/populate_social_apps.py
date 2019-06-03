from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Populates the required Social Apps."

    def add_arguments(self, parser):
        parser.add_argument("--prod-id")
        parser.add_argument("--prod-secret")
        parser.add_argument("--test-id")
        parser.add_argument("--test-secret")
        parser.add_argument("--cust-id")
        parser.add_argument("--cust-secret")

    def _create_app(self, name, key, id, secret):
        app, _ = SocialApp.objects.get_or_create(
            provider=f"salesforce-{name}",
            defaults=dict(
                name=f"Salesforce {name.title()}", key=key, client_id=id, secret=secret
            ),
        )
        app.sites.set(Site.objects.all())

    def create_production_app(self, id, secret):
        self._create_app("production", "https://login.salesforce.com/", id, secret)

    def create_test_app(self, id, secret):
        self._create_app("test", "https://test.salesforce.com/", id, secret)

    def create_custom_app(self, id, secret):
        self._create_app("custom", "", id, secret)

    def handle(self, *args, **options):
        if options["prod_id"] and options["prod_secret"]:
            self.create_production_app(options["prod_id"], options["prod_secret"])
        if options["test_id"] and options["test_secret"]:
            self.create_test_app(options["test_id"], options["test_secret"])
        if options["cust_id"] and options["cust_secret"]:
            self.create_custom_app(options["cust_id"], options["cust_secret"])
