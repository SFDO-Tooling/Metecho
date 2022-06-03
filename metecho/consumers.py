from copy import deepcopy
from enum import Enum

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.apps import apps
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.utils.translation import gettext as _

from .api.constants import CHANNELS_GROUP_NAME, LIST
from .consumer_utils import clear_message_semaphore

KNOWN_MODELS = {"user", "project", "epic", "task", "scratchorg"}


class Actions(Enum):
    Subscribe = "SUBSCRIBE"
    Unsubscribe = "UNSUBSCRIBE"


class PushNotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    This is just a hint at a start; you will likely need to edit it heavily for your
    project's use case.
    """

    async def connect(self):
        await self.accept()

    async def notify(self, event):
        """
        Handler for calls like::

            channel_layer.group_send(group_name, {
                'type': 'notify',  # This routes it to this handler.
                'content': {
                    'type': str (will map to frontend Redux event),
                    'payload': {
                        'originating_user_id': str,
                        'message': str (error message, optional),
                    },
                    'model_name': str,
                    'id': str,
                    'include_user': bool,
                },
            })
        """
        # Take lock out of redis for this message:
        await clear_message_semaphore(self.channel_layer, event)
        if "content" in event:
            message = await self.hydrate_message(event["content"])
            await self.send_json(message)
            return

    async def hydrate_message(self, content):
        content = deepcopy(content)
        model_name = content.pop("model_name")
        id_ = content.pop("id")
        include_user = content.pop("include_user", False)
        # We usually don't want to include the user model, as that
        # would cause every generic-message to include the serialized user who's
        # getting the message. It'd just be noise on the wire.
        if model_name.lower() != "user" or include_user:
            try:
                instance = await self.get_instance(model=model_name, id=id_)
            except ObjectDoesNotExist:
                pass
            else:
                content["payload"]["model"] = await database_sync_to_async(
                    instance.get_serialized_representation
                )(self.scope["user"])
        return content

    @database_sync_to_async
    def get_instance(self, *, model, id, **kwargs):
        # XXX: We currently hard-code API as it's our only
        # model-containing app:
        Model = apps.get_model("api", model)
        return Model.objects.get(pk=id)

    async def receive_json(self, content, **kwargs):
        # Just used to sub/unsub to notification channels.
        is_valid, content = self.is_valid(content)
        is_known_model = self.is_known_model(content.get("model", None))
        has_good_permissions = await self.has_good_permissions(content)
        all_good = is_valid and is_known_model and has_good_permissions
        if not all_good:
            await self.send_json({"error": _("Invalid subscription.")})
            return
        group_name = CHANNELS_GROUP_NAME.format(
            model=content["model"], id=content["id"]
        )
        self.groups.append(group_name)
        if content["action"] == Actions.Subscribe.value:
            await self.channel_layer.group_add(group_name, self.channel_name)
            await self.send_json(
                {
                    "ok": _("Subscribed to {model}.id = {id_}").format(
                        model=content["model"], id_=content["id"]
                    )
                }
            )
        if content["action"] == Actions.Unsubscribe.value:
            await self.send_json(
                {
                    "ok": _("Unsubscribed from {model}.id = {id_}").format(
                        model=content["model"], id_=content["id"]
                    )
                }
            )
            await self.channel_layer.group_discard(group_name, self.channel_name)

    def _process_value(self, key, value):
        if key == "model":
            # We want to accept model names with `_` and `-` in them
            # from the frontend, but translate them into a normalized
            # form in the backend. It's conceivable that a Django model
            # could have an underscore in it, but it shouldn't, and
            # doing so will cause this to break things.
            return value.replace("_", "").replace("-", "").lower()
        return value

    def is_valid(self, content):
        if content.keys() == {"model", "id", "action"}:
            return True, {k: self._process_value(k, v) for k, v in content.items()}
        return False, content

    def is_known_model(self, model):
        return model in KNOWN_MODELS

    async def has_good_permissions(self, content):
        possible_exceptions = (
            AttributeError,
            KeyError,
            LookupError,
            MultipleObjectsReturned,
            ObjectDoesNotExist,
            ValueError,
            TypeError,
        )
        if content["id"] == LIST:
            return True
        try:
            obj = await self.get_instance(**content)
            return obj.subscribable_by(self.scope["user"])
        except possible_exceptions:
            return False
