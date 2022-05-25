import logging
from collections import namedtuple
from contextlib import ExitStack
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from django.utils.timezone import now
from github3.exceptions import NotFoundError, UnprocessableEntity
from github3.orgs import Organization
from simple_salesforce.exceptions import SalesforceGeneralError

from ..jobs import (
    TaskReviewIntegrityError,
    _create_branches_on_github,
    _create_org_and_run_flow,
    alert_user_about_expiring_org,
    available_org_config_names,
    commit_changes_from_org,
    convert_to_dev_org,
    create_branches_on_github_then_create_scratch_org,
    create_gh_branch_for_new_epic,
    create_pr,
    create_repository,
    delete_scratch_org,
    get_social_image,
    get_unsaved_changes,
    refresh_commits,
    refresh_github_issues,
    refresh_github_organizations_for_user,
    refresh_github_repositories_for_user,
    refresh_github_users,
    refresh_scratch_org,
    submit_review,
    user_reassign,
)
from ..models import ScratchOrgType

Author = namedtuple("Author", ("avatar_url", "login"))
Commit = namedtuple(
    "Commit",
    ("sha", "author", "message", "commit", "html_url"),
    defaults=("", None, "", None, ""),
)
PATCH_ROOT = "metecho.api.jobs"

fixture = pytest.lazy_fixture


@pytest.mark.django_db
class TestCreateBranchesOnGitHub:
    def test_require_epic_or_task(self, user_factory):
        with pytest.raises(ValueError):
            _create_branches_on_github(
                user=user_factory(),
                repo_id=123,
                epic=None,
                task=None,
                originating_user_id="123abc",
            )

    @pytest.mark.parametrize(
        "_task_factory",
        (
            pytest.param(fixture("task_factory"), id="With Epic"),
            pytest.param(fixture("task_with_project_factory"), id="With Project"),
        ),
    )
    def test_create_branches_on_github(self, user_factory, _task_factory):
        user = user_factory()
        task = _task_factory()

        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            project_config = stack.enter_context(patch("metecho.api.gh.ProjectConfig"))
            project_config_instance = MagicMock(project__git__prefix_feature="feature/")
            project_config.return_value = project_config_instance
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            repository.branch.return_value = MagicMock(
                **{"latest_sha.return_value": "123abc"}
            )
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user,
                repo_id=123,
                epic=task.epic,
                task=task,
                originating_user_id="123abc",
            )

            assert repository.create_branch_ref.called

    def test_create_branches_on_github__no_task(self, user_factory, epic_factory):
        user = user_factory()
        epic = epic_factory()

        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            project_config = stack.enter_context(patch("metecho.api.gh.ProjectConfig"))
            project_config_instance = MagicMock(project__git__prefix_feature="feature/")
            project_config.return_value = project_config_instance
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            repository.branch.return_value = MagicMock(
                **{"latest_sha.return_value": "123abc"}
            )
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user,
                repo_id=123,
                epic=epic,
                originating_user_id="123abc",
            )

            assert repository.create_branch_ref.called

    def test_create_branches_on_github__missing(self, user_factory, epic_factory):
        user = user_factory()

        class Repo(MagicMock):
            """Repo with only the default branch available"""

            default_branch = "main"

            def branch(self, name):
                if name != self.default_branch:
                    raise NotFoundError(MagicMock())
                return MagicMock(**{"latest_sha.return_value": "abc123"})

        with ExitStack() as stack:
            try_to_make_branch = stack.enter_context(
                patch(f"{PATCH_ROOT}.try_to_make_branch")
            )
            try_to_make_branch.return_value = "bleep", "bloop"
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_repo_info.return_value = Repo()
            epic = epic_factory(branch_name="placeholder")
            create_gh_branch_for_new_epic(epic, user=user)
            assert try_to_make_branch.called

    def test_create_branches_on_github__settings(
        self, settings, user_factory, task_factory
    ):
        settings.BRANCH_PREFIX = "test_prefix"
        user = user_factory()
        task = task_factory()
        epic = task.epic

        with ExitStack() as stack:
            local_github_checkout = stack.enter_context(
                patch(f"{PATCH_ROOT}.local_github_checkout")
            )
            try_to_make_branch = stack.enter_context(
                patch(f"{PATCH_ROOT}.try_to_make_branch")
            )
            try_to_make_branch.return_value = "bleep", "bloop"
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            repository.branch.return_value = MagicMock(
                **{"latest_sha.return_value": "123abc"}
            )
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user,
                repo_id=123,
                epic=epic,
                task=task,
                originating_user_id="123abc",
            )

            assert try_to_make_branch.called
            assert not local_github_checkout.called

    def test_create_branches_on_github__repo_branch_prefix(
        self, user_factory, task_factory
    ):
        user = user_factory()
        task = task_factory(epic__project__branch_prefix="test_prefix")
        epic = task.epic

        with ExitStack() as stack:
            local_github_checkout = stack.enter_context(
                patch(f"{PATCH_ROOT}.local_github_checkout")
            )
            try_to_make_branch = stack.enter_context(
                patch(f"{PATCH_ROOT}.try_to_make_branch")
            )
            try_to_make_branch.return_value = "bleep", "bloop"
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            repository.branch.return_value = MagicMock(
                **{"latest_sha.return_value": "123abc"}
            )
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user,
                repo_id=123,
                epic=epic,
                task=task,
                originating_user_id="123abc",
            )

            assert try_to_make_branch.called
            assert not local_github_checkout.called

    def test_create_branches_on_github__already_there(
        self, user_factory, epic_factory, task_factory
    ):
        user = user_factory()
        with ExitStack() as stack:
            try_to_make_branch = stack.enter_context(
                patch(f"{PATCH_ROOT}.try_to_make_branch")
            )
            try_to_make_branch.return_value = "bleep", "bloop"
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            stack.enter_context(patch(f"{PATCH_ROOT}.epic_create_branch"))
            get_repo_info.return_value = MagicMock(
                **{
                    "branch.return_value": MagicMock(commit=MagicMock(sha="bleep")),
                    "pull_requests.return_value": (
                        MagicMock(
                            number=123,
                            closed_at=None,
                            merged_at=None,
                        )
                        for _ in range(1)
                    ),
                    "compare_commits.return_value": MagicMock(ahead_by=0),
                }
            )

            epic = epic_factory(branch_name="pepin")
            create_gh_branch_for_new_epic(epic, user=user)
            assert not try_to_make_branch.called

            task = task_factory(branch_name="charlemagne", epic=epic)

        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user,
                repo_id=123,
                epic=epic,
                task=task,
                originating_user_id="123abc",
            )

            assert not repository.create_branch_ref.called


