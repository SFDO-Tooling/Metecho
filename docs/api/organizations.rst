=============
Organizations
=============

This allows list and retrieve of GitHub Organizations.

Retrieve
--------

.. sourcecode:: http

   GET /api/organizations/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

    {
      "count": 150,
      "next": "https://.../api/organizations/?page=2",
      "previous": null,
      "results": [
        {
          "id": "wm0zn08",
          "name": "Example Org",
          "avatar_url": "https://avatars.githubusercontent.com/u/780830?v=4",
          "members": [
              {
                  "id": "61586",
                  "login": "user1",
                  "avatar_url": "https://avatars.githubusercontent.com/u/61586?v=4"
              },
              {
                  "id": "41588129",
                  "login": "user2",
                  "avatar_url": "https://avatars.githubusercontent.com/u/41588129?v=4"
              }
          ],
          "currently_refreshing": false
        }
        ...
      ]
    }

Refresh from GitHub
-------------------

This will queue a job to refresh the organization's information using the GitHub API.

.. sourcecode:: http

   POST /api/organizations/:id/refresh/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED
