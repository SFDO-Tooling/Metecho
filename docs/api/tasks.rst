=====
Tasks
=====

This allows list, retrieve, create, update, and delete of Tasks.

Retrieve
--------

.. sourcecode:: http

   GET /api/tasks/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

    [
      {
        "id": "M13MnQO",
        "name": "Test Task",
        "description": "<p>This is safely rendered Markdown.</p>",
        "project": "3Lw7OwK",
        "assignee": null,
        "slug": "test-task",
        "old_slugs": [],
        "has_unmerged_commits": true,
        "currently_creating_pr": false,
        "branch_url": "https://github.com/SFDO-Tooling/test-repository/tree/feature/test-project__test-task",
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
        ],
        "branch_diff_url": "https://github.com/SFDO-Tooling/test-repository/compare/feature/test-project...feature/test-project__test-task",
        "pr_url": "https://github.com/SFDO-Tooling/test-repository/pull/1357"
      }
      ...
    ]
