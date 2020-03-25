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
        TASK_SUBMIT_REVIEW
        TASK_SUBMIT_REVIEW_FAILED

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
        SCRATCH_ORG_REFRESH
        SCRATCH_ORG_REFRESH_FAILED
"""
from copy import deepcopy

from channels.layers import get_channel_layer
from django.utils.translation import gettext_lazy as _

from ..consumer_utils import get_set_message_semaphore
from .constants import CHANNELS_GROUP_NAME


async def push_message_about_instance(instance, message):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    channel_layer = get_channel_layer()

    new_message = deepcopy(message)
    new_message["model_name"] = model_name
    new_message["id"] = id
    sent_message = {"type": "notify", "content": new_message}
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


async def report_scratch_org_error(
    instance, *, error, type_, originating_user_id, message=None
):
    # @jgerigmeyer asked for the error to be unwrapped in the case that
    # there's only one, which is the most common case, per this
    # discussion:
    # https://github.com/SFDO-Tooling/MetaShare/pull/149#discussion_r327308563
    try:
        prepared_message = error.content
        if isinstance(prepared_message, list) and len(prepared_message) == 1:
            prepared_message = prepared_message[0]
        if isinstance(prepared_message, dict):
            prepared_message = prepared_message.get(
                "prepared_message", prepared_message
            )
        prepared_message = str(prepared_message)
    except AttributeError:
        prepared_message = str(error)

    prepared_message = {
        "type": type_,
        "payload": {
            "message": prepared_message,
            "originating_user_id": originating_user_id,
        },
    }
    prepared_message.update(message or {})
    await push_message_about_instance(instance, prepared_message)
