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
          "repository": "zVQYrye",
          "branch_url": "https://github.com/SFDO-Tooling/test-repository/tree/feature/test-project",
          "commits": [
            {
              "id": "617a512",
              "timestamp": "2019-02-01T19:47:49Z",
              "author": {
                "name": "Full Name",
                "username": "username",
                "email": "user@example.com",
                "avatar_url": "https://avatars0.githubusercontent.com/u/someId?v=4"
              },
              "message": "Some commit message",
              "url": "https://github.com/SFDO-Tooling/commit/617a512"
            },
            ...
          ]
        }
        ...
      ]
    }
