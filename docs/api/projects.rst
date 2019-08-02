========
Projects
========

This allows list, retrieve, create, update, and delete of Projects.

Retrieve
--------

.. sourcecode:: http

   GET /api/projects/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

    {
      "count": 150,
      "next": "https://.../api/projects/?page=2",
      "previous": null,
      "results": [
        {
          "id": "3Lw7OwK",
          "name": "Test Project",
          "description": "<p>This is safely rendered Markdown.</p>",
          "slug": "test-project",
          "old_slugs": [],
          "product": "zVQYrye",
          "branch_url": "https://www.github.com/SFDO-Tooling/test-product/tree/test-project",
        }
        ...
      ]
    }
