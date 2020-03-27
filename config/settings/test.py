from .base import *  # NOQA

CHANNEL_LAYERS = {
    "default": {"BACKEND": "metecho.tests.layer_utils.MockedRedisInMemoryChannelLayer"}
}
