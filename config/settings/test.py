from .base import *  # NOQA

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "metashare.tests.layer_utils.MockedRedisInMemoryChannelLayer"
    }
}
