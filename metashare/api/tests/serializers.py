import pytest

from ..serializers import ProductSerializer, ProjectSerializer


@pytest.mark.django_db
class TestProductSerializer:
    def test_validate_repo_url(self):
        serializer = ProductSerializer(
            data={
                "name": "Test name",
                "repo_url": "http://github.com/test/repo.git",
                "description": "",
                "is_managed": False,
            }
        )
        assert not serializer.is_valid()
        assert "repo_url" in serializer.errors


@pytest.mark.django_db
class TestProjectSerializer:
    def test_markdown_fields_input(self, product_factory):
        product = product_factory()
        serializer = ProjectSerializer(
            data={
                "name": "Test project",
                "description": "Test `project`",
                "branch_name": "some-branch",
                "product": str(product.id),
            }
        )
        assert serializer.is_valid()
        project = serializer.save()
        assert project.description_markdown == "<p>Test <code>project</code></p>"

    def test_markdown_fields_output(self, project_factory):
        project = project_factory(name="Test project", description="Test `project`")
        serializer = ProjectSerializer(project)
        assert serializer.data["description"] == "<p>Test <code>project</code></p>"

    def test_branchUrl(self, project_factory):
        project = project_factory(
            name="Test project",
            description="Test `project`",
            branch_name="test-project",
        )
        serializer = ProjectSerializer(project)
        assert (
            serializer.data["branch_url"]
            == "https://www.github.com/test/repo/tree/test-project"
        )
