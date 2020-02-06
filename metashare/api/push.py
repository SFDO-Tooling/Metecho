"""
Websocket notifications you can subscribe to:

    user.:id
        BACKEND_ERROR
        USER_REPOS_REFRESH

    repository.:id
        REPOSITORY_UPDATE
        REPOSITORY_UPDATE_ERROR

    project.:id
        PROJECT_UPDATE
        PROJECT_CREATE_PR
        PROJECT_CREATE_PR_FAILED

    task.:id
        TASK_UPDATE
        TASK_CREATE_PR
        TASK_CREATE_PR_FAILED

    scratchorg.:id
        SCRATCH_ORG_PROVISION
        SCRATCH_ORG_PROVISION_FAILED
        SCRATCH_ORG_UPDATE
        SCRATCH_ORG_ERROR
        SCRATCH_ORG_FETCH_CHANGES_FAILED
        SCRATCH_ORG_DELETE
        SCRATCH_ORG_DELETE_FAILED
        SCRATCH_ORG_REMOVE
        SCRATCH_ORG_COMMIT_CHANGES
        SCRATCH_ORG_COMMIT_CHANGES_FAILED
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


async def report_scratch_org_error(instance, err, type_):
    from .serializers import ScratchOrgSerializer

    # @jgerigmeyer asked for the error to be unwrapped in the case that
    # there's only one, which is the most common case, per this
    # discussion:
    # https://github.com/SFDO-Tooling/MetaShare/pull/149#discussion_r327308563
    try:
        message = err.content
        if isinstance(message, list) and len(message) == 1:
            message = message[0]
        if isinstance(message, dict):
            message = message.get("message", message)
        message = str(message)
    except AttributeError:
        message = str(err)

    message = {
        "type": type_,
        "payload": {"message": message, "model": ScratchOrgSerializer(instance).data},
    }
    await push_message_about_instance(instance, message)
