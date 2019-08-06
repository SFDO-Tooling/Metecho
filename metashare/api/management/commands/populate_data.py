from django.core.management.base import BaseCommand

from ...models import Product, Project, Task


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

    def create_project(self, **kwargs):
        name = kwargs.pop("name", "Sample Project")
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
        return Project.objects.create(name=name, description=description, **kwargs)

    def create_task(self, **kwargs):
        name = kwargs.pop("name", "Sample Task")
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
        return Task.objects.create(name=name, description=description, **kwargs)

    def handle(self, *args, **options):
        metashare = self.create_product(
            name="MetaShare",
            repo_url="https://www.github.com/SFDO-Tooling/MetaShare",
            description=(
                f"# Welcome to Meta(Meta)Share!\n\n"
                "This is a description of the product. "
                "It might contain [links](https://install.salesforce.org)."
            ),
        )
        self.create_product(
            name="MetaDeploy", repo_url="https://www.github.com/SFDO-Tooling/MetaDeploy"
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

        for i in range(55):
            self.create_project(name=f"Sample Project {i}", product=metashare)

        project = self.create_project(
            name="Project With Tasks",
            description="This project has a task.",
            product=metashare,
        )
        self.create_task(project=project)
