=============
GitHub Issues
=============

This allows list and retrieve of GitHub Issues.

Retrieve
--------

.. sourcecode:: http

   GET /api/issues/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

    [
      {
        "id": "mR5djgk",
        "number": 77,
        "title": "Leverage agile frameworks to provide a robust synopsis",
        "created_at": "2021-06-16T21:53:43Z",
        "html_url": "https://github.com/org/repo/issues/77",
        "project": "WxgAag1",
        "epic": {
          "id": "bVJYNgK",
          "name": "Demo Epic",
          "status": "In progress",
          "slug": "demo-epic"
        },
        "task": {
          "id": "9NgYl0E",
          "name": "Demo Task",
          "status": "In progress",
          "review_status": "",
          "slug": "demo-task",
          "epic_slug": "demo-epic-abc"
        }
      },
      ...
    ]
