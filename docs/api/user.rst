====
User
====

This is a degenerate endpoint that just shows some details of the
current user.

Retrieve
--------

.. sourcecode:: http

   GET /api/user/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "3Lw7OwK",
     "username": "user@domain.com",
     "email": "user@domain.com",
     "valid_token_for": "00Dxxxxxxxxxxxxxxx",
     "org_name": "My SF Org",
     "org_type": "Developer Edition",
     "is_staff": true
   }
