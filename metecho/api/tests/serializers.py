from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.utils import timezone

from ..models import ScratchOrgType, Task
from ..serializers import (
    EpicCollaboratorsSerializer,
    EpicSerializer,
    FullUserSerializer,
    GitHubIssueSerializer,
    ScratchOrgSerializer,
    TaskAssigneeSerializer,
    TaskSerializer,
)

fixture = pytest.lazy_fixture


@pytest.mark.django_db
class TestFullUserSerializer:
    def test_get_sf_username(self, user_factory, settings):
        settings.DEVHUB_USERNAME = "test username"
        user = user_factory()
        serializer = FullUserSerializer(user)
        assert serializer.data["sf_username"] is None


@pytest.mark.django_db
class TestGitHubIssueSerializer:
    def test_epic(self, epic_factory):
        epic = epic_factory()
        serializer = GitHubIssueSerializer(epic.issue)
        assert tuple(serializer.data["epic"]) == (
            "id",
            "name",
            "status",
            "slug",
        )

    def test_task(self, task_factory):
        task = task_factory()
        serializer = GitHubIssueSerializer(task.issue)
        assert tuple(serializer.data["task"]) == (
            "id",
            "name",
            "status",
            "review_status",
            "review_valid",
            "pr_is_open",
            "slug",
            "epic_slug",
        )


@pytest.mark.django_db
class TestEpicSerializer:
    @pytest.mark.parametrize(
        "user_perms",
        (
            {},  # Empty permissions
            {"push": False},  # Read-only
            {"push": True},  # Read-write
        ),
    )
    def test_create(self, rf, user_factory, project_factory, user_perms):
        project = project_factory(
            github_users=[{"id": "123456", "permissions": user_perms}]
        )
        data = {
            "name": "Test epic",
            "description": "Test `epic`",
            "project": str(project.id),
            "github_users": [project.github_users[0]["id"]],
        }
        r = rf.get("/")
        r.user = user_factory()
        with ExitStack() as stack:
            available_org_config_names_job = stack.enter_context(
                patch("metecho.api.jobs.available_org_config_names_job")
            )
            serializer = EpicSerializer(data=data, context={"request": r})
            assert serializer.is_valid(), serializer.errors
            serializer.save()
            assert available_org_config_names_job.delay.called

    def test_markdown_fields_input(self, rf, user_factory, project_factory):
        request = rf.post("/")
        request.user = user_factory()
        project = project_factory()
        serializer = EpicSerializer(
            data={
                "name": "Test epic",
                "description": "Test `epic`",
                "branch_name": "some-branch",
                "project": str(project.id),
                "github_users": [],
            },
            context={"request": request},
        )
        assert serializer.is_valid(), serializer.errors

        with ExitStack() as stack:
            gh_as_user = stack.enter_context(patch("metecho.api.gh.gh_as_user"))
            gh_module = stack.enter_context(patch("metecho.api.models.gh"))
            repo = MagicMock()
            repo.url = "test"
            gh = MagicMock()
            gh.repositories.return_value = [repo]
            gh_as_user.return_value = gh
            gh_module.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(
                            number=123,
                            closed_at=None,
                            is_merged=False,
                        )
                        for _ in range(1)
                    ),
                }
            )

            epic = serializer.save()

        assert epic.description_markdown == "<p>Test <code>epic</code></p>"

    def test_markdown_fields_output(self, epic_factory):
        epic = epic_factory(name="Test epic", description="Test `epic`")
        serializer = EpicSerializer(epic)
        assert (
            serializer.data["description_rendered"] == "<p>Test <code>epic</code></p>"
        )

    def test_validate_branch_name__non_feature(self, project_factory):
        project = project_factory()
        serializer = EpicSerializer(
            data={
                "branch_name": "test__non-feature",
                "name": "Test",
                "project": str(project.id),
            }
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_validate_branch_name__already_used(self, project_factory, epic_factory):
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metecho.api.models.gh"))
            gh.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(
                            number=123,
                            closed_at=None,
                            is_merged=False,
                        )
                        for _ in range(1)
                    ),
                }
            )

            project = project_factory()
            epic_factory(branch_name="test")

        serializer = EpicSerializer(
            data={"branch_name": "test", "name": "Test", "project": str(project.id)}
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_validate_branch_name__repo_default_branch(self, project_factory):
        project = project_factory()
        serializer = EpicSerializer(
            data={
                "branch_name": project.branch_name,
                "name": "Test",
                "project": str(project.id),
            }
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_branch_url__present(self, epic_factory):
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metecho.api.models.gh"))
            gh.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(
                            number=123,
                            closed_at=None,
                            is_merged=False,
                        )
                        for _ in range(1)
                    ),
                }
            )

            epic = epic_factory(
                name="Test epic",
                description="Test `epic`",
                branch_name="test-epic",
            )
        serializer = EpicSerializer(epic)
        owner = epic.project.repo_owner
        name = epic.project.repo_name
        expected = f"https://github.com/{owner}/{name}/tree/test-epic"
        assert serializer.data["branch_url"] == expected

    def test_branch_url__missing(self, epic_factory):
        epic = epic_factory(name="Test epic", description="Test `epic`")
        serializer = EpicSerializer(epic)
        assert serializer.data["branch_url"] is None

    def test_unique_name_for_project(self, project_factory, epic_factory):
        project = project_factory()
        epic_factory(project=project, name="Duplicate me")
        serializer = EpicSerializer(
            data={
                "project": str(project.id),
                "name": "Duplicate Me",
                "description": "Blorp",
                "github_users": [],
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["name"]] == [
            "An Epic with this name already exists."
        ]

    def test_unique_name_for_project__case_insensitive(
        self, project_factory, epic_factory
    ):
        project = project_factory()
        epic_factory(project=project, name="Duplicate me")
        serializer = EpicSerializer(
            data={
                "project": str(project.id),
                "name": "duplicate me",
                "description": "Blorp",
                "github_users": [],
            }
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["name"]] == [
            "An Epic with this name already exists."
        ]

    def test_unique_name_for_project__case_insensitive__update(
        self, project_factory, epic_factory
    ):
        project = project_factory()
        epic = epic_factory(project=project, name="Duplicate me")
        serializer = EpicSerializer(
            instance=epic,
            data={
                "project": str(project.id),
                "description": "Blorp",
                "github_users": [],
            },
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors

    def test_pr_url__present(self, epic_factory):
        epic = epic_factory(name="Test epic", pr_number=123)
        serializer = EpicSerializer(epic)
        owner = epic.project.repo_owner
        name = epic.project.repo_name
        expected = f"https://github.com/{owner}/{name}/pull/123"
        assert serializer.data["pr_url"] == expected

    def test_pr_url__missing(self, epic_factory):
        epic = epic_factory(name="Test epic")
        serializer = EpicSerializer(epic)
        assert serializer.data["pr_url"] is None

    @pytest.mark.parametrize(
        "issue_type, success",
        (
            ("with_task", False),
            ("with_epic", False),
            ("unattached", True),
            ("same", True),
            ("none", True),
        ),
    )
    def test_validate_issue(
        self, task_factory, epic_factory, git_hub_issue_factory, issue_type, success
    ):
        epic = epic_factory()
        issues = {
            "with_task": str(task_factory().issue_id),
            "with_epic": str(epic_factory().issue_id),
            "unattached": str(git_hub_issue_factory().id),
            "same": str(epic.issue_id),
            "none": None,
        }
        issue = issues[issue_type]

        serializer = EpicSerializer(epic, data={"issue": issue}, partial=True)

        if success:
            assert serializer.is_valid()
        else:
            assert not serializer.is_valid()
            assert "issue" in serializer.errors, serializer.errors


@pytest.mark.django_db
class TestEpicCollaboratorsSerializer:
    @pytest.mark.parametrize(
        "value, success",
        (
            pytest.param(["123", "456"], True, id="Valid input"),
            pytest.param(["567890"], False, id="User not in project"),
            pytest.param([{"id": "123456"}], False, id="Invalid format"),
            pytest.param(["123", "123"], False, id="Duplicate"),
        ),
    )
    def test_value(self, rf, git_hub_repository_factory, epic_factory, value, success):
        repo = git_hub_repository_factory(permissions={"push": True})
        epic = epic_factory(
            project__repo_id=repo.repo_id,
            project__github_users=[{"id": "123"}, {"id": "456"}],
            github_users=["123"],
        )
        r = rf.get("/")
        r.user = repo.user
        serializer = EpicCollaboratorsSerializer(
            epic, data={"github_users": value}, context={"request": r}
        )
        assert serializer.is_valid() == success, serializer.errors
        if not success:
            assert "github_users" in serializer.errors

    @pytest.mark.parametrize(
        "github_users, value, success",
        (
            pytest.param(["123"], ["123"], True, id="No change"),
            pytest.param(["123"], ["123", "self"], True, id="Add self"),
            pytest.param(["123"], ["123", "456"], False, id="Add other"),
            pytest.param(["123"], [], False, id="Remove other"),
            pytest.param(["123", "self"], ["123"], True, id="Remove self"),
        ),
    )
    def test_readonly_user(
        self, rf, user_factory, epic_factory, github_users, value, success
    ):
        # We don't associate `user` with any GitHubRepository instances, which means
        # they are read-only
        user = user_factory(socialaccount_set__uid="self")
        epic = epic_factory(
            github_users=github_users,
            project__github_users=[{"id": "123"}, {"id": "456"}, {"id": "self"}],
        )
        r = rf.get("/")
        r.user = user
        serializer = EpicCollaboratorsSerializer(
            epic, data={"github_users": value}, context={"request": r}
        )
        assert serializer.is_valid() == success, serializer.errors
        if not success:
            assert "github_users" in serializer.errors


@pytest.mark.django_db
class TestTaskSerializer:
    @pytest.mark.parametrize(
        "attach_epic, attach_project, success",
        (
            pytest.param(True, False, True, id="Epic only"),
            pytest.param(False, True, True, id="Project only"),
            pytest.param(True, True, False, id="Epic and project"),
            pytest.param(False, False, False, id="Missing epic and project"),
        ),
    )
    def test_create(
        self,
        attach_epic,
        attach_project,
        success,
        rf,
        user_factory,
        epic_factory,
        project_factory,
    ):
        user = user_factory()
        data = {
            "name": "Test Task",
            "description": "Description.",
            "epic": str(epic_factory().id) if attach_epic else None,
            "project": str(project_factory().id) if attach_project else None,
            "org_config_name": "dev",
        }
        r = rf.get("/")
        r.user = user
        serializer = TaskSerializer(data=data, context={"request": r})
        assert serializer.is_valid() == success, serializer.errors
        if success:
            serializer.save()
            assert Task.objects.count() == 1

    @pytest.mark.parametrize(
        "dev_id, assigned_dev",
        (
            pytest.param(None, "123", id="No assignee (assign to self)"),
            pytest.param("456", "456", id="Assign to other"),
        ),
    )
    def test_create__dev_org(
        self,
        rf,
        mocker,
        user_factory,
        scratch_org_factory,
        epic_factory,
        dev_id,
        assigned_dev,
    ):
        convert_to_dev_org_job = mocker.patch("metecho.api.jobs.convert_to_dev_org_job")
        user = user_factory(socialaccount_set__uid="123")
        epic = epic_factory()
        scratch_org = scratch_org_factory(epic=epic, task=None)
        data = {
            "name": "Test Task with Org",
            "description": "Description",
            "epic": str(epic.id),
            "org_config_name": "dev",
            "dev_org": str(scratch_org.id),
            "assigned_dev": dev_id,
        }

        r = rf.get("/")
        r.user = user
        serializer = TaskSerializer(data=data, context={"request": r})

        assert serializer.is_valid(), serializer.errors
        serializer.save()
        task = Task.objects.get()
        assert task.assigned_dev == assigned_dev
        assert convert_to_dev_org_job.delay.called

    def test_branch_url__present(self, task_factory):
        task = task_factory(name="Test task", branch_name="test-task")
        serializer = TaskSerializer(task)
        owner = task.epic.project.repo_owner
        name = task.epic.project.repo_name
        expected = f"https://github.com/{owner}/{name}/tree/test-task"
        assert serializer.data["branch_url"] == expected

    def test_branch_url__missing(self, task_factory):
        task = task_factory(name="Test task")
        serializer = TaskSerializer(task)
        assert serializer.data["branch_url"] is None

    @pytest.mark.parametrize(
        "_task_factory, task_data, expected",
        (
            pytest.param(
                fixture("task_factory"),
                {"epic__branch_name": "test-epic"},
                "test-epic",
                id="Task with Epic",
            ),
            pytest.param(
                fixture("task_with_project_factory"),
                {"project__branch_name": "test-project"},
                "test-project",
                id="Task with Project",
            ),
        ),
    )
    def test_branch_diff_url__present(self, _task_factory, task_data, expected):
        with ExitStack() as stack:
            gh = stack.enter_context(patch("metecho.api.models.gh"))
            gh.get_repo_info.return_value = MagicMock(
                **{
                    "pull_requests.return_value": (
                        MagicMock(
                            number=123,
                            closed_at=None,
                            is_merged=False,
                        )
                        for _ in range(1)
                    ),
                }
            )

        task = _task_factory(**task_data, branch_name="test-task")
        serializer = TaskSerializer(task)
        owner = task.root_project.repo_owner
        name = task.root_project.repo_name
        assert (
            serializer.data["branch_diff_url"]
            == f"https://github.com/{owner}/{name}/compare/{expected}...test-task"
        )

    def test_branch_diff_url__missing(self, task_factory):
        task = task_factory(name="Test task")
        serializer = TaskSerializer(task)
        assert serializer.data["branch_diff_url"] is None

    def test_pr_url__present(self, task_factory):
        task = task_factory(name="Test task", pr_number=123)
        serializer = TaskSerializer(task)
        owner = task.epic.project.repo_owner
        name = task.epic.project.repo_name
        expected = f"https://github.com/{owner}/{name}/pull/123"
        assert serializer.data["pr_url"] == expected

    def test_pr_url__missing(self, task_factory):
        task = task_factory(name="Test task")
        serializer = TaskSerializer(task)
        assert serializer.data["pr_url"] is None

    @pytest.mark.parametrize(
        "issue_type, success",
        (
            ("with_task", False),
            ("with_epic", False),
            ("unattached", True),
            ("same", True),
            ("none", True),
        ),
    )
    def test_validate_issue(
        self, task_factory, epic_factory, git_hub_issue_factory, issue_type, success
    ):
        task = task_factory()
        issues = {
            "with_task": str(task_factory().issue_id),
            "with_epic": str(epic_factory().issue_id),
            "unattached": str(git_hub_issue_factory().id),
            "same": str(task.issue_id),
            "none": None,
        }
        issue = issues[issue_type]

        serializer = TaskSerializer(task, data={"issue": issue}, partial=True)

        if success:
            assert serializer.is_valid()
        else:
            assert not serializer.is_valid()
            assert "issue" in serializer.errors, serializer.errors


@pytest.mark.django_db
class TestTaskAssigneeSerializer:
    def test_missing_assigness(self, task_factory):
        task = task_factory()
        serializer = TaskAssigneeSerializer(task, data={})
        assert not serializer.is_valid()
        assert "non_field_errors" in serializer.errors

    @pytest.mark.parametrize(
        "_task_factory",
        (
            pytest.param(fixture("task_factory"), id="Task with Epic"),
            pytest.param(fixture("task_with_project_factory"), id="Task with Project"),
        ),
    )
    def test_assign(
        self, rf, git_hub_repository_factory, scratch_org_factory, _task_factory
    ):
        task = _task_factory()
        project = task.root_project
        project.github_users = [
            {"id": "123456", "permissions": {"push": True}},
            {"id": "456789", "permissions": {"push": True}},
        ]
        project.save()
        repo = git_hub_repository_factory(
            repo_id=project.repo_id, permissions={"push": True}
        )
        so1 = scratch_org_factory(task=task, org_type=ScratchOrgType.DEV)
        so2 = scratch_org_factory(task=task, org_type=ScratchOrgType.QA)

        data = {"assigned_dev": "123456", "assigned_qa": "456789"}
        r = rf.get("/")
        r.user = repo.user
        serializer = TaskAssigneeSerializer(task, data=data, context={"request": r})
        assert serializer.is_valid(), serializer.errors

        with ExitStack() as stack:
            OrgConfig = stack.enter_context(patch("metecho.api.sf_run_flow.OrgConfig"))
            org_config = MagicMock(config={"access_token": None})
            OrgConfig.return_value = org_config
            serializer.update(task, serializer.validated_data)
        so1.refresh_from_db()
        so2.refresh_from_db()
        assert so1.deleted_at is not None
        assert so2.deleted_at is not None

    def test_unassign(
        self, rf, git_hub_repository_factory, task_factory, scratch_org_factory
    ):
        repo = git_hub_repository_factory(permissions={"push": True})
        task = task_factory(
            epic__project__repo_id=repo.repo_id,
            assigned_dev="123",
            assigned_qa="123",
        )
        so1 = scratch_org_factory(task=task, org_type=ScratchOrgType.DEV)
        so2 = scratch_org_factory(task=task, org_type=ScratchOrgType.QA)
        data = {
            "assigned_dev": None,
            "assigned_qa": None,
        }
        r = rf.get("/")
        r.user = repo.user
        serializer = TaskAssigneeSerializer(task, data=data, context={"request": r})
        assert serializer.is_valid(), serializer.errors
        serializer.update(task, serializer.validated_data)
        so1.refresh_from_db()
        so2.refresh_from_db()
        assert so1.deleted_at is not None
        assert so2.deleted_at is not None

    @pytest.mark.parametrize(
        "epic_collaborators",
        (
            [],  # No collaborators
            ["dev_id", "qa_id", "123"],  # Assigness already present
            ["123", "456"],  # Other users present
        ),
    )
    def test_assign__add_epic_collaborators(
        self, rf, git_hub_repository_factory, task_factory, epic_collaborators
    ):
        # Task assigness should be added as epic collaborators as well
        repo = git_hub_repository_factory(permissions={"push": True})
        task = task_factory(
            epic__project__repo_id=repo.repo_id,
            epic__project__github_users=[
                {"id": "dev_id", "permissions": {"push": True}},
                {"id": "qa_id", "permissions": {"push": True}},
            ],
            epic__github_users=epic_collaborators,
        )
        data = {
            "assigned_dev": "dev_id",
            "assigned_qa": "qa_id",
        }
        r = rf.get("/")
        r.user = repo.user
        serializer = TaskAssigneeSerializer(task, data=data, context={"request": r})
        assert serializer.is_valid(), serializer.errors

        serializer.update(task, serializer.validated_data)
        task.epic.refresh_from_db()
        collaborators = task.epic.github_users
        assert len(set(collaborators)) == len(
            collaborators
        ), "Duplicate Epic collaborators detected"
        assert "dev_id" in collaborators
        assert "qa_id" in collaborators

    @pytest.mark.parametrize(
        "collaborator, data, success",
        (
            pytest.param(
                {"id": "123", "permissions": {"push": True}},
                {"assigned_dev": "456"},
                False,
                id="Dev ID not in collaborator list",
            ),
            pytest.param(
                {"id": "123"},
                {"assigned_dev": "123"},
                False,
                id="Dev has unknown permissions",
            ),
            pytest.param(
                {"id": "123", "permissions": {"push": False}},
                {"assigned_dev": "123"},
                False,
                id="Dev can't push",
            ),
            pytest.param(
                {"id": "123", "permissions": {"push": True}},
                {"assigned_dev": "123"},
                True,
                id="Dev can push",
            ),
            pytest.param(
                {"id": "123", "permissions": {"push": True}},
                {"assigned_qa": "456"},
                False,
                id="Tester ID not in collaborator list",
            ),
            pytest.param(
                {"id": "123"},
                {"assigned_qa": "123"},
                True,
                id="Tester has unknown permissions",
            ),
            pytest.param(
                {"id": "123", "permissions": {"push": False}},
                {"assigned_qa": "123"},
                True,
                id="Tester can't push",
            ),
            pytest.param(
                {"id": "123", "permissions": {"push": True}},
                {"assigned_qa": "123"},
                True,
                id="Tester can push",
            ),
        ),
    )
    def test_assign__assignee_permissions(
        self, rf, git_hub_repository_factory, task_factory, collaborator, data, success
    ):
        repo = git_hub_repository_factory(permissions={"push": True})
        task = task_factory(
            epic__project__repo_id=repo.repo_id,
            epic__project__github_users=[collaborator],
        )
        r = rf.get("/")
        r.user = repo.user
        serializer = TaskAssigneeSerializer(task, data=data, context={"request": r})
        assert serializer.is_valid() == success, serializer.errors
        if not success:
            assert data.keys() == serializer.errors.keys()

    @pytest.mark.parametrize(
        "repo_perms, data, success",
        (
            pytest.param(
                {},
                {"assigned_dev": "123"},
                False,
                id="Dev assigner has unknown permissions",
            ),
            pytest.param(
                {"push": False},
                {"assigned_dev": "123"},
                False,
                id="Dev assigner can't push",
            ),
            pytest.param(
                {"push": True},
                {"assigned_dev": "123"},
                True,
                id="Dev assigner can push",
            ),
            pytest.param(
                {},
                {"assigned_qa": "123"},
                True,
                id="Tester assigner has unknown permissions, assigns self",
            ),
            pytest.param(
                {"push": False},
                {"assigned_qa": "123"},
                True,
                id="Tester assigner can't push, assigns self",
            ),
            pytest.param(
                {"push": True},
                {"assigned_qa": "123"},
                True,
                id="Tester can push, assigns self",
            ),
            pytest.param(
                {},
                {"assigned_qa": "456"},
                False,
                id="Tester assigner has unknown permissions, assigns other",
            ),
            pytest.param(
                {"push": False},
                {"assigned_qa": "456"},
                False,
                id="Tester assigner can't push, assigns other",
            ),
            pytest.param(
                {"push": True},
                {"assigned_qa": "456"},
                True,
                id="Tester assigner can push, assigns other",
            ),
        ),
    )
    def test_assign__assigner_permissions(
        self,
        rf,
        git_hub_repository_factory,
        user_factory,
        task_factory,
        repo_perms,
        data,
        success,
    ):
        user = user_factory(socialaccount_set__uid="123")
        repo = git_hub_repository_factory(permissions=repo_perms, user=user)
        task = task_factory(
            epic__project__repo_id=repo.repo_id,
            epic__project__github_users=[
                {"id": "123", "permissions": {"push": True}},
                {"id": "456", "permissions": {"push": True}},
            ],
        )
        r = rf.get("/")
        r.user = user
        serializer = TaskAssigneeSerializer(task, data=data, context={"request": r})
        assert serializer.is_valid() == success, serializer.errors
        if not success:
            assert data.keys() == serializer.errors.keys()

    def test_queues_reassign(
        self,
        rf,
        git_hub_repository_factory,
        user_factory,
        task_factory,
        scratch_org_factory,
    ):
        user = user_factory()
        new_user = user_factory(devhub_username="test")
        repo = git_hub_repository_factory(permissions={"push": True}, user=new_user)
        task = task_factory(
            assigned_dev=user.github_id,
            assigned_qa=user.github_id,
            commits=["abc123"],
            epic__project__repo_id=repo.repo_id,
            epic__project__github_users=[
                {"id": user.github_id, "permissions": {"push": True}},
                {"id": new_user.github_id, "permissions": {"push": True}},
            ],
        )
        scratch_org_factory(
            owner_sf_username="test",
            task=task,
            org_type=ScratchOrgType.DEV,
            latest_commit="abc123",
            deleted_at=timezone.now(),
        )
        scratch_org_factory(
            owner_sf_username="test",
            task=task,
            org_type=ScratchOrgType.QA,
            latest_commit="abc123",
            deleted_at=timezone.now(),
        )

        data = {"assigned_dev": new_user.github_id, "assigned_qa": new_user.github_id}
        r = rf.get("/")
        r.user = new_user
        serializer = TaskAssigneeSerializer(task, data=data, context={"request": r})
        with ExitStack() as stack:
            user_reassign_job = stack.enter_context(
                patch("metecho.api.jobs.user_reassign_job")
            )
            OrgConfig = stack.enter_context(patch("metecho.api.sf_run_flow.OrgConfig"))
            org_config = MagicMock(config={"access_token": None})
            OrgConfig.return_value = org_config
            assert serializer.is_valid(), serializer.errors
            serializer.save()
            assert user_reassign_job.delay.called

    def test_try_send_assignment_emails(
        self, rf, mailoutbox, git_hub_repository_factory, task_factory
    ):
        repo = git_hub_repository_factory(permissions={"push": True})
        task = task_factory(
            epic__project__repo_id=repo.repo_id,
            epic__project__github_users=[
                {"id": repo.user.github_id, "permissions": {"push": True}}
            ],
        )

        data = {
            "assigned_dev": repo.user.github_id,
            "assigned_qa": repo.user.github_id,
            "should_alert_dev": True,
            "should_alert_qa": True,
        }
        r = rf.get("/")
        r.user = repo.user
        serializer = TaskAssigneeSerializer(task, data=data, context={"request": r})
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        assert len(mailoutbox) == 2


@pytest.mark.django_db
class TestScratchOrgSerializer:
    def test_valid(self, rf, user_factory, task_factory, scratch_org_factory):
        user = user_factory()
        task = task_factory()
        scratch_org_factory(task=task, org_type="Playground")

        r = rf.get("/")
        r.user = user

        serializer = ScratchOrgSerializer(
            data={
                "task": str(task.id),
                "org_type": "Playground",
                "org_config_name": "dev",
            },
            context={"request": r},
        )
        assert serializer.is_valid(), serializer.errors
        create_branches_on_github_then_create_scratch_org_job = (
            "metecho.api.jobs.create_branches_on_github_then_create_scratch_org_job"
        )
        with patch(create_branches_on_github_then_create_scratch_org_job):
            instance = serializer.save()

        assert instance.owner == user

    def test_invalid__existing_org_for_project(
        self, rf, user_factory, project_factory, scratch_org_factory
    ):
        user = user_factory()
        project = project_factory()
        scratch_org_factory(project=project, org_type="Dev")

        r = rf.get("/")
        r.user = user

        serializer = ScratchOrgSerializer(
            data={
                "project": str(project.id),
                "org_type": "Dev",
                "org_config_name": "dev",
            },
            context={"request": r},
        )
        assert not serializer.is_valid()

    def test_invalid__existing_org_for_epic(
        self, rf, user_factory, epic_factory, scratch_org_factory
    ):
        user = user_factory()
        epic = epic_factory()
        scratch_org_factory(epic=epic, org_type="Playground", owner=user)

        r = rf.get("/")
        r.user = user

        serializer = ScratchOrgSerializer(
            data={
                "epic": str(epic.id),
                "org_type": "Playground",
                "org_config_name": "dev",
            },
            context={"request": r},
        )
        assert not serializer.is_valid()

    def test_invalid__existing_org_for_task(
        self, rf, user_factory, task_factory, scratch_org_factory
    ):
        user = user_factory()
        task = task_factory()
        scratch_org_factory(task=task, org_type="Dev")

        r = rf.get("/")
        r.user = user

        serializer = ScratchOrgSerializer(
            data={"task": str(task.id), "org_type": "Dev", "org_config_name": "dev"},
            context={"request": r},
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
