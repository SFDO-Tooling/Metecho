from unittest.mock import MagicMock, patch

import pytest
from channels.db import database_sync_to_async

from ..push import report_error, report_scratch_org_error


class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


PATCH_ROOT = "metecho.api.push"


@pytest.mark.django_db
async def test_report_error(user_factory):
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message:
        user = await database_sync_to_async(user_factory)()
        await report_error(user)
        assert push_message.called


async def test_report_scratch_org_error__attribute_error():
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message_about_instance:
        await report_scratch_org_error(
            MagicMock(), error="fake error", type_="fake type", originating_user_id=None
        )
        assert push_message_about_instance.called


async def test_report_scratch_org_error__list():
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message_about_instance:
        await report_scratch_org_error(
            MagicMock(),
            error=MagicMock(content=["fake error"]),
            type_="fake type",
            originating_user_id=None,
        )
        assert push_message_about_instance.called


async def test_report_scratch_org_error__dict():
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message_about_instance:
        await report_scratch_org_error(
            MagicMock(),
            error=MagicMock(content={"message": "fake error"}),
            type_="fake type",
            originating_user_id=None,
        )
        assert push_message_about_instance.called
