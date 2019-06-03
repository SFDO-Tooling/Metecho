from channels.layers import InMemoryChannelLayer


class MockedConnection:
    async def setnx(self, *args, **kwargs):
        return True

    async def delete(self, *args, **kwargs):
        pass


class MockedConnectionContextManager:
    async def __aenter__(self):
        return MockedConnection()

    async def __aexit__(self, *args, **kwargs):
        pass


class MockedRedisInMemoryChannelLayer(InMemoryChannelLayer):
    def connection(self, *args, **kwargs):
        return MockedConnectionContextManager()
