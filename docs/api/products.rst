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

    {
      "count": 150,
      "next": "https://.../api/products/?page=2",
      "previous": null,
      "results": [
        {
          "id": "3Lw7OwK",
          "name": "Test Product",
          "repo_url": "https://github.com/sfdo/test-product",
          "description": "<p>This is safely rendered markdown</p>",
          "is_managed": false,
        }
        ...
      ]
    }
