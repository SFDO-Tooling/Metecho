from redis.connection import ConnectionPool, SSLConnection


class SSLConnectionPool(ConnectionPool):
    """Connection pool that disable SSL checks by default"""

    def __init__(
        self, connection_class=SSLConnection, max_connections=None, **connection_kwargs
    ):
        connection_kwargs.setdefault("ssl_cert_reqs", False)
        super().__init__(connection_class, max_connections, **connection_kwargs)
