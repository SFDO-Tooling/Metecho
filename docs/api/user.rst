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
     "is_staff": true
   }
