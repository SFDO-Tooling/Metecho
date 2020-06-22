from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest

from ..models import SCRATCH_ORG_TYPES, Task
from ..serializers import (
    FullUserSerializer,
    HashidPrimaryKeyRelatedField,
    ProjectSerializer,
    ScratchOrgSerializer,
    TaskSerializer,
)


@pytest.mark.django_db
class TestFullUserSerializer:
    def test_get_sf_username(self, user_factory, settings):
        settings.DEVHUB_USERNAME = "test username"
        user = user_factory()
        serializer = FullUserSerializer(user)
        assert serializer.data["sf_username"] is None


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
                "github_users": [],
            },
            context={"request": request},
        )
        assert serializer.is_valid()

        with ExitStack() as stack:
            gh_given_user = stack.enter_context(patch("metecho.api.gh.gh_given_user"))
            gh_module = stack.enter_context(patch("metecho.api.models.gh"))
            repo = MagicMock()
            repo.url = "test"
            gh = MagicMock()
            gh.repositories.return_value = [repo]
            gh_given_user.return_value = gh
            gh_module.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(number=123, closed_at=None, is_merged=False,)
                        for _ in range(1)
                    ),
                }
            )

            project = serializer.save()

        assert project.description_markdown == "<p>Test <code>project</code></p>"

    def test_markdown_fields_output(self, project_factory):
        project = project_factory(name="Test project", description="Test `project`")
        serializer = ProjectSerializer(project)
        assert (
            serializer.data["description_rendered"]
            == "<p>Test <code>project</code></p>"
        )

    def test_validate_branch_name__non_feature(self, repository_factory):
        repo = repository_factory()
        serializer = ProjectSerializer(
            data={
                "branch_name": "test__non-feature",
                "name": "Test",
                "repository": str(repo.id),
            }
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_validate_branch_name__already_used(
        self, repository_factory, project_factory
    ):
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metecho.api.models.gh"))
            gh.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(number=123, closed_at=None, is_merged=False,)
                        for _ in range(1)
                    ),
                }
            )

            repo = repository_factory()
            project_factory(branch_name="test")

        serializer = ProjectSerializer(
            data={"branch_name": "test", "name": "Test", "repository": str(repo.id)}
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_validate_branch_name__repo_default_branch(self, repository_factory):
        repo = repository_factory()
        serializer = ProjectSerializer(
            data={
                "branch_name": repo.branch_name,
                "name": "Test",
                "repository": str(repo.id),
            }
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_branch_url__present(self, project_factory):
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metecho.api.models.gh"))
            gh.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(number=123, closed_at=None, is_merged=False,)
                        for _ in range(1)
                    ),
                }
            )

            project = project_factory(
                name="Test project",
                description="Test `project`",
                branch_name="test-project",
            )
        serializer = ProjectSerializer(project)
        owner = project.repository.repo_owner
        name = project.repository.repo_name
        expected = f"https://github.com/{owner}/{name}/tree/test-project"
        assert serializer.data["branch_url"] == expected

    def test_branch_url__missing(self, project_factory):
        project = project_factory(name="Test project", description="Test `project`")
        serializer = ProjectSerializer(project)
        assert serializer.data["branch_url"] is None

    def test_unique_name_for_repository(self, repository_factory, project_factory):
        repository = repository_factory()
        project_factory(repository=repository, name="Duplicate me")
        serializer = ProjectSerializer(
            data={
                "repository": str(repository.id),
                "name": "Duplicate Me",
                "description": "Blorp",
                "github_users": [],
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["name"]] == [
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
                "github_users": [],
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["name"]] == [
            "A project with this name already exists."
        ]

    def test_unique_name_for_repository__case_insensitive__update(
        self, repository_factory, project_factory
    ):
        repository = repository_factory()
        project = project_factory(repository=repository, name="Duplicate me")
        serializer = ProjectSerializer(
            instance=project,
            data={
                "repository": str(repository.id),
                "description": "Blorp",
                "github_users": [],
            },
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors

    def test_invalid_github_user_value(self, repository_factory, project_factory):
        repository = repository_factory()
        project = project_factory(repository=repository, name="Duplicate me")
        serializer = ProjectSerializer(
            instance=project,
            data={
                "repository": str(repository.id),
                "description": "Blorp",
                "github_users": [{"test": "value"}],
            },
            partial=True,
        )
        assert not serializer.is_valid()
        assert "non_field_errors" in serializer.errors

    def test_pr_url__present(self, project_factory):
        project = project_factory(name="Test project", pr_number=123)
        serializer = ProjectSerializer(project)
        owner = project.repository.repo_owner
        name = project.repository.repo_name
        expected = f"https://github.com/{owner}/{name}/pull/123"
        assert serializer.data["pr_url"] == expected

    def test_pr_url__missing(self, project_factory):
        project = project_factory(name="Test project")
        serializer = ProjectSerializer(project)
        assert serializer.data["pr_url"] is None


@pytest.mark.django_db
class TestTaskSerializer:
    def test_create(self, rf, user_factory, project_factory):
        user = user_factory()
        project = project_factory()
        data = {
            "name": "Test Task",
            "description": "Description.",
            "project": str(project.id),
            "assigned_dev": {"test": "id"},
            "assigned_qa": {"test": "id"},
            "should_alert_dev": False,
            "should_alert_qa": False,
            "org_config_name": "dev",
        }
        r = rf.get("/")
        r.user = user
        serializer = TaskSerializer(data=data, context={"request": r})
        assert serializer.is_valid(), serializer.errors
        serializer.save()
        assert Task.objects.count() == 1

    def test_update(self, rf, user_factory, task_factory, scratch_org_factory):
        user = user_factory()
        task = task_factory(commits=["abc123"])
        so1 = scratch_org_factory(task=task, org_type=SCRATCH_ORG_TYPES.Dev)
        so2 = scratch_org_factory(task=task, org_type=SCRATCH_ORG_TYPES.QA)
        data = {
            "name": task.name,
            "description": task.description,
            "project": str(task.project.id),
            "assigned_dev": {"test": "id"},
            "assigned_qa": {"test": "id"},
            "should_alert_dev": False,
            "should_alert_qa": False,
            "org_config_name": "dev",
        }
        r = rf.get("/")
        r.user = user
        serializer = TaskSerializer(task, data=data, context={"request": r})
        assert serializer.is_valid(), serializer.errors

        serializer.update(task, serializer.validated_data)
        so1.refresh_from_db()
        so2.refresh_from_db()
        assert so1.deleted_at is not None
        assert so2.deleted_at is not None

    def test_update__no_user(self, task_factory, scratch_org_factory):
        task = task_factory(commits=["abc123"])
        scratch_org_factory(task=task, org_type=SCRATCH_ORG_TYPES.Dev)
        scratch_org_factory(task=task, org_type=SCRATCH_ORG_TYPES.QA)
        data = {
            "name": task.name,
            "description": task.description,
            "project": str(task.project.id),
            "assigned_dev": {"test": "id"},
            "assigned_qa": {"test": "id"},
            "should_alert_dev": False,
            "should_alert_qa": False,
            "org_config_name": "dev",
        }
        serializer = TaskSerializer(task, data=data)
        assert serializer.is_valid(), serializer.errors
        with patch("metecho.api.models.ScratchOrg.queue_delete") as queue_delete:
            serializer.update(task, serializer.validated_data)
            assert queue_delete.call_args.kwargs == {"originating_user_id": None}

    def test_branch_url__present(self, task_factory):
        task = task_factory(name="Test task", branch_name="test-task")
        serializer = TaskSerializer(task)
        owner = task.project.repository.repo_owner
        name = task.project.repository.repo_name
        expected = f"https://github.com/{owner}/{name}/tree/test-task"
        assert serializer.data["branch_url"] == expected

    def test_branch_url__missing(self, task_factory):
        task = task_factory(name="Test task")
        serializer = TaskSerializer(task)
        assert serializer.data["branch_url"] is None

    def test_branch_diff_url__present(self, project_factory, task_factory):
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metecho.api.models.gh"))
            gh.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(number=123, closed_at=None, is_merged=False,)
                        for _ in range(1)
                    ),
                }
            )

            project = project_factory(branch_name="test-project")
            task = task_factory(project=project, branch_name="test-task")
        serializer = TaskSerializer(task)
        owner = task.project.repository.repo_owner
        name = task.project.repository.repo_name
        expected = f"https://github.com/{owner}/{name}/compare/test-project...test-task"
        assert serializer.data["branch_diff_url"] == expected

    def test_branch_diff_url__missing(self, task_factory):
        task = task_factory(name="Test task")
        serializer = TaskSerializer(task)
        assert serializer.data["branch_diff_url"] is None

    def test_pr_url__present(self, task_factory):
        task = task_factory(name="Test task", pr_number=123)
        serializer = TaskSerializer(task)
        owner = task.project.repository.repo_owner
        name = task.project.repository.repo_name
        expected = f"https://github.com/{owner}/{name}/pull/123"
        assert serializer.data["pr_url"] == expected

    def test_pr_url__missing(self, task_factory):
        task = task_factory(name="Test task")
        serializer = TaskSerializer(task)
        assert serializer.data["pr_url"] is None

    def test_queues_reassign(self, task_factory, scratch_org_factory, user_factory):
        user = user_factory()
        new_user = user_factory(devhub_username="test")
        id_ = user.github_account.uid
        new_id = new_user.github_account.uid
        task = task_factory(
            assigned_dev={"id": id_}, assigned_qa={"id": id_}, commits=["abc123"]
        )
        scratch_org_factory(
            owner_sf_username="test",
            task=task,
            org_type=SCRATCH_ORG_TYPES.Dev,
            latest_commit="abc123",
        )
        scratch_org_factory(
            owner_sf_username="test",
            task=task,
            org_type=SCRATCH_ORG_TYPES.QA,
            latest_commit="abc123",
        )

        data = {
            "name": task.name,
            "description": task.description,
            "project": str(task.project.id),
            "assigned_dev": {"id": new_id},
            "assigned_qa": {"id": new_id},
            "org_config_name": "dev",
        }
        serializer = TaskSerializer(instance=task, data=data)
        with patch("metecho.api.jobs.user_reassign_job") as user_reassign_job:
            assert serializer.is_valid()
            serializer.save()
            assert user_reassign_job.delay.called

    def test_try_send_assignment_emails(self, mailoutbox, user_factory, task_factory):
        user = user_factory()
        task = task_factory()

        serializer = TaskSerializer(
            task,
            data={
                "assigned_dev": {"id": user.github_account.uid},
                "assigned_qa": {"id": user.github_account.uid},
                "should_alert_dev": True,
                "should_alert_qa": True,
                "name": task.name,
                "project": str(task.project.id),
                "org_config_name": task.org_config_name,
            },
        )
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        assert len(mailoutbox) == 2


