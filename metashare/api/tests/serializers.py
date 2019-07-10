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
    def test_markdown_fields_input(self):
        serializer = ProjectSerializer(
            data={
                "name": "Test project",
                "pr_url": "https://github.com/test/repo/pull/1",
                "description": "Test `project`",
                "commit_message": "Test _project_",
                "release_notes": "Test *project*",
            }
        )
        assert serializer.is_valid()
        project = serializer.save()
        assert project.description_markdown == "<p>Test <code>project</code></p>"
        assert project.commit_message_markdown == "<p>Test <em>project</em></p>"
        assert project.release_notes_markdown == "<p>Test <em>project</em></p>"

    def test_markdown_fields_output(self, project_factory):
        project = project_factory(
            name="Test project",
            pr_url="https://github.com/test/repo/pull/1",
            description="Test `project`",
            commit_message="Test _project_",
            release_notes="Test *project*",
        )
        serializer = ProjectSerializer(project)
        assert serializer.data["description"] == "<p>Test <code>project</code></p>"
        assert serializer.data["commit_message"] == "<p>Test <em>project</em></p>"
        assert serializer.data["release_notes"] == "<p>Test <em>project</em></p>"
