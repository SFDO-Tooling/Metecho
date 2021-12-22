from metecho.redis import SSLConnectionPool


def test_pool():
    pool = SSLConnectionPool()
    assert not pool.connection_kwargs["ssl_cert_reqs"]
