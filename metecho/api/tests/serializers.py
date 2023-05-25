from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.utils import timezone

from ..models import ScratchOrgType, Task
from ..serializers import (
    EpicSerializer,
    FullUserSerializer,
    GitHubIssueSerializer,
    ScratchOrgSerializer,
    TaskAssigneeSerializer,
    TaskSerializer,
)

fixture = pytest.lazy_fixture


@pytest.fixture
def project_with_collaborator(git_hub_collaboration_factory, auth_request):
    collab = git_hub_collaboration_factory(
        permissions={"push": True},
        user__id=auth_request.user.github_id,
    )
    return collab.project, auth_request


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
    def test_create(
        self, project_with_collaborator, git_hub_collaboration_factory, user_perms
    ):
        project, auth_request = project_with_collaborator
        collab = git_hub_collaboration_factory(project=project, permissions=user_perms)
        data = {
            "name": "Test epic",
            "description": "Test `epic`",
            "project": project.id,
            "github_users": [collab.user_id],
        }
        with ExitStack() as stack:
            available_org_config_names_job = stack.enter_context(
                patch("metecho.api.jobs.available_org_config_names_job")
            )
            serializer = EpicSerializer(data=data, context={"request": auth_request})
            assert serializer.is_valid(), serializer.errors
            serializer.save()
            assert available_org_config_names_job.delay.called

    def test_markdown_fields_input(self, project_with_collaborator):
        project, auth_request = project_with_collaborator
        serializer = EpicSerializer(
            data={
                "name": "Test epic",
                "description": "Test `epic`",
                "branch_name": "some-branch",
                "project": project.id,
                "github_users": [],
            },
            context={"request": auth_request},
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

    def test_validate_branch_name__non_feature(self, project_with_collaborator):
        project, auth_request = project_with_collaborator
        serializer = EpicSerializer(
            data={
                "branch_name": "test__non-feature",
                "name": "Test",
                "project": str(project.id),
            },
            context={"request": auth_request},
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_validate_branch_name__already_used(
        self, project_with_collaborator, epic_factory
    ):
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

            project, auth_request = project_with_collaborator
            epic_factory(branch_name="test")

        serializer = EpicSerializer(
            data={"branch_name": "test", "name": "Test", "project": project.id},
            context={"request": auth_request},
        )
        assert not serializer.is_valid()
        assert "branch_name" in serializer.errors

    def test_validate_branch_name__repo_default_branch(self, project_with_collaborator):
        project, auth_request = project_with_collaborator
        serializer = EpicSerializer(
            data={
                "branch_name": project.branch_name,
                "name": "Test",
                "project": str(project.id),
            },
            context={"request": auth_request},
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

    def test_unique_name_for_project(self, project_with_collaborator, epic_factory):
        project, auth_request = project_with_collaborator
        epic_factory(project=project, name="Duplicate me")
        serializer = EpicSerializer(
            data={
                "project": str(project.id),
                "name": "Duplicate Me",
                "description": "Blorp",
                "github_users": [],
            },
            context={"request": auth_request},
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["name"]] == [
            "An Epic with this name already exists."
        ]

    def test_unique_name_for_project__case_insensitive(
        self, project_with_collaborator, epic_factory
    ):
        project, auth_request = project_with_collaborator
        epic_factory(project=project, name="Duplicate me")
        serializer = EpicSerializer(
            data={
                "project": str(project.id),
                "name": "duplicate me",
                "description": "Blorp",
                "github_users": [],
            },
            context={"request": auth_request},
        )
        assert not serializer.is_valid()
        assert [str(err) for err in serializer.errors["name"]] == [
            "An Epic with this name already exists."
        ]

    def test_unique_name_for_project__case_insensitive__update(
        self, project_with_collaborator, epic_factory
    ):
        project, auth_request = project_with_collaborator
        epic = epic_factory(project=project, name="Duplicate me")
        serializer = EpicSerializer(
            instance=epic,
            data={
                "project": str(project.id),
                "description": "Blorp",
                "github_users": [],
            },
            context={"request": auth_request},
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
        project_with_collaborator,
        epic_factory,
    ):
        project, auth_request = project_with_collaborator
        data = {
            "name": "Test Task",
            "description": "Description.",
            "epic": epic_factory(project=project).id if attach_epic else None,
            "project": project.id if attach_project else None,
            "org_config_name": "dev",
        }
        serializer = TaskSerializer(data=data, context={"request": auth_request})
        assert serializer.is_valid() == success, serializer.errors
        if success:
            serializer.save()
            assert Task.objects.count() == 1

    @pytest.mark.parametrize(
        "dev_id, assigned_dev",
        (
            pytest.param(None, 123, id="No assignee (assign to self)"),
            pytest.param(456, 456, id="Assign to other"),
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
        git_hub_collaboration_factory,
    ):
        convert_to_dev_org_job = mocker.patch("metecho.api.jobs.convert_to_dev_org_job")
        user = user_factory(socialaccount_set__uid="123")
        epic = epic_factory()
        git_hub_collaboration_factory(
            project=epic.project, user__id=user.github_id, permissions={"push": True}
        )
        git_hub_collaboration_factory(project=epic.project, user__id=456)
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
        assert task.assigned_dev_id == assigned_dev
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
        self,
        auth_request,
        git_hub_collaboration_factory,
        scratch_org_factory,
        _task_factory,
    ):
        task = _task_factory()
        git_hub_collaboration_factory(
            user__id=auth_request.user.github_id,
            project=task.root_project,
            permissions={"push": True},
        )
        dev = git_hub_collaboration_factory(
            project=task.root_project, permissions={"push": True}
        ).user
        qa = git_hub_collaboration_factory(
            project=task.root_project, permissions={"push": True}
        ).user
        so1 = scratch_org_factory(task=task, org_type=ScratchOrgType.DEV)
        so2 = scratch_org_factory(task=task, org_type=ScratchOrgType.QA)

        data = {"assigned_dev": dev.id, "assigned_qa": qa.id}
        serializer = TaskAssigneeSerializer(
            task, data=data, context={"request": auth_request}
        )
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
        self,
        auth_request,
        task_factory,
        git_hub_user_factory,
        git_hub_collaboration_factory,
        scratch_org_factory,
    ):
        task = task_factory(
            assigned_dev=git_hub_user_factory(), assigned_qa=git_hub_user_factory()
        )
        git_hub_collaboration_factory(
            user__id=auth_request.user.github_id,
            project=task.root_project,
            permissions={"push": True},
        )
        so1 = scratch_org_factory(task=task, org_type=ScratchOrgType.DEV)
        so2 = scratch_org_factory(task=task, org_type=ScratchOrgType.QA)
        data = {"assigned_dev": None, "assigned_qa": None}
        serializer = TaskAssigneeSerializer(
            task, data=data, context={"request": auth_request}
        )
        assert serializer.is_valid(), serializer.errors
        serializer.update(task, serializer.validated_data)
        so1.refresh_from_db()
        so2.refresh_from_db()
        assert so1.deleted_at is not None
        assert so2.deleted_at is not None

    def test_assign__add_epic_collaborators(
        self, auth_request, git_hub_collaboration_factory, task_factory
    ):
        # Task assignees should be added as epic collaborators as well
        task = task_factory()
        dev = git_hub_collaboration_factory(
            project=task.root_project, permissions={"push": True}
        ).user
        qa = git_hub_collaboration_factory(project=task.root_project).user
        current = git_hub_collaboration_factory(
            project=task.root_project,
            user__id=auth_request.user.github_id,
            permissions={"push": True},
        ).user
        task.epic.github_users.add(current)
        data = {"assigned_dev": dev.id, "assigned_qa": qa.id}
        serializer = TaskAssigneeSerializer(
            task, data=data, context={"request": auth_request}
        )
        assert serializer.is_valid(), serializer.errors

        serializer.update(task, serializer.validated_data)
        epic_collaborators = list(task.epic.github_users.all())
        assert current in epic_collaborators
        assert dev in epic_collaborators
        assert qa in epic_collaborators

    @pytest.mark.parametrize(
        "assignee_perms, data, success",
        (
            pytest.param(
                {},
                {"assigned_dev": 123},
                False,
                id="Dev has unknown permissions",
            ),
            pytest.param(
                {"push": False},
                {"assigned_dev": 123},
                False,
                id="Dev can't push",
            ),
            pytest.param(
                {"push": True},
                {"assigned_dev": 123},
                True,
                id="Dev can push",
            ),
            pytest.param(
                {},
                {"assigned_qa": 123},
                True,
                id="Tester has unknown permissions",
            ),
            pytest.param(
                {"push": False},
                {"assigned_qa": 123},
                True,
                id="Tester can't push",
            ),
            pytest.param(
                {"push": True},
                {"assigned_qa": 123},
                True,
                id="Tester can push",
            ),
        ),
    )
    def test_assign__assignee_permissions(
        self,
        auth_request,
        git_hub_collaboration_factory,
        task,
        assignee_perms,
        data,
        success,
    ):
        git_hub_collaboration_factory(
            project=task.root_project, user__id=123, permissions=assignee_perms
        )
        git_hub_collaboration_factory(
            project=task.root_project,
            user__id=auth_request.user.github_id,
            permissions={"push": True},
        )
        serializer = TaskAssigneeSerializer(
            task, data=data, context={"request": auth_request}
        )
        assert serializer.is_valid() == success, serializer.errors
        if not success:
            assert data.keys() == serializer.errors.keys()

    @pytest.mark.parametrize(
        "assigner_perms, data, success",
        (
            # Assigns self as dev
            pytest.param(
                {},
                {"assigned_dev": 123},
                False,
                id="Assigner has unknown permissions, assigns self as dev",
            ),
            pytest.param(
                {"push": False},
                {"assigned_dev": 123},
                False,
                id="Assigner can't push, assigns self as dev",
            ),
            pytest.param(
                {"push": True},
                {"assigned_dev": 123},
                True,
                id="Assigner can push, assigns self as dev",
            ),
            # Assigns self as tester
            pytest.param(
                {},
                {"assigned_qa": 123},
                True,
                id="Assigner has unknown permissions, assigns self as tester",
            ),
            pytest.param(
                {"push": False},
                {"assigned_qa": 123},
                True,
                id="Assigner can't push, assigns self as tester",
            ),
            pytest.param(
                {"push": True},
                {"assigned_qa": 123},
                True,
                id="Assigner can push, assigns self as tester",
            ),
            # Assigns other as dev
            pytest.param(
                {},
                {"assigned_dev": 456},
                False,
                id="Assigner has unknown permissions, assigns other as dev",
            ),
            pytest.param(
                {"push": False},
                {"assigned_dev": 456},
                False,
                id="Assigner can't push, assigns other as dev",
            ),
            pytest.param(
                {"push": True},
                {"assigned_dev": 456},
                True,
                id="Assigner can push, assigns other as dev",
            ),
            # Assigns other as tester
            pytest.param(
                {},
                {"assigned_qa": 456},
                False,
                id="Assigner has unknown permissions, assigns other as tester",
            ),
            pytest.param(
                {"push": False},
                {"assigned_qa": 456},
                False,
                id="Assigner can't push, assigns other as tester",
            ),
            pytest.param(
                {"push": True},
                {"assigned_qa": 456},
                True,
                id="Assigner can push, assigns other as tester",
            ),
            # Assigns non-collaborator
            pytest.param(
                {"push": True},
                {"assigned_dev": 789},
                False,
                id="Assigner can push, assigns non-collaborator as dev",
            ),
            pytest.param(
                {"push": True},
                {"assigned_qa": 789},
                False,
                id="Assigner can push, assigns non-collaborator as tester",
            ),
        ),
    )
    def test_assign__assigner_permissions(
        self,
        auth_request,
        git_hub_collaboration_factory,
        task,
        assigner_perms,
        data,
        success,
    ):
        auth_request.user.socialaccount_set.update(uid="123")
        git_hub_collaboration_factory(
            project=task.root_project, user__id=123, permissions=assigner_perms
        )
        git_hub_collaboration_factory(
            project=task.root_project, user__id=456, permissions={"push": True}
        )
        git_hub_collaboration_factory(user__id=789)  # Collaborator in other project
        serializer = TaskAssigneeSerializer(
            task, data=data, context={"request": auth_request}
        )
        assert serializer.is_valid() == success, serializer.errors
        if not success:
            assert data.keys() == serializer.errors.keys()

    def test_queues_reassign(
        self,
        rf,
        git_hub_collaboration_factory,
        user_factory,
        task_factory,
        scratch_org_factory,
    ):
        user = user_factory()
        new_user = user_factory(devhub_username="test")
        task = task_factory(
            assigned_dev_id=user.github_id,
            assigned_qa_id=user.github_id,
            commits=["abc123"],
        )
        git_hub_collaboration_factory(
            permissions={"push": True},
            user__id=new_user.github_id,
            project=task.root_project,
        )
        git_hub_collaboration_factory(
            permissions={"push": True},
            user__id=user.github_id,
            project=task.root_project,
        )
        scratch_org_factory(
            owner__devhub_username="test",
            task=task,
            org_type=ScratchOrgType.DEV,
            latest_commit="abc123",
            deleted_at=timezone.now(),
        )
        scratch_org_factory(
            owner__devhub_username="test",
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
        self, auth_request, mailoutbox, git_hub_collaboration_factory, task, settings
    ):
        settings.EMAIL_ENABLED = True
        git_hub_collaboration_factory(
            permissions={"push": True},
            project=task.root_project,
            user__id=auth_request.user.github_id,
        )
        data = {
            "assigned_dev": auth_request.user.github_id,
            "assigned_qa": auth_request.user.github_id,
            "should_alert_dev": True,
            "should_alert_qa": True,
        }
        serializer = TaskAssigneeSerializer(
            task, data=data, context={"request": auth_request}
        )
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        assert len(mailoutbox) == 2

    def test_try_send_assignment_emails__email_disabled(
        self, auth_request, mailoutbox, git_hub_collaboration_factory, task, settings
    ):
        settings.EMAIL_ENABLED = False
        git_hub_collaboration_factory(
            permissions={"push": True},
            project=task.root_project,
            user__id=auth_request.user.github_id,
        )
        data = {
            "assigned_dev": auth_request.user.github_id,
            "assigned_qa": auth_request.user.github_id,
            "should_alert_dev": True,
            "should_alert_qa": True,
        }
        serializer = TaskAssigneeSerializer(
            task, data=data, context={"request": auth_request}
        )
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        assert len(mailoutbox) == 0


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
