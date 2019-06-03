from unittest.mock import MagicMock

import pytest

from ..push import report_error


class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_report_error(mocker, user_factory):
    push_message = mocker.patch(
        "metashare.api.push.push_message_about_instance", new=AsyncMock()
    )
    user = user_factory()
    await report_error(user)
    assert push_message.called
