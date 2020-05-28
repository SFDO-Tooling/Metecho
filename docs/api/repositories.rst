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
          "repo_owner": "SFDO-Tooling",
          "repo_name": "test-repository",
          "description": "This is *safely* rendered Markdown.",
          "description_rendered": "<p>This is <em>safely</em> rendered Markdown.</p>",
          "is_managed": false,
          "slug": "test-repository",
          "old_slugs": [],
          "branch_prefix": "",
          "github_users": [
            {
              "id": "12345",
              "login": "username",
              "avatar_url": "https://avatars0.githubusercontent.com/u/someId?v=4"
            }
          ],
          "repo_image_url": "https://repository-images.githubusercontent.com/123456/123-456"
        }
        ...
      ]
    }

Refresh GitHub Users
--------------------

.. sourcecode:: http

   POST /api/repositories/:id/refresh_github_users/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED
