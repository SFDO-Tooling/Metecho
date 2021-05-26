============
Scratch Orgs
============

This allows list, retrieve, create, update, and delete of Scratch Orgs.

Retrieve
--------

.. sourcecode:: http

   GET /api/scratch-orgs/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

    [
      {
        "id": "n1057Rw",
        "project": null,
        "epic": null",
        "task": "M13MnQO",
        "description": "This is *safely* rendered Markdown.",
        "description_rendered": "<p>This is <em>safely</em> rendered Markdown.</p>",
        "org_type": "Dev",
        "owner": "3Lw7OwK",
        "last_modified_at": "2019-01-01T17:22:50Z",
        "expires_at": "2019-01-08T17:21:37Z",
        "last_checked_unsaved_changes_at": "2019-01-03T17:21:37Z",
        "latest_commit": "617a512",
        "latest_commit_url": "https://github.com/SFDO-Tooling/test-project/commit/617a512",
        "latest_commit_at": "2019-02-01T19:47:49Z",
        "url": "https://sample-org-url.my.salesforce.com/",
        "unsaved_changes": {},
        "has_unsaved_changes": false,
        "total_unsaved_changes": 0,
        "ignored_changes": {},
        "has_ignored_changes": false,
        "total_ignored_changes": 0,
        "currently_refreshing_changes": false,
        "currently_capturing_changes": false,
        "currently_refreshing_org": false,
        "currently_reassigning_user": false,
        "is_created": true,
        "delete_queued_at": null,
        "owner_gh_username": "user123",
        "owner_gh_id": "123456",
        "has_been_visited": true,
        "valid_target_directories": {
          "source": ["src"]
        },
        "org_config_name": "dev"
      }
      ...
    ]

Commit
------

.. sourcecode:: http

   POST /api/scratch-orgs/:id/commit/ HTTP/1.1

   {
     "commit_message": "This is a sample message.",
     "changes": {
       "MemberType": ["MemberName1", "MemberName2"]
     }
   }

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED

Redirect
--------

.. sourcecode:: http

   GET /api/scratch-orgs/:id/redirect/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 302 FOUND

Refresh
-------

.. sourcecode:: http

   POST /api/scratch-orgs/:id/refresh/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED
