import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator

from ..api.model_mixins import Request
from ..api.push import push_message_about_instance, report_error
from ..api.serializers import (
    ProjectSerializer,
    RepositorySerializer,
    ScratchOrgSerializer,
    TaskSerializer,
)
from ..consumers import PushNotificationConsumer


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__repository(user_factory, repository_factory):
    user = await database_sync_to_async(user_factory)()
    repository = await database_sync_to_async(repository_factory)()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to(
        {"model": "repository", "id": str(repository.id), "action": "SUBSCRIBE"}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await push_message_about_instance(
        repository, {"type": "TEST_MESSAGE", "payload": {"originating_user_id": "abc"}}
    )
    response = await communicator.receive_json_from()
    assert response == {
        "type": "TEST_MESSAGE",
        "payload": {
            "originating_user_id": "abc",
            "model": RepositorySerializer(
                repository, context={"request": Request(user)}
            ).data,
        },
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__project(user_factory, project_factory):
    user = await database_sync_to_async(user_factory)()
    project = await database_sync_to_async(project_factory)()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to(
        {"model": "project", "id": str(project.id), "action": "SUBSCRIBE"}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await push_message_about_instance(
        project, {"type": "TEST_MESSAGE", "payload": {"originating_user_id": "abc"}}
    )
    response = await communicator.receive_json_from()
    assert response == {
        "type": "TEST_MESSAGE",
        "payload": {
            "originating_user_id": "abc",
            "model": ProjectSerializer(
                project, context={"request": Request(user)}
            ).data,
        },
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__task(user_factory, task_factory):
    user = await database_sync_to_async(user_factory)()
    task = await database_sync_to_async(task_factory)()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to(
        {"model": "task", "id": str(task.id), "action": "SUBSCRIBE"}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await push_message_about_instance(
        task, {"type": "TEST_MESSAGE", "payload": {"originating_user_id": "abc"}}
    )
    response = await communicator.receive_json_from()
    assert response == {
        "type": "TEST_MESSAGE",
        "payload": {
            "originating_user_id": "abc",
            "model": TaskSerializer(task, context={"request": Request(user)}).data,
        },
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__scratch_org(
    user_factory, scratch_org_factory
):
    user = await database_sync_to_async(user_factory)()
    scratch_org = await database_sync_to_async(scratch_org_factory)()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to(
        {"model": "scratch_org", "id": str(scratch_org.id), "action": "SUBSCRIBE"}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await push_message_about_instance(
        scratch_org, {"type": "TEST_MESSAGE", "payload": {"originating_user_id": "abc"}}
    )
    response = await communicator.receive_json_from()
    assert response == {
        "type": "TEST_MESSAGE",
        "payload": {
            "originating_user_id": "abc",
            "model": ScratchOrgSerializer(
                scratch_org, context={"request": Request(user)}
            ).data,
        },
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__report_error(user_factory):
    user = await database_sync_to_async(user_factory)()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to(
        {"model": "user", "id": str(user.id), "action": "SUBSCRIBE"}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await report_error(user)
    response = await communicator.receive_json_from()
    assert response == {
        "type": "BACKEND_ERROR",
        "payload": {"message": "There was an error"},
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__unsubscribe(user_factory):
    user = await database_sync_to_async(user_factory)()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to(
        {"model": "user", "id": str(user.id), "action": "SUBSCRIBE"}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await communicator.send_json_to(
        {"model": "user", "id": str(user.id), "action": "UNSUBSCRIBE"}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__invalid_subscription(user_factory):
    user = await database_sync_to_async(user_factory)()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "foobar", "id": "buzbaz"})
    response = await communicator.receive_json_from()
    assert "error" in response

    await communicator.disconnect()
