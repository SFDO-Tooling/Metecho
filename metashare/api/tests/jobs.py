from collections import namedtuple
from contextlib import ExitStack
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from django.utils.timezone import now
from simple_salesforce.exceptions import SalesforceGeneralError

from ..jobs import (
    TaskReviewIntegrityError,
    _create_branches_on_github,
    _create_org_and_run_flow,
    alert_user_about_expiring_org,
    commit_changes_from_org,
    create_branches_on_github_then_create_scratch_org,
    create_pr,
    delete_scratch_org,
    get_unsaved_changes,
    populate_github_users,
    refresh_commits,
    refresh_github_repositories_for_user,
    refresh_scratch_org,
    submit_review,
)
from ..models import SCRATCH_ORG_TYPES

Author = namedtuple("Author", ("avatar_url", "login"))
Commit = namedtuple(
    "Commit",
    ("sha", "author", "message", "commit", "html_url"),
    defaults=("", None, "", None, ""),
)
PATCH_ROOT = "metashare.api.jobs"


@pytest.mark.django_db
class TestCreateBranchesOnGitHub:
    def test_create_branches_on_github(self, user_factory, task_factory):
        user = user_factory()
        task = task_factory()
        project = task.project
        with ExitStack() as stack:
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            global_config = stack.enter_context(patch("metashare.api.gh.GlobalConfig"))
            global_config_instance = MagicMock()
            global_config.return_value = global_config_instance
            global_config_instance.get_project_config.return_value = MagicMock(
                project__git__prefix_feature="feature/"
            )
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            repository.branch.return_value = MagicMock(
                **{"latest_sha.return_value": "123abc"}
            )
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user, repo_id=123, project=project, task=task
            )

            assert repository.create_branch_ref.called

    def test_create_branches_on_github__already_there(
        self, user_factory, project_factory, task_factory
    ):
        user = user_factory()
        project = project_factory(branch_name="pepin")
        task = task_factory(branch_name="charlemagne", project=project)
        with ExitStack() as stack:
            global_config = stack.enter_context(patch("metashare.api.gh.GlobalConfig"))
            global_config_instance = MagicMock()
            global_config.return_value = global_config_instance
            global_config_instance.get_project_config.return_value = MagicMock(
                project__git__prefix_feature="feature/"
            )
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            repository = MagicMock()
            get_repo_info.return_value = repository

            _create_branches_on_github(
                user=user, repo_id=123, project=project, task=task
            )

            assert not repository.create_branch_ref.called