@pytest.mark.django_db
class TestRefreshGitHubIssues:
    def test_filter_pull_requests(
        self, mocker, settings, project_factory, short_issue_factory
    ):
        settings.GITHUB_ISSUE_LIMIT = 5
        get_repo_info = mocker.patch(f"{PATCH_ROOT}.get_repo_info", autospec=True)
        # Repo with 2 issues and 1 PR
        get_repo_info.return_value.issues.return_value.__next__.side_effect = (
            short_issue_factory(title="Issue 1", pull_request_urls=None),
            short_issue_factory(title="Issue 2", pull_request_urls=None),
            short_issue_factory(title="Pull Request 3"),
        )
        project = project_factory(currently_fetching_issues=True)

        refresh_github_issues(project, originating_user_id=None)

        project.refresh_from_db()
        assert project.issues.count() == 2
        assert not project.has_truncated_issues
        assert not project.currently_fetching_issues

    def test_limit(self, mocker, settings, project_factory, short_issue_factory):
        settings.GITHUB_ISSUE_LIMIT = 5
        get_repo_info = mocker.patch(f"{PATCH_ROOT}.get_repo_info", autospec=True)
        # Repo with 10 issues
        get_repo_info.return_value.issues.return_value.__next__.side_effect = (
            short_issue_factory(pull_request_urls=None) for i in range(10)
        )
        project = project_factory(currently_fetching_issues=True)

        refresh_github_issues(project, originating_user_id=None)

        project.refresh_from_db()
        assert project.issues.count() == 5
        assert project.has_truncated_issues
        assert not project.currently_fetching_issues

    def test_idempotent(self, mocker, project_factory, short_issue_factory):
        gh_issue = short_issue_factory(pull_request_urls=None)
        get_repo_info = mocker.patch(f"{PATCH_ROOT}.get_repo_info", autospec=True)
        get_repo_info.return_value.issues.return_value.__next__.side_effect = [gh_issue]
        project = project_factory(currently_fetching_issues=True)

        refresh_github_issues(project, originating_user_id=None)
        issue = project.issues.get()

        # Run again. Should fetch the same issue, not create a new one
        refresh_github_issues(project, originating_user_id=None)
        assert issue == project.issues.get()

    def test_error(self, mocker, caplog, project_factory):
        mocker.patch(f"{PATCH_ROOT}.get_repo_info", side_effect=Exception("Oh no!"))
        project = project_factory(currently_fetching_issues=True)

        with pytest.raises(Exception):
            refresh_github_issues(project, originating_user_id=None)

        project.refresh_from_db()
        assert project.issues.count() == 0
        assert not project.currently_fetching_issues
        assert "Oh no!" in caplog.text


@pytest.mark.django_db
class TestAlertUserAboutExpiringOrg:
    def test_soft_deleted_model(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        scratch_org.delete()
        with patch("metecho.api.models.send_mail") as send_mail:
            assert alert_user_about_expiring_org(org=scratch_org, days=3) is None
            assert not send_mail.called

    @pytest.mark.parametrize(
        "_task_factory",
        (
            pytest.param(fixture("task_factory"), id="Task with Epic"),
            pytest.param(fixture("task_with_project_factory"), id="Task with Project"),
        ),
    )
    def test_good(self, scratch_org_factory, _task_factory):
        scratch_org = scratch_org_factory(
            unsaved_changes={"something": 1}, task=_task_factory()
        )
        with ExitStack() as stack:
            send_mail = stack.enter_context(patch("metecho.api.models.send_mail"))
            get_unsaved_changes = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_unsaved_changes")
            )
            assert alert_user_about_expiring_org(org=scratch_org, days=3) is None
            assert get_unsaved_changes.called
            assert send_mail.called


