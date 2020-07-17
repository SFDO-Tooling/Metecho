from unittest.mock import patch

import pytest
from rest_framework.exceptions import NotFound

from ..hook_serializers import (
    PrHookSerializer,
    PrReviewHookSerializer,
    PushHookSerializer,
)
from ..models import TASK_STATUSES


@pytest.mark.django_db
class TestPushHookSerializer:
    def test_process_hook__weird_ref(self, repository_factory):
        repository_factory(repo_id=123)
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

    def test_process_hook__tag(self, repository_factory):
        repository_factory(repo_id=123)
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
    def test_process_hook__no_matching_repository(self):
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

    def test_process_hook__no_matching_task(self, repository_factory):
        repository_factory(repo_id=123)
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

    def test_process_hook__mark_matching_tasks_as_completed(
        self, repository_factory, task_factory
    ):
        repository = repository_factory(repo_id=123)
        task = task_factory(
            pr_number=456,
            project__repository=repository,
            status=TASK_STATUSES["In progress"],
        )
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
        assert task.status == TASK_STATUSES.Completed

    def test_process_hook__closed_not_merged(self, repository_factory, task_factory):
        repository = repository_factory(repo_id=123)
        task = task_factory(
            pr_number=456,
            project__repository=repository,
            status=TASK_STATUSES["In progress"],
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
        assert task.status == TASK_STATUSES["In progress"]
        assert not task.pr_is_open

    def test_process_hook__reopened(self, repository_factory, task_factory):
        repository = repository_factory(repo_id=123)
        task = task_factory(
            pr_number=456,
            project__repository=repository,
            status=TASK_STATUSES["In progress"],
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
        assert task.status == TASK_STATUSES["In progress"]
        assert task.pr_is_open

    def test_process_hook__close_matching_projects(
        self, repository_factory, project_factory
    ):
        repository = repository_factory(repo_id=123)
        project = project_factory(pr_number=456, repository=repository, pr_is_open=True)
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

        project.refresh_from_db()
        assert not project.pr_is_open

    def test_process_hook__project_closed_not_merged(
        self, repository_factory, project_factory
    ):
        repository = repository_factory(repo_id=123)
        project = project_factory(
            pr_number=456, repository=repository, pr_is_open=True,
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

        project.refresh_from_db()
        assert not project.pr_is_open

    def test_process_hook__project_reopened(self, repository_factory, project_factory):
        repository = repository_factory(repo_id=123)
        project = project_factory(
            pr_number=456, repository=repository, pr_is_open=True,
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

        project.refresh_from_db()
        assert project.pr_is_open


@pytest.mark.django_db
class TestPrReviewHookSerializer:
    def test_no_repository(self):
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

    def test_no_task(self, repository_factory):
        repository_factory(repo_id=123)
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

    def test_good(self, task_factory):
        task = task_factory(project__repository__repo_id=123, pr_number=123)
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