@pytest.mark.django_db
class TestScratchOrgSerializer:
    def test_valid(self, rf, user_factory, task_factory):
        user = user_factory()
        task = task_factory()

        r = rf.get("/")
        r.user = user

        serializer = ScratchOrgSerializer(
            data={"task": str(task.id), "org_type": "Dev"}, context={"request": r}
        )
        assert serializer.is_valid()
        create_branches_on_github_then_create_scratch_org_job = (
            "metecho.api.jobs.create_branches_on_github_then_create_scratch_org_job"
        )
        with patch(create_branches_on_github_then_create_scratch_org_job):
            instance = serializer.save()

        assert instance.owner == user

    def test_invalid(self, rf, user_factory, task_factory, scratch_org_factory):
        user = user_factory()
        task = task_factory()
        scratch_org_factory(task=task, org_type="Dev")

        r = rf.get("/")
        r.user = user

        serializer = ScratchOrgSerializer(
            data={"task": str(task.id), "org_type": "Dev"}, context={"request": r}
        )
        assert not serializer.is_valid()

    def test_circumspect_ignored_changes(
        self, rf, user_factory, task_factory, scratch_org_factory
    ):
        user = user_factory()
        with ExitStack() as stack:
            stack.enter_context(patch("metecho.api.gh.gh_as_app"))
            task = task_factory()
            instance = scratch_org_factory(
                task=task, org_type="Dev", owner=user, ignored_changes={"test": "value"}
            )

        r = rf.get("/")
        serializer = ScratchOrgSerializer(instance, context={"request": r})
        assert serializer.data["ignored_changes"] == {}

    def test_circumspect_ignored_changes__many(
        self, rf, user_factory, task_factory, scratch_org_factory
    ):
        user = user_factory()
        with ExitStack() as stack:
            stack.enter_context(patch("metecho.api.gh.gh_as_app"))
            task = task_factory()
            instances = [
                scratch_org_factory(
                    task=task,
                    org_type="Dev",
                    owner=user,
                    ignored_changes={"test": "value"},
                ),
                scratch_org_factory(
                    task=task,
                    org_type="Dev",
                    owner=user,
                    ignored_changes={"test": "value"},
                ),
            ]

        r = rf.get("/")
        serializer = ScratchOrgSerializer(instances, many=True, context={"request": r})
        assert all(instance["ignored_changes"] == {} for instance in serializer.data)
