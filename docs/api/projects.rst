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
          "slug": "test-project",
          "old_slugs": [],
          "pr_url": "https://github.com/sfdo/test-project",
          "description": "<p>This is safely rendered Markdown.</p>",
          "commit_message": "<p>This is safely rendered Markdown.</p>",
          "release_notes": "<p>This is safely rendered Markdown.</p>",
        }
        ...
      ]
    }
