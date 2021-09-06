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
        }
        ...
      ]
    }

Organizations for Current User
------------------------------

This will queue a job to filter the local GitHubOrganizations down to those that the user is a member of.

.. sourcecode:: http

   POST /api/organizations/for_user/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED

Members
-------

This will queue a job to get the organization's members using the GitHub API.
Only members visible to the current user will be returned.

.. sourcecode:: http

   POST /api/organizations/:id/members/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED


Check Repository Name
---------------------

This will queue a job to verify a name's availability among the Organization's repositories.

.. sourcecode:: http

   POST /api/organizations/:id/check_repo_name/ HTTP/1.1

   {
     "name": "name-to-test"
   }

.. sourcecode:: http

   HTTP/1.1 202 ACCEPTED
