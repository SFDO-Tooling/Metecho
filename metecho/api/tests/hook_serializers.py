from unittest.mock import patch

import pytest
from rest_framework.exceptions import NotFound

from ..hook_serializers import (
    PrHookSerializer,
    PrReviewHookSerializer,
    PushHookSerializer,
)
from ..models import TaskStatus

fixture = pytest.lazy_fixture


@pytest.mark.django_db
class TestPushHookSerializer:
    def test_process_hook__weird_ref(self, project_factory):
        project_factory(repo_id=123)
        data = {
            "forced": False,
            "ref": "not a branch?",
            "commits": [],
            "repository": {"id": 123},
            "sender": {},
        }
        serializer = PushHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        with patch("metecho.api.hook_serializers.logger") as logger:
            serializer.process_hook()
            assert logger.warn.called

    def test_process_hook__tag(self, project_factory):
        project_factory(repo_id=123)
        data = {
            "forced": False,
            "ref": "refs/tags/v0.1",
            "commits": [],
            "repository": {"id": 123},
            "sender": {},
        }
        serializer = PushHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        with patch("metecho.api.hook_serializers.logger") as logger:
            serializer.process_hook()
            assert logger.info.called


@pytest.mark.django_db
class TestPrHookSerializer:
    def test_process_hook__no_matching_project(self):
        data = {
            "action": "closed",
            "number": 123,
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        with pytest.raises(NotFound):
            serializer.process_hook()

    def test_process_hook__no_matching_task(self, project_factory):
        project_factory(repo_id=123)
        data = {
            "action": "closed",
            "number": 456,
            "pull_request": {
                "merged": True,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

    @pytest.mark.parametrize(
        "_task_factory, task_data",
        (
            pytest.param(
                fixture("task_with_project_factory"),
                {"project__repo_id": 123},
                id="With Project",
            ),
            pytest.param(
                fixture("task_factory"),
                {"epic__project__repo_id": 123},
                id="With Epic",
            ),
        ),
    )
    def test_process_hook__mark_matching_tasks_as_completed(
        self, _task_factory, task_data
    ):
        task = _task_factory(**task_data, pr_number=456, status=TaskStatus.IN_PROGRESS)
        data = {
            "action": "closed",
            "number": 456,
            "pull_request": {
                "merged": True,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

        task.refresh_from_db()
        assert task.status == TaskStatus.COMPLETED

    def test_process_hook__closed_not_merged(self, task_factory):
        task = task_factory(
            pr_number=456,
            epic__project__repo_id=123,
            status=TaskStatus.IN_PROGRESS,
        )
        data = {
            "action": "closed",
            "number": 456,
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

        task.refresh_from_db()
        assert task.status == TaskStatus.CANCELED
        assert not task.pr_is_open

    def test_process_hook__reopened(self, task_factory):
        task = task_factory(
            pr_number=456,
            epic__project__repo_id=123,
            status=TaskStatus.IN_PROGRESS,
        )
        data = {
            "action": "reopened",
            "number": 456,
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

        task.refresh_from_db()
        assert task.status == TaskStatus.IN_PROGRESS
        assert task.pr_is_open

    def test_process_hook__close_matching_epics(self, project_factory, epic_factory):
        project = project_factory(repo_id=123)
        epic = epic_factory(pr_number=456, project=project, pr_is_open=True)
        data = {
            "action": "closed",
            "number": 456,
            "pull_request": {
                "merged": True,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

        epic.refresh_from_db()
        assert not epic.pr_is_open

    def test_process_hook__epic_closed_not_merged(self, project_factory, epic_factory):
        project = project_factory(repo_id=123)
        epic = epic_factory(
            pr_number=456,
            project=project,
            pr_is_open=True,
        )
        data = {
            "action": "closed",
            "number": 456,
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

        epic.refresh_from_db()
        assert not epic.pr_is_open

    def test_process_hook__epic_reopened(self, project_factory, epic_factory):
        project = project_factory(repo_id=123)
        epic = epic_factory(
            pr_number=456,
            project=project,
            pr_is_open=True,
        )
        data = {
            "action": "reopened",
            "number": 456,
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

        epic.refresh_from_db()
        assert epic.pr_is_open


@pytest.mark.django_db
class TestPrReviewHookSerializer:
    def test_no_project(self):
        data = {
            "sender": {"login": "login", "avatar_url": "https://example.com"},
            "repository": {"id": 123},
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
        }
        serializer = PrReviewHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

        with pytest.raises(NotFound):
            serializer.process_hook()

    def test_no_task(self, project_factory):
        project_factory(repo_id=123)
        data = {
            "sender": {"login": "login", "avatar_url": "https://example.com"},
            "repository": {"id": 123},
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
        }
        serializer = PrReviewHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

        with pytest.raises(NotFound):
            serializer.process_hook()

    @pytest.mark.parametrize(
        "_factory, task_data",
        (
            pytest.param(
                fixture("task_with_project_factory"),
                {"project__repo_id": 123},
                id="With Project",
            ),
            pytest.param(
                fixture("task_factory"),
                {"epic__project__repo_id": 123},
                id="With Epic",
            ),
        ),
    )
    def test_good(self, _factory, task_data):
        task = _factory(**task_data, pr_number=123)
        data = {
            "sender": {"login": "login", "avatar_url": "https://example.com"},
            "repository": {"id": 123},
            "pull_request": {
                "merged": False,
                "head": {"ref": "head-ref", "sha": "head-sha"},
                "base": {"ref": "base-ref", "sha": "base-sha"},
                "number": 123,
            },
        }
        serializer = PrReviewHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

        serializer.process_hook()
        task.refresh_from_db()
        assert task.reviewers == [
            {"login": "login", "avatar_url": "https://example.com"},
        ]
