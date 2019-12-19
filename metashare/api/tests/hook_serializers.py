from unittest.mock import patch

import pytest
from rest_framework.exceptions import NotFound

from ..hook_serializers import PrHookSerializer, PushHookSerializer
from ..models import TASK_STATUSES


@pytest.mark.django_db
class TestPushHookSerializer:
    def test_process_hook(self, repository_factory):
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
        with patch("metashare.api.hook_serializers.logger") as logger:
            serializer.process_hook()
            assert logger.error.called


@pytest.mark.django_db
class TestPrHookSerializer:
    def test_process_hook__no_matching_repository(self):
        data = {
            "action": "closed",
            "number": 123,
            "pull_request": {"merged": False},
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
            "pull_request": {"merged": True},
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
            "pull_request": {"merged": True},
            "repository": {"id": 123},
        }
        serializer = PrHookSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.process_hook()

        task.refresh_from_db()
        assert task.status == TASK_STATUSES.Completed
