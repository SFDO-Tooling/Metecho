"""
Websocket notifications you can subscribe to:

    user.:id
        BACKEND_ERROR
        USER_REPOS_REFRESH
        USER_REPOS_ERROR

    project.:id
        PROJECT_UPDATE
        PROJECT_UPDATE_ERROR
        SCRATCH_ORG_PROVISIONING

    epic.:id
        EPIC_UPDATE
        EPIC_CREATE_PR
        EPIC_CREATE_PR_FAILED
        SOFT_DELETE
        SCRATCH_ORG_PROVISIONING

    task.:id
        TASK_UPDATE
        TASK_CREATE_PR
        TASK_CREATE_PR_FAILED
        TASK_SUBMIT_REVIEW
        TASK_SUBMIT_REVIEW_FAILED
        SOFT_DELETE
        SCRATCH_ORG_PROVISIONING

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
        SCRATCH_ORG_REASSIGN
        SCRATCH_ORG_REASSIGN_FAILED
        SCRATCH_ORG_CONVERT_FAILED

    scratchorg.list
        SCRATCH_ORG_RECREATE
"""
from copy import deepcopy

from channels.layers import get_channel_layer
from django.utils.translation import gettext_lazy as _

from ..consumer_utils import get_set_message_semaphore
from .constants import CHANNELS_GROUP_NAME, LIST


async def push_message_about_instance(
    instance, message, for_list=False, group_name=None
):
    model_name = instance._meta.model_name
    id_ = str(instance.id)
    group_name = group_name or CHANNELS_GROUP_NAME.format(
        model=model_name, id=LIST if for_list else id_
    )
    channel_layer = get_channel_layer()

    new_message = deepcopy(message)
    new_message["model_name"] = model_name
    new_message["id"] = id_
    sent_message = {"type": "notify", "content": new_message}
    not_deleted = getattr(instance, "deleted_at", None) is None
    message_about_delete = "DELETE" in message["type"] or "REMOVE" in message["type"]
    semaphore_clear = await get_set_message_semaphore(channel_layer, sent_message)
    if (message_about_delete or not_deleted) and semaphore_clear:
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
    # Unwrap the error in the case that there's only one,
    # which is the most common case, per this discussion:
    # https://github.com/SFDO-Tooling/Metecho/pull/149#discussion_r327308563
    try:
        prepared_message = error.content
        if isinstance(prepared_message, list) and len(prepared_message) == 1:
            prepared_message = prepared_message[0]
        if isinstance(prepared_message, dict):
            prepared_message = prepared_message.get("message", prepared_message)
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
    prepared_message["payload"].update(message or {})
    await push_message_about_instance(instance, prepared_message)
