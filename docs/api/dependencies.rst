====================
Project Dependencies
====================

This allows list and retrieve of Dependencies used when creating Projects.

List
----

.. sourcecode:: http

   GET /api/dependencies/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

    {
      "count": 150,
      "next": "https://.../api/dependencies/?page=2",
      "previous": null,
      "results": [
        {
          "id": "wm0zn08",
          "name": "Example Dependency",
          "recommended": true
        }
        ...
      ]
    }
