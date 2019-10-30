from collections import namedtuple
from enum import Enum

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.apps import apps
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.utils.translation import gettext as _

from .api.constants import CHANNELS_GROUP_NAME
from .consumer_utils import clear_message_semaphore

Request = namedtuple("Request", "user")


KNOWN_MODELS = {"user", "project", "task", "scratchorg"}


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
                'content': json_message,
            })
        """
        # Take lock out of redis for this message:
        await clear_message_semaphore(self.channel_layer, event)
        if "content" in event:
            await self.send_json(event["content"])
            return

    def get_instance(self, *, model, id, **kwargs):
        Model = apps.get_model("api", model)
        return Model.objects.get(pk=id)

    async def receive_json(self, content, **kwargs):
        # Just used to sub/unsub to notification channels.
        is_valid, content = self.is_valid(content)
        is_known_model = self.is_known_model(content.get("model", None))
        has_good_permissions = self.has_good_permissions(content)
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

    def has_good_permissions(self, content):
        possible_exceptions = (
            AttributeError,
            KeyError,
            LookupError,
            MultipleObjectsReturned,
            ObjectDoesNotExist,
            ValueError,
            TypeError,
        )
        try:
            obj = self.get_instance(**content)
            return obj.subscribable_by(self.scope["user"])
        except possible_exceptions:
            return False
