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
     "avatar_url": "https://avatars0.githubusercontent.com/u/123456?v=4",
     "github_id": "123456",
     "is_staff": false,
     "valid_token_for": "00Dxxxxxxxxxxxxxxx",
     "org_name": "OddBird",
     "org_type": "Developer Edition",
     "is_devhub_enabled": true,
     "devhub_username": "",
     "sf_username": "user@domain.com",
     "currently_fetching_repos": false,
     "uses_global_devhub": false,
     "agreed_to_tos_at": "2019-02-01T19:47:49Z",
     "onboarded_at": "2021-01-01T15:33:19Z",
     "self_guided_tour_enabled": true,
     "self_guided_tour_state": null,
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

   PUT /api/user/agree_to_tos/ HTTP/1.1

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
     "agreed_to_tos_at": "2019-02-01T19:47:49Z",
     "onboarded_at": "2021-01-01T15:33:19Z",
     "self_guided_tour_enabled": true,
     "self_guided_tour_state": null,
   }

The ``"agreed_to_tos_at"`` key should be updated to the time of the most
recent ``PUT`` to this endpoint.


Complete Onboarding
-------------------

Allows updating the date of the last time the user completed the interactive onboarding:

.. sourcecode:: http

   PUT /api/user/complete_onboarding/ HTTP/1.1

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
     "agreed_to_tos_at": "2019-02-01T19:47:49Z",
     "onboarded_at": "2021-01-01T15:33:19Z",
     "self_guided_tour_enabled": true,
     "self_guided_tour_state": null
   }

The ``"onboarded_at"`` key should be updated to the time of the most
recent ``PUT`` to this endpoint.



Self-guided Tour
----------------

Allows updating preferences related to the self-guided tour:

.. sourcecode:: http

   POST /api/user/guided-tour/ HTTP/1.1

   {
      "enabled": false,
      "state": ["a", "b", "c"],
   }

The ``"enabled"`` parameter turns the self-guided tour on/off for the current
user. The ``"state"`` parameter allows storing arbitrary data to persist the
progress the user has made on the tour.

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
     "agreed_to_tos_at": "2019-02-01T19:47:49Z",
     "onboarded_at": "2021-01-01T15:33:19Z",
     "self_guided_tour_enabled": false,
     "self_guided_tour_state": ["a", "b", "c"]
   }
