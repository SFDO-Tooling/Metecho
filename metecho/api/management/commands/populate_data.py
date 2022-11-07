from django.core.management.base import BaseCommand

from ...models import Epic, Project, Task


class Command(BaseCommand):
    help = "Add some sample data to the database."

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
        branch_name = kwargs.pop("branch_name", "")
        project = Project.objects.create(
            name=name, description=description, branch_name=branch_name, **kwargs
        )
        return project

    def create_epic(self, **kwargs):
        name = kwargs.pop("name", "Sample Epic")
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
        return Epic.objects.create(name=name, description=description, **kwargs)

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
        metecho = self.create_project(
            name="CCI Food Bank",
            repo_owner="SFDO-Tooling",
            repo_name="CCI-Food-Bank",
            description=(
                "# Welcome to Metecho!\n\n"
                "It's a bank for food."
                "It might contain [links](https://install.salesforce.org)."
            ),
        )

        for i in range(55):
            self.create_epic(name=f"Sample Epic {i+1}", project=metecho)

        epic = self.create_epic(
            name="Epic With Tasks",
            description="This epic has tasks.",
            project=metecho,
        )

        for i in range(5):
            self.create_task(name=f"Sample Task {i+1}", epic=epic)
            self.create_task(name=f"Project-level Task {i +1}", project=metecho)