@pytest.mark.django_db
class TestAlertUserAboutExpiringOrg:
    def test_missing_model(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        scratch_org.delete()
        with patch(f"{PATCH_ROOT}.send_mail") as send_mail:
            assert alert_user_about_expiring_org(org=scratch_org, days=3) is None
            assert not send_mail.called

    def test_good(self, scratch_org_factory):
        scratch_org = scratch_org_factory(unsaved_changes={"something": 1})
        with ExitStack() as stack:
            send_mail = stack.enter_context(patch(f"{PATCH_ROOT}.send_mail"))
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
        stack.enter_context(patch(f"{PATCH_ROOT}.get_scheduler"))
        _create_org_and_run_flow(
            MagicMock(org_type=SCRATCH_ORG_TYPES.Dev),
            user=MagicMock(),
            repo_id=123,
            repo_branch=MagicMock(),
            project_path="",
        )

        assert create_org.called
        assert run_flow.called


@pytest.mark.django_db
def test_get_unsaved_changes(scratch_org_factory):
    scratch_org = scratch_org_factory(
        latest_revision_numbers={"TypeOne": {"NameOne": 10}}
    )

    with patch(
        f"{PATCH_ROOT}.get_latest_revision_numbers"
    ) as get_latest_revision_numbers:
        get_latest_revision_numbers.return_value = {
            "TypeOne": {"NameOne": 13},
            "TypeTwo": {"NameTwo": 10},
        }

        get_unsaved_changes(scratch_org=scratch_org)
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
        _create_org_and_run_flow = stack.enter_context(
            patch(f"{PATCH_ROOT}._create_org_and_run_flow")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.get_scheduler"))

        create_branches_on_github_then_create_scratch_org(scratch_org=MagicMock())

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
            refresh_scratch_org(scratch_org)

            assert delete_org.called
            assert _create_org_and_run_flow.called

    def test_refresh_scratch_org__error(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            delete_org = stack.enter_context(patch(f"{PATCH_ROOT}.delete_org"))
            delete_org.side_effect = Exception
            async_to_sync = stack.enter_context(
                patch("metashare.api.model_mixins.async_to_sync")
            )
            logger = stack.enter_context(patch("metashare.api.jobs.logger"))

            with pytest.raises(Exception):
                refresh_scratch_org(scratch_org)

            assert async_to_sync.called
            assert logger.error.called


@pytest.mark.django_db
def test_delete_scratch_org(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with patch(f"{PATCH_ROOT}.delete_org") as sf_delete_scratch_org:
        delete_scratch_org(scratch_org)

        assert sf_delete_scratch_org.called


@pytest.mark.django_db
def test_delete_scratch_org__exception(scratch_org_factory):
    scratch_org = scratch_org_factory()
    with ExitStack() as stack:
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
            delete_scratch_org(scratch_org)

        scratch_org.refresh_from_db()
        assert scratch_org.delete_queued_at is None
        assert get_latest_revision_numbers.called


def test_refresh_github_repositories_for_user(user_factory):
    user = MagicMock()
    refresh_github_repositories_for_user(user)
    assert user.refresh_repositories.called


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
        assert scratch_org.latest_revision_numbers == {}
        commit_changes_from_org(scratch_org, user, desired_changes, commit_message)

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
                patch("metashare.api.model_mixins.async_to_sync")
            )
            _create_branches_on_github = stack.enter_context(
                patch(f"{PATCH_ROOT}._create_branches_on_github")
            )
            _create_branches_on_github.side_effect = Exception
            stack.enter_context(patch(f"{PATCH_ROOT}.local_github_checkout"))
            scratch_org.delete = MagicMock()

            with pytest.raises(Exception):
                create_branches_on_github_then_create_scratch_org(
                    scratch_org=scratch_org
                )

            assert scratch_org.delete.called
            assert async_to_sync.called

    def test_get_unsaved_changes(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metashare.api.model_mixins.async_to_sync")
            )
            get_latest_revision_numbers = stack.enter_context(
                patch(f"{PATCH_ROOT}.get_latest_revision_numbers")
            )
            get_latest_revision_numbers.side_effect = Exception

            with pytest.raises(Exception):
                get_unsaved_changes(scratch_org)

            assert async_to_sync.called

    def test_commit_changes_from_org(self, scratch_org_factory, user_factory):
        user = user_factory()
        scratch_org = scratch_org_factory()
        with ExitStack() as stack:
            async_to_sync = stack.enter_context(
                patch("metashare.api.model_mixins.async_to_sync")
            )
            commit_changes_to_github = stack.enter_context(
                patch(f"{PATCH_ROOT}.commit_changes_to_github")
            )
            commit_changes_to_github.side_effect = Exception

            with pytest.raises(Exception):
                commit_changes_from_org(scratch_org, user, {}, "message")

            assert async_to_sync.called


@pytest.mark.django_db
class TestRefreshCommits:
    def test_task__no_user(self, repository_factory, project_factory, task_factory):
        repository = repository_factory()
        project = project_factory(repository=repository)
        task = task_factory(project=project, branch_name="task", origin_sha="1234abcd")
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
            repo = MagicMock(**{"commits.return_value": [commit1, commit2]})
            get_repo_info = stack.enter_context(
                patch("metashare.api.jobs.get_repo_info")
            )
            get_repo_info.return_value = repo

            refresh_commits(repository=repository, branch_name="task")
            task.refresh_from_db()
            assert len(task.commits) == 0

    def test_task__user(
        self,
        user_factory,
        repository_factory,
        project_factory,
        task_factory,
        git_hub_repository_factory,
    ):
        user = user_factory()
        repository = repository_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123, user=user)
        project = project_factory(repository=repository)
        task = task_factory(project=project, branch_name="task", origin_sha="1234abcd")
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
            repo = MagicMock(**{"commits.return_value": [commit1, commit2]})
            get_repo_info = stack.enter_context(
                patch("metashare.api.jobs.get_repo_info")
            )
            get_repo_info.return_value = repo

            refresh_commits(repository=repository, branch_name="task")
            task.refresh_from_db()
            assert len(task.commits) == 1


@pytest.mark.django_db
def test_create_pr(user_factory, task_factory):
    user = user_factory()
    task = task_factory()
    with ExitStack() as stack:
        pr = MagicMock(number=123)
        repository = MagicMock(**{"create_pull.return_value": pr})
        get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        get_repo_info.return_value = repository

        create_pr(
            task,
            user,
            repo_id=123,
            base="master",
            head="feature",
            title="My PR",
            critical_changes="",
            additional_changes="",
            issues="",
            notes="",
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
            patch("metashare.api.model_mixins.async_to_sync")
        )

        with pytest.raises(Exception):
            create_pr(
                task,
                user,
                repo_id=123,
                base="master",
                head="feature",
                title="My PR",
                critical_changes="",
                additional_changes="",
                issues="",
                notes="",
            )

        assert async_to_sync.called


@pytest.mark.django_db
class TestPopulateGithubUsers:
    def test_user_present(
        self, user_factory, repository_factory, git_hub_repository_factory,
    ):
        user = user_factory()
        repository = repository_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123, user=user)
        with patch("metashare.api.jobs.get_repo_info") as get_repo_info:
            collab1 = MagicMock(
                id=123,
                login="test-user-1",
                avatar_url="http://example.com/avatar1.png",
            )
            collab2 = MagicMock(
                id=456,
                login="test-user-2",
                avatar_url="http://example.com/avatar2.png",
            )
            repo = MagicMock(**{"collaborators.return_value": [collab1, collab2]})
            get_repo_info.return_value = repo

            populate_github_users(repository)
            repository.refresh_from_db()
            assert len(repository.github_users) == 2

    def test_user_missing(self, repository_factory):
        repository = repository_factory(repo_id=123)
        with patch("metashare.api.jobs.logger") as logger:
            populate_github_users(repository)
            assert logger.warning.called

    def test__error(self, user_factory, repository_factory, git_hub_repository_factory):
        user = user_factory()
        repository = repository_factory(repo_id=123)
        git_hub_repository_factory(repo_id=123, user=user)
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
            get_repo_info.side_effect = Exception
            async_to_sync = stack.enter_context(
                patch("metashare.api.model_mixins.async_to_sync")
            )
            logger = stack.enter_context(patch("metashare.api.jobs.logger"))

            with pytest.raises(Exception):
                populate_github_users(repository)

            assert logger.error.called
            assert async_to_sync.called


@pytest.mark.django_db
class TestSubmitReview:
    def test_good(self, task_factory, user_factory):
        with patch("metashare.api.jobs.get_repo_info") as get_repo_info:
            user = user_factory()
            task = task_factory(
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
            )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert task.finalize_submit_review.call_args.kwargs == {
                "sha": "test_sha",
                "status": "APPROVE",
                "delete_org": False,
                "org": None,
            }, task.finalize_submit_review.call_args.kwargs
            assert "err" not in task.finalize_submit_review.call_args.kwargs

    def test_good__has_org(self, task_factory, scratch_org_factory, user_factory):
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(
                patch("metashare.api.jobs.get_repo_info")
            )
            get_repo_info = stack.enter_context(
                patch("metashare.api.model_mixins.get_repo_info")
            )
            user = user_factory()
            task = task_factory(pr_is_open=True, review_valid=True, review_sha="none")
            scratch_org = scratch_org_factory(task=task, latest_commit="test_sha")
            task.finalize_submit_review = MagicMock()
            task.project.repository.get_repo_id = MagicMock()
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
            )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert task.finalize_submit_review.call_args.kwargs == {
                "sha": "test_sha",
                "status": "APPROVE",
                "delete_org": False,
                "org": scratch_org,
            }, task.finalize_submit_review.call_args.kwargs

    def test_good__review_invalid(self, task_factory, user_factory):
        with ExitStack() as stack:
            get_repo_info = stack.enter_context(
                patch("metashare.api.jobs.get_repo_info")
            )
            get_repo_info = stack.enter_context(
                patch("metashare.api.model_mixins.get_repo_info")
            )
            user = user_factory()
            task = task_factory(
                pr_is_open=True, review_valid=False, review_sha="test_sha"
            )
            task.finalize_submit_review = MagicMock()
            task.project.repository.get_repo_id = MagicMock()
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
                )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert "err" in task.finalize_submit_review.call_args.kwargs

    def test_bad(self):
        with patch("metashare.api.jobs.get_repo_info") as get_repo_info:
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
                )

            assert task.finalize_submit_review.called
            assert task.finalize_submit_review.call_args.args
            assert "err" in task.finalize_submit_review.call_args.kwargs
