from django.core.management.base import BaseCommand

from ...models import Product


class Command(BaseCommand):
    help = "Add some sample data to the database."

    def create_product(self, **kwargs):
        name = kwargs.pop("name", "Sample Product")
        description = kwargs.pop(
            "description",
            (
                f"Description for {name}: "
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
                "sed do eiusmod tempor incididunt ut labore et dolore "
                "magna aliqua. Tellus elementum sagittis vitae et leo "
                "duis ut diam. Sem fringilla ut morbi tincidunt augue "
                "interdum velit euismod. Volutpat est velit egestas dui "
                "id ornare arcu. Viverra tellus in hac habitasse platea "
                "dictumst. Nulla facilisi etiam dignissim diam."
            ),
        )
        product = Product.objects.create(name=name, description=description, **kwargs)
        return product

    def handle(self, *args, **options):
        self.create_product(
            name="MetaDeploy", repo_url="https://www.github.com/SFDO-Tooling/MetaDeploy"
        )
        self.create_product(
            name="MetaShare",
            repo_url="https://www.github.com/SFDO-Tooling/MetaShare",
            description=(
                f"# Welcome to Meta(Meta)Share!\n\n"
                "This is a description of the product. "
                "It might contain [links](https://install.salesforce.org)."
            ),
        )
        self.create_product(
            name="CumulusCI", repo_url="https://www.github.com/SFDO-Tooling/CumulusCI"
        )
        self.create_product(
            name="MetaCI", repo_url="https://www.github.com/SFDO-Tooling/MetaCI"
        )
        self.create_product(
            name="Mister Belvedere",
            repo_url="https://www.github.com/SFDO-Tooling/mrbelvedere",
        )
        self.create_product(
            name="SFDO Template",
            repo_url="https://www.github.com/SFDO-Tooling/sfdo-template",
        )
        self.create_product(
            name="SFDO Template Helpers",
            repo_url="https://www.github.com/SFDO-Tooling/sfdo-template-helpers",
        )
        self.create_product(
            name="OddSite", repo_url="https://www.github.com/oddbird/oddsite"
        )
        self.create_product(
            name="Books", repo_url="https://www.github.com/oddbird/books"
        )
        self.create_product(name="True", repo_url="https://www.github.com/oddbird/true")
        self.create_product(name="Susy", repo_url="https://www.github.com/oddbird/susy")
        self.create_product(
            name="Herman",
            repo_url="https://www.github.com/oddbird/sassdoc-theme-herman",
        )
        self.create_product(
            name="Accoutrement", repo_url="https://www.github.com/oddbird/accoutrement"
        )
