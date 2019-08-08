from unittest.mock import MagicMock, patch

import pytest

from ..serializers import (
    HashidPrimaryKeyRelatedField,
    ProductSerializer,
    ProjectSerializer,
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
    def test_markdown_fields_input(self, rf, user_factory, product_factory):
        request = rf.post("/")
        request.user = user_factory()
        product = product_factory()
        serializer = ProjectSerializer(
            data={
                "name": "Test project",
                "description": "Test `project`",
                "branch_name": "some-branch",
                "product": str(product.id),
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

    def test_unique_name_for_product(self, product_factory, project_factory):
        product = product_factory()
        project_factory(product=product, name="Duplicate me")
        serializer = ProjectSerializer(
            data={
                "product": str(product.id),
                "name": "Duplicate Me",
                "description": "Blorp",
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["non_field_errors"]] == [
            "A project with this name already exists."
        ]

    def test_unique_name_for_product__case_insensitive(
        self, product_factory, project_factory
    ):
        product = product_factory()
        project_factory(product=product, name="Duplicate me")
        serializer = ProjectSerializer(
            data={
                "product": str(product.id),
                "name": "duplicate me",
                "description": "Blorp",
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["non_field_errors"]] == [
            "A project with this name already exists."
        ]

    def test_unique_name_for_product__case_insensitive__update(
        self, product_factory, project_factory
    ):
        product = product_factory()
        project = project_factory(product=product, name="Duplicate me")
        serializer = ProjectSerializer(
            instance=project,
            data={
                "product": str(product.id),
                "name": "duplicate me",
                "description": "Blorp",
            },
        )
        assert serializer.is_valid()