def test_create_org_and_run_flow():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.get_latest_revision_numbers"))
        create_org = stack.enter_context(patch(f"{PATCH_ROOT}.create_org"))
        create_org.return_value = (
            MagicMock(expires=datetime(2020, 1, 1, 12, 0)),
            MagicMock(),
            MagicMock(),
        )
        run_flow = stack.enter_context(patch(f"{PATCH_ROOT}.run_flow"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        get_valid_target_directories = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_valid_target_directories")
        )
        get_valid_target_directories.return_value = (
            {"source": ["src"], "config": [], "post": [], "pre": []},
            False,
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.get_scheduler"))
        Path = stack.enter_context(patch(f"{PATCH_ROOT}.Path"))
        Path.return_value = MagicMock(**{"read_text.return_value": "test logs"})
        scratch_org = MagicMock(org_type=ScratchOrgType.DEV)
        _create_org_and_run_flow(
            scratch_org,
            user=MagicMock(),
            repo_id=123,
            repo_branch=MagicMock(),
            project_path="",
            originating_user_id=None,
        )

        assert create_org.called
        assert run_flow.called
        assert isinstance(scratch_org.cci_log, str)


def test_create_org_and_run_flow__fall_back_to_cases():
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.get_latest_revision_numbers"))
        create_org = stack.enter_context(patch(f"{PATCH_ROOT}.create_org"))
        create_org.return_value = (
            MagicMock(expires=datetime(2020, 1, 1, 12, 0)),
            MagicMock(
                **{
                    "project_config.keychain.get_org.return_value": MagicMock(
                        setup_flow=None
                    ),
                }
            ),
            MagicMock(),
        )
        run_flow = stack.enter_context(patch(f"{PATCH_ROOT}.run_flow"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        get_valid_target_directories = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_valid_target_directories")
        )
        get_valid_target_directories.return_value = (
            {"source": ["src"], "config": [], "post": [], "pre": []},
            False,
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.get_scheduler"))
        Path = stack.enter_context(patch(f"{PATCH_ROOT}.Path"))
        Path.return_value = MagicMock(**{"read_text.return_value": "test logs"})
        _create_org_and_run_flow(
            MagicMock(org_type=ScratchOrgType.DEV, org_config_name="dev"),
            user=MagicMock(),
            repo_id=123,
            repo_branch=MagicMock(),
            project_path="",
            originating_user_id=None,
        )

        assert create_org.called
        assert run_flow.called


@pytest.mark.django_db
def test_get_unsaved_changes(scratch_org_factory):
    scratch_org = scratch_org_factory(
        latest_revision_numbers={"TypeOne": {"NameOne": 10}}
    )
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
        stack.enter_context(patch("metecho.api.sf_org_changes.get_repo_info"))
        get_valid_target_directories = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_valid_target_directories")
        )
        get_valid_target_directories.return_value = (
            {"source": ["src"], "config": [], "post": [], "pre": []},
            False,
        )
        get_latest_revision_numbers = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
        )
        get_latest_revision_numbers.return_value = {
            "TypeOne": {"NameOne": 13},
            "TypeTwo": {"NameTwo": 10},
        }

        get_unsaved_changes(scratch_org=scratch_org, originating_user_id=None)
        scratch_org.refresh_from_db()

        assert scratch_org.unsaved_changes == {
            "TypeOne": ["NameOne"],
            "TypeTwo": ["NameTwo"],
        }
        assert scratch_org.latest_revision_numbers == {"TypeOne": {"NameOne": 10}}


def test_create_branches_on_github_then_create_scratch_org():
    # Not a great test, but not a complicated function.
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
        _create_branches_on_github = stack.enter_context(
            patch(f"{PATCH_ROOT}._create_branches_on_github")
        )
        _create_branches_on_github.return_value = "this_branch"
        _create_org_and_run_flow = stack.enter_context(
            patch(f"{PATCH_ROOT}._create_org_and_run_flow")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.get_scheduler"))
        get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        latest_sha = MagicMock()
        latest_sha.return_value = "abcd1234"
        repository = MagicMock()
        repository.branch.return_value = MagicMock(latest_sha=latest_sha)
        get_repo_info.return_value = repository

        org = MagicMock(task=None, epic=MagicMock())
        org.parent = MagicMock(branch_name="", latest_sha="")
        create_branches_on_github_then_create_scratch_org(
            scratch_org=org, originating_user_id=None
        )

        assert _create_branches_on_github.called
        assert _create_org_and_run_flow.called


@pytest.mark.django_db
class TestRefreshScratchOrg:
    def test_refresh_scratch_org(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            delete_org = stack.enter_context(patch(f"{PATCH_ROOT}.delete_org"))
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            _create_org_and_run_flow = stack.enter_context(
                patch(f"{PATCH_ROOT}._create_org_and_run_flow")
            )
            refresh_scratch_org(scratch_org, originating_user_id=None)

            assert delete_org.called
            assert _create_org_and_run_flow.called

    def test_refresh_scratch_org__error(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            delete_org = stack.enter_context(patch(f"{PATCH_ROOT}.delete_org"))
            delete_org.side_effect = Exception
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            logger = stack.enter_context(patch(f"{PATCH_ROOT}.logger"))

            with pytest.raises(Exception):
                refresh_scratch_org(scratch_org, originating_user_id=None)

            assert async_to_sync.called
            assert logger.error.called


@pytest.mark.django_db
class TestConvertScratchOrg:
    @pytest.mark.parametrize(
        "_task_factory",
        (
            pytest.param(fixture("task_factory"), id="Task with Epic"),
            pytest.param(fixture("task_with_project_factory"), id="Task with Project"),
        ),
    )
    def test_convert_to_dev_org(self, mocker, scratch_org_factory, _task_factory):
        task = _task_factory()
        scratch_org = scratch_org_factory(
            org_type=ScratchOrgType.PLAYGROUND, task=None, epic=task.epic
        )
        _create_branches_on_github = mocker.patch(
            f"{PATCH_ROOT}._create_branches_on_github"
        )
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")

        convert_to_dev_org(scratch_org, task=task, originating_user_id=None)

        assert _create_branches_on_github.called
        assert async_to_sync.called

        scratch_org.refresh_from_db()
        assert scratch_org.epic is None
        assert scratch_org.task == task
        assert scratch_org.org_type == ScratchOrgType.DEV

    def test_convert_to_dev_org__error(
        self, mocker, caplog, scratch_org_factory, task_factory
    ):
        task = task_factory(epic__project__repo_id=123)
        scratch_org = scratch_org_factory(
            org_type=ScratchOrgType.PLAYGROUND, task=None, epic=task.epic
        )
        mocker.patch(f"{PATCH_ROOT}._create_branches_on_github", side_effect=Exception)
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")

        with pytest.raises(Exception):
            convert_to_dev_org(scratch_org, task=task, originating_user_id=None)

        assert async_to_sync.called
        assert caplog.records[0].levelno == logging.ERROR

        scratch_org.refresh_from_db()
        assert scratch_org.epic == task.epic
        assert scratch_org.task is None
        assert scratch_org.org_type == ScratchOrgType.PLAYGROUND


@pytest.mark.django_db
def test_delete_scratch_org(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(f"{PATCH_ROOT}.delete_org") as sf_delete_scratch_org:
        delete_scratch_org(scratch_org, originating_user_id=None)

        assert sf_delete_scratch_org.called


@pytest.mark.django_db
def test_delete_scratch_org__exception(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.async_to_sync"))
        get_latest_revision_numbers = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
        )
        get_latest_revision_numbers.return_value = {
            "name": {"member": 1, "member2": 1},
            "name1": {"member": 1, "member2": 1},
        }
        sf_delete_scratch_org = stack.enter_context(patch(f"{PATCH_ROOT}.delete_org"))
        sf_delete_scratch_org.side_effect = SalesforceGeneralError(
            "https://example.com", 418, "I'M A TEAPOT", [{"error": "Short and stout"}]
        )
        with pytest.raises(SalesforceGeneralError):
            delete_scratch_org(scratch_org, originating_user_id=None)

        scratch_org.refresh_from_db()
        assert scratch_org.delete_queued_at is None
        assert get_latest_revision_numbers.called


@pytest.mark.django_db
class TestRefreshGitHubRepositoriesForUser:
    def test_success(self, mocker, user_factory):
        user = user_factory(currently_fetching_repos=True)
        notify_changed = mocker.patch.object(
            user, "notify_changed", wraps=user.notify_changed
        )
        mocker.patch(
            "metecho.api.jobs.get_all_org_repos",
            return_value=[
                MagicMock(id=123, html_url="https://example.com/", permissions={}),
                MagicMock(id=456, html_url="https://example.com/", permissions={}),
            ],
        )

        refresh_github_repositories_for_user(user)
        user.refresh_from_db()

        assert not user.currently_fetching_repos
        assert user.repositories.count() == 2
        assert notify_changed.called

    def test_error(self, mocker, caplog, user_factory, git_hub_repository_factory):
        user = user_factory(currently_fetching_repos=True)
        git_hub_repository_factory(user=user)
        mocker.patch(
            "metecho.api.jobs.get_all_org_repos", side_effect=Exception("Oh no!")
        )
        notify_error = mocker.patch.object(
            user, "notify_error", wraps=user.notify_error
        )

        with pytest.raises(Exception):
            refresh_github_repositories_for_user(user)
        user.refresh_from_db()

        assert not user.currently_fetching_repos
        assert user.repositories.count() == 1
        assert notify_error.called
        assert "Oh no!" in caplog.text


@pytest.mark.django_db
class TestRefreshGitHubOrganizationsForUser:
    def test_success(self, mocker, user_factory, git_hub_organization_factory):
        member_org = git_hub_organization_factory(login="member-org")
        git_hub_organization_factory()  # Another unrelated org
        user = user_factory(currently_fetching_orgs=True)
        notify_changed = mocker.patch.object(
            user, "notify_changed", wraps=user.notify_changed
        )
        gh_as_user = mocker.patch(f"{PATCH_ROOT}.gh_as_user")
        gh_as_user.return_value.organizations.return_value = (
            mocker.MagicMock(login="member-org"),
        )

        refresh_github_organizations_for_user(user)
        user.refresh_from_db()

        assert not user.currently_fetching_orgs
        assert tuple(user.organizations.all()) == (member_org,)
        assert notify_changed.called

    def test_error(self, mocker, caplog, user_factory):
        user = user_factory(currently_fetching_orgs=True)
        notify_error = mocker.patch.object(
            user, "notify_error", wraps=user.notify_error
        )
        gh_as_user = mocker.patch(f"{PATCH_ROOT}.gh_as_user")
        gh_as_user.return_value.organizations.side_effect = Exception("Oh no!")

        with pytest.raises(Exception):
            refresh_github_organizations_for_user(user)
        user.refresh_from_db()

        assert not user.currently_fetching_orgs
        assert not user.organizations.exists()
        assert notify_error.called
        assert "Oh no!" in caplog.text


@pytest.mark.django_db
def test_commit_changes_from_org(scratch_org_factory, user_factory):
    scratch_org = scratch_org_factory()
    user = user_factory()
    with ExitStack() as stack:
        commit_changes_to_github = stack.enter_context(
            patch(f"{PATCH_ROOT}.commit_changes_to_github")
        )
        get_latest_revision_numbers = stack.enter_context(
            patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
        )
        get_latest_revision_numbers.return_value = {
            "name": {"member": 1, "member2": 1},
            "name1": {"member": 1, "member2": 1},
        }
        get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        commit = MagicMock(
            sha="12345",
            html_url="https://github.com/test/user/foo",
            commit=MagicMock(author={"date": now()}),
        )
        repository = MagicMock()
        repository.branch.return_value = MagicMock(commit=commit)
        get_repo_info.return_value = repository

        desired_changes = {"name": ["member"]}
        commit_message = "test message"
        target_directory = "src"
        assert scratch_org.latest_revision_numbers == {}
        commit_changes_from_org(
            scratch_org=scratch_org,
            user=user,
            desired_changes=desired_changes,
            commit_message=commit_message,
            target_directory=target_directory,
            originating_user_id=None,
        )

        assert commit_changes_to_github.called
        assert scratch_org.latest_revision_numbers == {"name": {"member": 1}}


# TODO: this should be bundled with each function, not all error-handling together.
@pytest.mark.django_db
class TestErrorHandling:
    def test_create_branches_on_github_then_create_scratch_org(
        self, scratch_org_factory
    ):
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            _create_branches_on_github = stack.enter_context(
                patch(f"{PATCH_ROOT}._create_branches_on_github")
            )
            _create_branches_on_github.side_effect = Exception
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            scratch_org.delete = MagicMock()

            with pytest.raises(Exception):
                create_branches_on_github_then_create_scratch_org(
                    scratch_org=scratch_org,
                    originating_user_id=None,
                )

            assert scratch_org.delete.called
            assert async_to_sync.called

    def test_get_unsaved_changes(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            get_latest_revision_numbers = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
            )
            get_latest_revision_numbers.side_effect = Exception

            with pytest.raises(Exception):
                get_unsaved_changes(scratch_org, originating_user_id=None)

            assert async_to_sync.called

    def test_commit_changes_from_org(self, scratch_org_factory, user_factory):
        user = user_factory()
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            commit_changes_to_github = stack.enter_context(
                patch(f"{PATCH_ROOT}.commit_changes_to_github")
            )
            commit_changes_to_github.side_effect = Exception

            with pytest.raises(Exception):
                commit_changes_from_org(
                    scratch_org=scratch_org,
                    user=user,
                    desired_changes={},
                    commit_message="message",
                    target_directory="src",
                    originating_user_id=None,
                )

            assert async_to_sync.called


@pytest.mark.django_db
class TestRefreshCommits:
    def test_refreshes_commits(
        self,
        user_factory,
        project_factory,
        epic_factory,
        task_factory,
        git_hub_repository_factory,
    ):
        user = user_factory()
        project = project_factory(repo_id=123, branch_name="project")
        git_hub_repository_factory(repo_id=123, user=user)
        epic = epic_factory(project=project, branch_name="epic")
        task = task_factory(epic=epic, branch_name="task", origin_sha="1234abcd")
        with ExitStack() as stack:
            commit1 = Commit(
                **{
                    "sha": "abcd1234",
                    "author": Author(
                        **{
                            "avatar_url": "https://example.com/img.png",
                            "login": "test_user",
                        }
                    ),
                    "message": "Test message 1",
                    "commit": Commit(**{"author": {"date": "2019-12-09 13:00"}}),
                    "html_url": "https://github.com/test/user/foo",
                }
            )
            commit2 = Commit(
                **{
                    "sha": "1234abcd",
                    "author": None,
                    "message": "Test message 2",
                    "commit": Commit(**{"author": {"date": "2019-12-09 12:30"}}),
                    "html_url": "https://github.com/test/user/foo",
                }
            )
            repo = MagicMock(
                **{
                    "compare_commits.return_value": MagicMock(ahead_by=0),
                    "branch.return_value": MagicMock(commit=MagicMock(sha="bleep")),
                    "commits.return_value": [commit1, commit2],
                }
            )
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_repo_info.return_value = repo
            gh_get_repo_info = stack.enter_context(
                patch("metecho.api.gh.get_repo_info")
            )
            gh_get_repo_info.return_value = repo

            refresh_commits(
                project=project, branch_name="task", originating_user_id=None
            )
            task.refresh_from_db()
            assert len(task.commits) == 1

            refresh_commits(
                project=project, branch_name="epic", originating_user_id=None
            )
            epic.refresh_from_db()
            assert epic.latest_sha == "abcd1234"

            refresh_commits(
                project=project, branch_name="project", originating_user_id=None
            )
            project.refresh_from_db()
            assert project.latest_sha == "abcd1234"


@pytest.mark.django_db
def test_create_pr(user_factory, task_factory):
    user = user_factory()
    task = task_factory(assigned_qa=user.github_id)
    with ExitStack() as stack:
        pr = MagicMock(number=123)
        repository = MagicMock(**{"create_pull.return_value": pr})
        get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        get_repo_info.return_value = repository

        create_pr(
            task,
            user,
            repo_id=123,
            base="main",
            head="feature",
            title="My PR",
            critical_changes="",
            additional_changes="",
            issues="",
            notes="",
            alert_assigned_qa=True,
            originating_user_id=None,
        )

        assert repository.create_pull.called
        assert task.pr_number == 123


@pytest.mark.django_db
def test_create_pr__error(user_factory, task_factory):
    user = user_factory()
    task = task_factory()
    with ExitStack() as stack:
        repository = MagicMock()
        get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        get_repo_info.return_value = repository
        repository.create_pull = MagicMock(side_effect=Exception)
        async_to_sync = stack.enter_context(
            patch("metecho.api.model_mixins.async_to_sync")
        )

        with pytest.raises(Exception):
            create_pr(
                task,
                user,
                repo_id=123,
                base="main",
                head="feature",
                title="My PR",
                critical_changes="",
                additional_changes="",
                issues="",
                notes="",
                alert_assigned_qa=True,
                originating_user_id=None,
            )

        assert async_to_sync.called


@pytest.mark.django_db
class TestRefreshGitHubUsers:
    def test_success(
        self,
        mocker,
        user_factory,
        project_factory,
        git_hub_repository_factory,
    ):
        user = user_factory()
        project = project_factory(repo_id=123, currently_fetching_github_users=True)
        git_hub_repository_factory(repo_id=123, user=user)
        collab1 = MagicMock(
            id=123,
            login="test-user-1",
            avatar_url="https://example.com/avatar1.png",
            permissions={"push": False},
        )
        collab2 = MagicMock(
            id=456,
            login="test-user-2",
            avatar_url="https://example.com/avatar2.png",
            permissions={"push": True},
        )
        repo = MagicMock(**{"collaborators.return_value": [collab1, collab2]})
        mocker.patch(f"{PATCH_ROOT}.get_repo_info", return_value=repo)
        get_cached_user = mocker.patch(f"{PATCH_ROOT}.get_cached_user")
        get_cached_user.return_value.name = "FULL NAME"
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")

        refresh_github_users(project, originating_user_id=None)

        project.refresh_from_db()
        assert project.github_users == [
            {
                "id": "123",
                "name": "FULL NAME",
                "login": "test-user-1",
                "avatar_url": "https://example.com/avatar1.png",
                "permissions": {"push": False},
            },
            {
                "id": "456",
                "name": "FULL NAME",
                "login": "test-user-2",
                "avatar_url": "https://example.com/avatar2.png",
                "permissions": {"push": True},
            },
        ]
        assert not project.currently_fetching_github_users
        assert async_to_sync.called

    def test_expand_user_error(
        self,
        caplog,
        mocker,
        user_factory,
        project_factory,
        git_hub_repository_factory,
    ):
        """
        Expect the "simple" representation of the user if expanding them fails
        """
        user = user_factory()
        project = project_factory(repo_id=123, currently_fetching_github_users=True)
        git_hub_repository_factory(repo_id=123, user=user)
        collab1 = MagicMock(
            id=123,
            login="test-user-1",
            avatar_url="https://example.com/avatar1.png",
            permissions={},
        )
        repo = MagicMock(**{"collaborators.return_value": [collab1]})
        mocker.patch(f"{PATCH_ROOT}.get_repo_info", return_value=repo)
        mocker.patch(
            f"{PATCH_ROOT}.get_cached_user", side_effect=Exception("GITHUB ERROR")
        )
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")

        refresh_github_users(project, originating_user_id=None)

        project.refresh_from_db()
        assert project.github_users == [
            {
                "id": "123",
                "login": "test-user-1",
                "avatar_url": "https://example.com/avatar1.png",
                "permissions": {},
            },
        ]
        assert not project.currently_fetching_github_users
        assert async_to_sync.called
        assert "GITHUB ERROR" in caplog.text

    def test_error(
        self, mocker, caplog, user_factory, project_factory, git_hub_repository_factory
    ):
        user = user_factory()
        project = project_factory(repo_id=123, currently_fetching_github_users=True)
        git_hub_repository_factory(repo_id=123, user=user)
        mocker.patch(f"{PATCH_ROOT}.get_repo_info", side_effect=Exception("Oh no!"))
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")

        with pytest.raises(Exception):
            refresh_github_users(project, originating_user_id=None)

        project.refresh_from_db()
        assert not project.currently_fetching_github_users
        assert async_to_sync.called
        assert "Oh no!" in caplog.text


@pytest.mark.django_db
class TestSubmitReview:
    @pytest.mark.parametrize(
        "_task_factory",
        (
            pytest.param(fixture("task_factory"), id="Task with Epic"),
            pytest.param(fixture("task_with_project_factory"), id="Task with Project"),
        ),
    )
    def test_good(self, user_factory, _task_factory):
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))

            user = user_factory()
            task = _task_factory(
                pr_is_open=True, review_valid=True, review_sha="test_sha"
            )
            task.finalize_submit_review = MagicMock()
            pr = MagicMock()
            repository = MagicMock(**{"pull_request.return_value": pr})
            get_repo_info.return_value = repository
            submit_review(
                user=user,
                task=task,
                data={
                    "notes": "Notes",
                    "status": "APPROVE",
                    "delete_org": False,
                    "org": None,
                },
                originating_user_id=None,
            )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert task.finalize_submit_review.call_args.kwargs == {
                "sha": "test_sha",
                "status": "APPROVE",
                "delete_org": False,
                "org": None,
                "originating_user_id": None,
            }, task.finalize_submit_review.call_args.kwargs
            assert "err" not in task.finalize_submit_review.call_args.kwargs

    def test_good__has_org(self, task_factory, scratch_org_factory, user_factory):
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_repo_info = stack.enter_context(
                patch("metecho.api.model_mixins.get_repo_info")
            )

            user = user_factory()
            task = task_factory(pr_is_open=True, review_valid=True, review_sha="none")
            scratch_org = scratch_org_factory(task=task, latest_commit="test_sha")
            task.finalize_submit_review = MagicMock()
            task.get_repo_id = MagicMock()
            pr = MagicMock()
            repository = MagicMock(**{"pull_request.return_value": pr})
            get_repo_info.return_value = repository
            submit_review(
                user=user,
                task=task,
                data={
                    "notes": "Notes",
                    "status": "APPROVE",
                    "delete_org": False,
                    "org": scratch_org,
                },
                originating_user_id=None,
            )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert task.finalize_submit_review.call_args.kwargs == {
                "sha": "test_sha",
                "status": "APPROVE",
                "delete_org": False,
                "org": scratch_org,
                "originating_user_id": None,
            }, task.finalize_submit_review.call_args.kwargs

    def test_good__review_invalid(self, task_factory, user_factory):
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_repo_info = stack.enter_context(
                patch("metecho.api.model_mixins.get_repo_info")
            )

            user = user_factory()
            task = task_factory(
                pr_is_open=True, review_valid=False, review_sha="test_sha"
            )
            task.finalize_submit_review = MagicMock()
            task.get_repo_id = MagicMock()
            pr = MagicMock()
            repository = MagicMock(**{"pull_request.return_value": pr})
            get_repo_info.return_value = repository
            with pytest.raises(TaskReviewIntegrityError):
                submit_review(
                    user=user,
                    task=task,
                    data={
                        "notes": "Notes",
                        "status": "APPROVE",
                        "delete_org": False,
                        "org": None,
                    },
                    originating_user_id=None,
                )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert "error" in task.finalize_submit_review.call_args.kwargs

    def test_bad(self):
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))

            task = MagicMock()
            pr = MagicMock()
            pr.create_review.side_effect = ValueError()
            repository = MagicMock(**{"pull_request.return_value": pr})
            get_repo_info.return_value = repository
            with pytest.raises(ValueError):
                submit_review(
                    user=None,
                    task=task,
                    data={
                        "notes": "Notes",
                        "status": "APPROVE",
                        "delete_org": False,
                        "org": None,
                    },
                    originating_user_id=None,
                )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert "error" in task.finalize_submit_review.call_args.kwargs


@pytest.mark.django_db
class TestCreateGhBranchForNewEpic:
    def test_no_pr(self, user_factory, epic_factory):
        user = user_factory()
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            stack.enter_context(patch(f"{PATCH_ROOT}.epic_create_branch"))
            get_repo_info.return_value = MagicMock(
                **{
                    "branch.return_value": MagicMock(commit=MagicMock(sha="bleep")),
                    "pull_requests.return_value": (
                        _ for _ in range(0)  # empty generator
                    ),
                    "compare_commits.return_value": MagicMock(ahead_by=0),
                }
            )

            epic = epic_factory(branch_name="pepin")
            create_gh_branch_for_new_epic(epic, user=user)
            assert epic.pr_number is None

    def test_no_branch_name(self, user_factory, epic_factory):
        user = user_factory()
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            epic_create_branch = stack.enter_context(
                patch(f"{PATCH_ROOT}.epic_create_branch")
            )
            get_repo_info.return_value = MagicMock()

            epic = epic_factory()
            create_gh_branch_for_new_epic(epic, user=user)
            assert epic_create_branch.called

    def test_exception(self, user_factory, epic_factory):
        user = user_factory()
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            epic_create_branch = stack.enter_context(
                patch(f"{PATCH_ROOT}.epic_create_branch")
            )
            get_repo_info.side_effect = ValueError()

            epic = epic_factory()
            with pytest.raises(ValueError):
                create_gh_branch_for_new_epic(epic, user=user)

            assert not epic_create_branch.called


@pytest.mark.django_db
class TestAvailableTaskOrgConfigNames:
    def test_available_org_config_names(self, project_factory, user_factory):
        project = project_factory()
        user = user_factory()
        project.finalize_available_org_config_names = MagicMock()
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_repo_info.return_value = MagicMock(
                **{
                    "name": "repo",
                    "html_url": "https://example.com",
                    "owner.login": "login",
                    "branch.return_value": MagicMock(
                        **{"latest_sha.return_value": "123abc"}
                    ),
                }
            )
            stack.enter_context(patch(f"{PATCH_ROOT}.get_project_config"))
            BaseCumulusCI = stack.enter_context(
                patch("metecho.api.sf_org_changes.BaseCumulusCI")
            )
            BaseCumulusCI.return_value = MagicMock(
                **{"project_config.orgs__scratch": {}}
            )

            available_org_config_names(project, user=user)

            assert project.finalize_available_org_config_names.called

    def test_available_org_config_names__error(self, project_factory, user_factory):
        project = project_factory()
        user = user_factory()
        project.finalize_available_org_config_names = MagicMock()
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_repo_info.side_effect = ValueError

            with pytest.raises(ValueError):
                available_org_config_names(project, user=user)

            assert project.finalize_available_org_config_names.called


@pytest.mark.django_db
@pytest.mark.parametrize(
    "img_url, expected",
    (
        (
            "https://repository-images.githubusercontent.com/repo.png",
            "https://repository-images.githubusercontent.com/repo.png",
        ),
        ("https://example.com/repo.png", ""),
    ),
)
def test_get_social_image(project_factory, img_url, expected):
    project = project_factory()
    with ExitStack() as stack:
        stack.enter_context(patch("metecho.api.jobs.get_repo_info"))
        get = stack.enter_context(patch("metecho.api.jobs.requests.get"))
        get.return_value = MagicMock(
            content="""
            <html>
                <head>
                <meta property="og:image" content="{}">
                </head>
                <body></body>
            </html>
            """.format(
                img_url
            )
        )
        get_social_image(project=project)

        project.refresh_from_db()
        assert project.repo_image_url == expected


@pytest.mark.django_db
class TestUserReassign:
    def test_happy(self, scratch_org_factory, user_factory):
        scratch_org = scratch_org_factory()
        user = user_factory()

        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            stack.enter_context(
                patch("metecho.api.models.ScratchOrg.get_refreshed_org_config")
            )
            user_reassign(scratch_org, new_user=user, originating_user_id=str(user.id))

            assert async_to_sync.called

    def test_sad(self, scratch_org_factory, user_factory):
        scratch_org = scratch_org_factory()
        user = user_factory()

        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metecho.api.model_mixins.async_to_sync")
            )
            get_refreshed_org_config = stack.enter_context(
                patch("metecho.api.models.ScratchOrg.get_refreshed_org_config")
            )
            get_refreshed_org_config.side_effect = ValueError()
            user_reassign(scratch_org, new_user=user, originating_user_id=str(user.id))

            assert async_to_sync.called


@pytest.mark.django_db
class TestCreateRepository:
    @pytest.fixture
    def github_mocks(self, mocker, project_factory):
        """
        Mock the best-case scenario where the user is a member of the GH organization
        and the repository and team are created successfully
        """
        project = project_factory(github_users=({"login": "user1"}, {"login": "user2"}))
        team = mocker.MagicMock()
        repo = mocker.MagicMock(id=123456, html_url="", permissions=[])

        gh_user = mocker.patch(f"{PATCH_ROOT}.gh_as_user", autospec=True).return_value
        gh_user.organizations.return_value = [
            mocker.MagicMock(login=project.repo_owner, spec=Organization)
        ]
        gh_org = mocker.patch(
            f"{PATCH_ROOT}.gh_as_org", autospec=True
        ).return_value.organization.return_value
        gh_org.create_team.return_value = team
        gh_org.create_repository.return_value = repo

        return project, gh_org, team, repo

    def test_ok(self, mocker, github_mocks, user_factory):
        user = user_factory()
        project, org, team, repo = github_mocks
        mocker.patch(f"{PATCH_ROOT}.init_from_context")
        sarge = mocker.patch(f"{PATCH_ROOT}.sarge", autospec=True)
        sarge.capture_both.return_value.returncode = 0
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")
        zipfile = mocker.patch(f"{PATCH_ROOT}.download_extract_github").return_value

        create_repository(
            project,
            user=user,
            dependencies=["http://foo.com"],
            template_repo_owner="owner",
            template_repo_name="repo",
        )
        project.refresh_from_db()

        assert project.repo_id == 123456
        assert user.repositories.filter(repo_id=123456).exists()
        assert (
            team.add_or_update_membership.call_count == 2
        ), "Expected one call each collaborator"
        async_to_sync.return_value.assert_called_with(
            project,
            {
                "type": "PROJECT_CREATE",
                "payload": {"originating_user_id": user.pk},
            },
            for_list=False,
            group_name=None,
            include_user=False,
        )
        assert sarge.capture_both.called
        assert zipfile.extractall.called

    def test__gh_error(self, mocker, caplog, project, user_factory):
        user = user_factory()
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")
        mocker.patch(f"{PATCH_ROOT}.gh_as_user", side_effect=Exception("Oh no!"))

        with pytest.raises(Exception, match="Oh no!"):
            create_repository(project, user=user, dependencies=[])

        with pytest.raises(project.DoesNotExist):
            # Expect project to be deleted from the DB since repo creation failed
            project.refresh_from_db()
        assert "Oh no!" in caplog.text
        async_to_sync.return_value.assert_called_with(
            project,
            {
                "type": "PROJECT_CREATE_ERROR",
                "payload": {
                    "originating_user_id": user.pk,
                    "message": "Oh no!",
                },
            },
            for_list=False,
            group_name=None,
            include_user=False,
        )

    def test__team_name_taken(self, mocker, github_mocks, project, user_factory):
        user = user_factory()
        project, org, team, repo = github_mocks
        resp = mocker.MagicMock(status_code=422)
        resp.json.return_value = {"message": "Validation Failed"}
        # Simulate the first two team names being taken
        org.create_team.side_effect = [
            UnprocessableEntity(resp),
            UnprocessableEntity(resp),
            mocker.DEFAULT,
        ]
        mocker.patch(f"{PATCH_ROOT}.init_from_context")
        sarge = mocker.patch(f"{PATCH_ROOT}.sarge", autospec=True)
        sarge.capture_both.return_value.returncode = 0
        mocker.patch("metecho.api.model_mixins.async_to_sync")
        mocker.patch(f"{PATCH_ROOT}.download_extract_github").return_value

        create_repository(project, user=user, dependencies=[])

        org.create_team.assert_has_calls(
            [
                mocker.call(f"{project} Team"),
                mocker.call(f"{project} Team 1"),
                mocker.call(f"{project} Team 2"),
            ]
        )

    def test__team_error(self, mocker, github_mocks, project, user_factory):
        user = user_factory()
        project, org, team, repo = github_mocks
        resp = mocker.MagicMock(status_code=422)
        resp.json.return_value = {"message": "Not a validation error"}
        org.create_team.side_effect = UnprocessableEntity(resp)

        with pytest.raises(UnprocessableEntity, match="Not a validation error"):
            create_repository(project, user=user, dependencies=[])

    @pytest.mark.parametrize("fail_repo_delete", (True, False))
    def test__push_error(
        self, mocker, caplog, github_mocks, user_factory, fail_repo_delete
    ):
        user = user_factory()
        project, org, team, repo = github_mocks
        repo.teams.return_value = [team]
        if fail_repo_delete:
            repo.delete.side_effect = Exception("REPO DELETE FAIL")
        mocker.patch(f"{PATCH_ROOT}.init_from_context")
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")
        cmd = mocker.patch(
            f"{PATCH_ROOT}.sarge", autospec=True
        ).capture_both.return_value
        cmd.returncode = 1
        cmd.stderr.text = "REPO PUSH FAIL"

        with pytest.raises(Exception, match="Failed to push"):
            create_repository(project, user=user, dependencies=[])

        with pytest.raises(project.DoesNotExist):
            # Expect project to be deleted from the DB since repo creation failed
            project.refresh_from_db()
        assert repo.delete.called
        assert team.delete.called
        if fail_repo_delete:
            assert "REPO DELETE FAIL" in caplog.text
        assert "REPO PUSH FAIL" in caplog.text
        async_to_sync.return_value.assert_called_with(
            project,
            {
                "type": "PROJECT_CREATE_ERROR",
                "payload": {
                    "originating_user_id": user.pk,
                    "message": "Failed to push files to GitHub repository",
                },
            },
            for_list=False,
            group_name=None,
            include_user=False,
        )

    def test_not_a_member(self, mocker, caplog, project, user_factory):
        user = user_factory()
        async_to_sync = mocker.patch("metecho.api.model_mixins.async_to_sync")
        gh_user = mocker.patch(f"{PATCH_ROOT}.gh_as_user").return_value
        gh_user.organizations.return_value = []  # No orgs

        with pytest.raises(ValueError, match="you are not a member"):
            create_repository(project, user=user, dependencies=[])

        assert "you are not a member" in caplog.text
        async_to_sync.return_value.assert_called_with(
            project,
            {
                "type": "PROJECT_CREATE_ERROR",
                "payload": {
                    "originating_user_id": user.pk,
                    "message": f"Either you are not a member of the {project.repo_owner} "
                    "organization or it hasn't installed the Metecho GitHub app",
                },
            },
            for_list=False,
            group_name=None,
            include_user=False,
        )
