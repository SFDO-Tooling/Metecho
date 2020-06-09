from django.core.management.base import BaseCommand

from ...models import Project, Repository, Task


class Command(BaseCommand):
    help = "Add some sample data to the database."

    def create_repository(self, **kwargs):
        name = kwargs.pop("name", "Sample Repository")
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
        repository = Repository.objects.create(
            name=name, description=description, **kwargs
        )
        return repository

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
        org_config_name = kwargs.pop("org_config_name", "dev")
        return Task.objects.create(
            name=name,
            description=description,
            org_config_name=org_config_name,
            **kwargs,
        )

    def handle(self, *args, **options):
        metecho = self.create_repository(
            name="Metecho-Test",
            repo_owner="oddbird",
            repo_name="Metecho-Test",
            description=(
                "# Welcome to Metecho!\n\n"
                "This is a description of the repository. "
                "It might contain [links](https://install.salesforce.org)."
            ),
        )
        self.create_repository(
            name="Metecho", repo_owner="SFDO-Tooling", repo_name="Metecho"
        )
        self.create_repository(
            name="MetaDeploy", repo_owner="SFDO-Tooling", repo_name="MetaDeploy"
        )
        self.create_repository(
            name="CumulusCI", repo_owner="SFDO-Tooling", repo_name="CumulusCI"
        )
        self.create_repository(
            name="MetaCI", repo_owner="SFDO-Tooling", repo_name="MetaCI"
        )
        self.create_repository(
            name="Mister Belvedere", repo_owner="SFDO-Tooling", repo_name="mrbelvedere"
        )
        self.create_repository(
            name="SFDO Template", repo_owner="SFDO-Tooling", repo_name="sfdo-template"
        )
        self.create_repository(
            name="SFDO Template Helpers",
            repo_owner="SFDO-Tooling",
            repo_name="sfdo-template-helpers",
        )
        self.create_repository(
            name="OddSite", repo_owner="oddbird", repo_name="oddsite"
        )
        self.create_repository(name="Books", repo_owner="oddbird", repo_name="books")
        self.create_repository(name="True", repo_owner="oddbird", repo_name="true")
        self.create_repository(name="Susy", repo_owner="oddbird", repo_name="susy")
        self.create_repository(
            name="Herman", repo_owner="oddbird", repo_name="sassdoc-theme-herman"
        )
        self.create_repository(
            name="Accoutrement", repo_owner="oddbird", repo_name="accoutrement"
        )

        for i in range(55):
            self.create_project(name=f"Sample Project {i+1}", repository=metecho)

        project = self.create_project(
            name="Project With Tasks",
            description="This project has tasks.",
            repository=metecho,
        )

        for i in range(5):
            self.create_task(name=f"Sample Task {i+1}", project=project)
