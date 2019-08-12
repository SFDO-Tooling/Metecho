========
Repositories
========

This allows list, retrieve, create, update, and delete of Repositories.

Retrieve
--------

.. sourcecode:: http

   GET /api/repositories/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

    {
      "count": 150,
      "next": "https://.../api/repositories/?page=2",
      "previous": null,
      "results": [
        {
          "id": "3Lw7OwK",
          "name": "Test Repository",
          "slug": "test-repository",
          "old_slugs": [],
          "repo_url": "https://github.com/sfdo/test-repository",
          "description": "<p>This is safely rendered Markdown.</p>",
          "is_managed": false,
        }
        ...
      ]
    }
