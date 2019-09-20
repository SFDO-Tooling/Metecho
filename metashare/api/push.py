"""
Websocket notifications you can subscribe to:

    user.:id
        BACKEND_ERROR
        USER_REPOS_REFRESHING
        USER_REPOS_REFRESH

    project.:id
        PROJECT_UPDATE

    task.:id
        TASK_UPDATE

    scratchorg.:id
        SCRATCH_ORG_PROVISION
        SCRATCH_ORG_PROVISION_FAILED
        SCRATCH_ORG_UPDATE
        SCRATCH_ORG_DELETE
        SCRATCH_ORG_DELETE_FAILED
"""
from channels.layers import get_channel_layer
from django.utils.translation import gettext_lazy as _

from ..consumer_utils import get_set_message_semaphore
from .constants import CHANNELS_GROUP_NAME


async def push_message_about_instance(instance, message):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    channel_layer = get_channel_layer()
    sent_message = {"type": "notify", "content": message}
    if await get_set_message_semaphore(channel_layer, sent_message):
        await channel_layer.group_send(group_name, sent_message)


async def report_error(user):
    message = {
        "type": "BACKEND_ERROR",
        # We don't pass the message through to the front end in case it
        # contains sensitive material:
        "payload": {"message": str(_("There was an error"))},
    }
    await push_message_about_instance(user, message)
