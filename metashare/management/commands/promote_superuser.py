from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Promotes a user to superuser status."

    def add_arguments(self, parser):
        parser.add_argument("emails", nargs="+")

    def handle(self, *args, **options):
        num = User.objects.filter(email__in=options["emails"]).update(
            is_superuser=True, is_staff=True
        )
        if num:
            self.stdout.write(self.style.SUCCESS("Promoted!"))
        else:
            self.stdout.write(self.style.ERROR("No such email(s)."))
