====
User
====

This is a degenerate endpoint that just shows some details of the current user.

Retrieve
--------

.. sourcecode:: http

   GET /api/user/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "3Lw7OwK",
     "username": "user123",
     "email": "user@domain.com",
     "is_staff": false,
     "valid_token_for": "00Dxxxxxxxxxxxxxxx",
     "org_name": "OddBird",
     "org_type": "Developer Edition",
     "is_devhub_enabled": true,
     "devhub_username": "",
     "sf_username": "user@domain.com",
     "currently_fetching_repos": false,
     "uses_global_devhub": false,
     "agreed_to_tos_at": "2019-02-01T19:47:49Z"
   }

Refresh
-------

.. sourcecode:: http

   POST /api/user/refresh/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED

Disconnect
----------

.. sourcecode:: http

   POST /api/user/disconnect/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

Agree to TOS
------------

This is related to the user, but not part of it:

.. sourcecode:: http

   PUT /api/agree_to_tos/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "3Lw7OwK",
     "username": "user123",
     "email": "user@domain.com",
     "is_staff": false,
     "valid_token_for": "00Dxxxxxxxxxxxxxxx",
     "org_name": "OddBird",
     "org_type": "Developer Edition",
     "is_devhub_enabled": true,
     "devhub_username": "",
     "sf_username": "user@domain.com",
     "currently_fetching_repos": false,
     "uses_global_devhub": false,
     "agreed_to_tos_at": "2019-02-01T19:47:49Z"
   }

The ``"agreed_to_tos_at"`` key should be updated to the time of the most
recent ``PUT`` to this endpoint.
