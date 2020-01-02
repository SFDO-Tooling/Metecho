from unittest.mock import MagicMock, patch
from channels.db import database_sync_to_async

import pytest

from ..push import report_error, report_scratch_org_error


class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


PATCH_ROOT = "metashare.api.push"


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_report_error(user_factory):
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message:
        user = await database_sync_to_async(user_factory)()
        await report_error(user)
        assert push_message.called


@pytest.mark.asyncio
async def test_report_scratch_org_error():
    with patch(
        f"{PATCH_ROOT}.push_message_about_instance", new=AsyncMock()
    ) as push_message_about_instance:
        await report_scratch_org_error(MagicMock(), "fake error", "fake type")
        assert push_message_about_instance.called
