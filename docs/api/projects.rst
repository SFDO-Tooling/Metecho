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
          "description": "This is *safely* rendered Markdown.",
          "description_rendered": "<p>This is <em>safely</em> rendered Markdown.</p>",
          "slug": "test-project",
          "old_slugs": [],
          "repository": "zVQYrye",
          "branch_name": "feature/test-project",
          "branch_url": "https://github.com/SFDO-Tooling/test-repository/tree/feature/test-project",
          "branch_diff_url": "https://github.com/SFDO-Tooling/test-repository/compare/main...feature/test-project",
          "has_unmerged_commits": true,
          "currently_creating_pr": false,
          "currently_fetching_org_config_names": false,
          "pr_url": "https://github.com/SFDO-Tooling/test-repository/pull/1357",
          "pr_is_open": true,
          "pr_is_merged": false,
          "github_users": [
            {
              "id": "12345",
              "login": "username",
              "avatar_url": "https://avatars0.githubusercontent.com/u/someId?v=4"
            }
          ],
          "status": "In progress",
          "available_task_org_config_names": [
            {
              "key": "dev",
              "label": "Dev Org",
              "description": "Org set up for package development"
            },
            {
              "key": "qa"
            }
          ]
        }
        ...
      ]
    }
