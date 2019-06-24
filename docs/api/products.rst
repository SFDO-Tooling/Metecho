========
Products
========

This allows list, retrieve, create, update, and delete of Products.

Retrieve
--------

.. sourcecode:: http

   GET /api/products/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   [
      {
        "id": "3Lw7OwK",
        "name": "Test Product",
        "repo_name": "test-product",
        "version_number": "v0.1.0",
        "description": "<p>This is safely rendered markdown</p>",
        "is_managed": false,
        "license": ["mit"],
      }
   ]
