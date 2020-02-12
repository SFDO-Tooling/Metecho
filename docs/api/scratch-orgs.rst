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
        "task": "M13MnQO",
        "org_type": "Dev",
        "owner": "3Lw7OwK",
        "last_modified_at": "2019-01-01T17:22:50Z",
        "expires_at": "2019-01-08T17:21:37Z",
        "latest_commit": "617a512",
        "latest_commit_url": "https://github.com/SFDO-Tooling/test-repository/commit/617a512",
        "latest_commit_at": "2019-02-01T19:47:49Z",
        "url": "https://sample-org-url.my.salesforce.com/",
        "unsaved_changes": {},
        "has_unsaved_changes": false,
        "currently_refreshing_changes": false,
        "currently_capturing_changes": false,
        "currently_refreshing_org": false,
        "delete_queued_at": null,
        "owner_sf_username": "user@domain.com",
        "owner_gh_username": "user123"
      }
      ...
    ]
