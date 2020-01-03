============
Repositories
============

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
          "id": "zVQYrye",
          "name": "Test Repository",
          "repo_url": "https://github.com/SFDO-Tooling/test-repository",
          "description": "<p>This is safely rendered Markdown.</p>",
          "is_managed": false,
          "slug": "test-repository",
          "old_slugs": [],
          "github_users": [
            {
              "id": "12345",
              "login": "username",
              "avatar_url": "https://avatars0.githubusercontent.com/u/someId?v=4"
            }
          ]
        }
        ...
      ]
    }
