from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Adds necessary database entries for GitHub and Salesforce OAuth."

    def add_arguments(self, parser):
        parser.add_argument("--gh-id")
        parser.add_argument("--gh-secret")
        parser.add_argument("--sf-id")
        parser.add_argument("--sf-secret")

    def create_github_app(self, id, secret):
        app, _ = SocialApp.objects.get_or_create(
            provider="github", defaults=dict(name="GitHub", client_id=id, secret=secret)
        )
        app.sites.set(Site.objects.all())

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

    def create_custom_app(self, id, secret):
        self._create_app("custom", "", id, secret)

    def handle(self, *args, **options):
        if options["gh_id"] and options["gh_secret"]:
            self.create_github_app(options["gh_id"], options["gh_secret"])
        if options["sf_id"] and options["sf_secret"]:
            self.create_production_app(options["sf_id"], options["sf_secret"])
            self.create_custom_app(options["sf_id"], options["sf_secret"])
