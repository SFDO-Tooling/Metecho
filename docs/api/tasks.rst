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
        "slug": "test-task",
        "old_slugs": [],
        "project": "3Lw7OwK",
        "branch_url": "https://github.com/SFDO-Tooling/test-repository/tree/feature/test-project__test-task",
        "assignee": null,
        "has_unmerged_commits": true,
        "currently_creating_pr": false,
        "branch_diff_url": "https://github.com/SFDO-Tooling/test-repository/compare/feature/test-project...feature/test-project__test-task",
        "pr_url": "https://github.com/SFDO-Tooling/test-repository/pull/1357"
      }
      ...
    ]
