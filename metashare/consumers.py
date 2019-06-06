from collections import namedtuple

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.apps import apps
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.utils.translation import gettext as _

from .api.constants import CHANNELS_GROUP_NAME
from .consumer_utils import clear_message_semaphore

# from importlib import import_module

Request = namedtuple("Request", "user")


KNOWN_MODELS = {"user"}


# def user_context(user):
#     return {"request": Request(user)}


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
        # if "serializer" in event and "instance" in event and "inner_type" in event:
        #     instance = self.get_instance(**event["instance"])
        #     serializer = self.get_serializer(event["serializer"])
        #     payload = {
        #         "payload": serializer(
        #             instance=instance, context=user_context(self.scope["user"])
        #         ).data,
        #         "type": event["inner_type"],
        #     }
        #     await self.send_json(payload)
        #     return

    def get_instance(self, *, model, id):
        Model = apps.get_model("api", model)
        return Model.objects.get(pk=id)

    # def get_serializer(self, serializer_path):
    #     mod, serializer = serializer_path.rsplit(".", 1)
    #     return getattr(import_module(mod), serializer)

    async def receive_json(self, content, **kwargs):
        # Just used to subscribe to notification channels.
        is_valid = self.is_valid(content)
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
        await self.channel_layer.group_add(group_name, self.channel_name)
        await self.send_json(
            {
                "ok": _("Subscribed to {model}.id = {id_}").format(
                    model=content["model"], id_=content["id"]
                )
            }
        )

    def is_valid(self, content):
        return content.keys() == {"model", "id"}

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
