from unittest.mock import MagicMock, patch

import pytest

from ..serializers import (
    HashidPrimaryKeyRelatedField,
    ProjectSerializer,
    RepositorySerializer,
    ScratchOrgSerializer,
    TaskSerializer,
)


class TestHashidPrimaryKeyRelatedField:
    def test_with_pk_field(self):
        pk_field = MagicMock()
        pk_field.to_representation.return_value = 1
        field = HashidPrimaryKeyRelatedField(read_only=True, pk_field=pk_field)
        val = MagicMock(pk=1)
        assert field.to_representation(val) == 1

    def test_without_pk_field(self):
        field = HashidPrimaryKeyRelatedField(read_only=True)
        val = MagicMock(pk=1)
        assert field.to_representation(val) == "1"


@pytest.mark.django_db
class TestRepositorySerializer:
    def test_validate_repo_url(self):
        serializer = RepositorySerializer(
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
    def test_markdown_fields_input(self, rf, user_factory, repository_factory):
        request = rf.post("/")
        request.user = user_factory()
        repository = repository_factory()
        serializer = ProjectSerializer(
            data={
                "name": "Test project",
                "description": "Test `project`",
                "branch_name": "some-branch",
                "repository": str(repository.id),
            },
            context={"request": request},
        )
        assert serializer.is_valid()

        with patch("metashare.api.gh.login") as login:
            repo = MagicMock()
            repo.url = "test"
            gh = MagicMock()
            gh.repositories.return_value = [repo]
            login.return_value = gh
            project = serializer.save()

        assert project.description_markdown == "<p>Test <code>project</code></p>"

    def test_markdown_fields_output(self, project_factory):
        project = project_factory(name="Test project", description="Test `project`")
        serializer = ProjectSerializer(project)
        assert serializer.data["description"] == "<p>Test <code>project</code></p>"

    def test_branch_url(self, project_factory):
        project = project_factory(name="Test project", description="Test `project`")
        serializer = ProjectSerializer(project)
        expected = "https://www.github.com/test/repo/tree/test-project"
        assert serializer.data["branch_url"] == expected

    def test_unique_name_for_repository(self, repository_factory, project_factory):
        repository = repository_factory()
        project_factory(repository=repository, name="Duplicate me")
        serializer = ProjectSerializer(
            data={
                "repository": str(repository.id),
                "name": "Duplicate Me",
                "description": "Blorp",
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["non_field_errors"]] == [
            "A project with this name already exists."
        ]

    def test_unique_name_for_repository__case_insensitive(
        self, repository_factory, project_factory
    ):
        repository = repository_factory()
        project_factory(repository=repository, name="Duplicate me")
        serializer = ProjectSerializer(
            data={
                "repository": str(repository.id),
                "name": "duplicate me",
                "description": "Blorp",
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["non_field_errors"]] == [
            "A project with this name already exists."
        ]

    def test_unique_name_for_repository__case_insensitive__update(
        self, repository_factory, project_factory
    ):
        repository = repository_factory()
        project = project_factory(repository=repository, name="Duplicate me")
        serializer = ProjectSerializer(
            instance=project,
            data={"repository": str(repository.id), "description": "Blorp"},
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestTaskSerializer:
    def test_branch_url(self, task_factory):
        task = task_factory(name="Test task")
        serializer = TaskSerializer(task)
        expected = "https://www.github.com/test/repo/tree/test-task"
        assert serializer.data["branch_url"] == expected


@pytest.mark.django_db
def test_ScratchOrgSerializer(rf, user_factory, task_factory):
    user = user_factory()
    task = task_factory()

    r = rf.get("/")
    r.user = user

    serializer = ScratchOrgSerializer(
        data={"task": str(task.id), "org_type": "Dev"}, context={"request": r}
    )
    assert serializer.is_valid()
    create_branches_on_github_then_create_scratch_org_job = (
        "metashare.api.jobs.create_branches_on_github_then_create_scratch_org_job"
    )
    with patch(create_branches_on_github_then_create_scratch_org_job):
        instance = serializer.save()

    assert instance.owner == user
