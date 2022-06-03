Development Setup
=================

Cloning the project
-------------------

::

    $ git clone git@github.com:SFDO-Tooling/Metecho
    $ cd Metecho

Docker-based development
------------------------

1. Install `Docker Desktop`_ and make sure it is running. Ensure you're running
   ``docker-compose`` at least version ``1.25.2`` to avoid container-abort bugs.
   The latest Docker Desktop should come with this version or later.

2. Create an ``.env`` file with the required environment variables::

    $ cp env.example .env

   Edit this file to change ``DJANGO_SECRET_KEY`` and ``DJANGO_HASHID_SALT`` to
   any two different arbitrary string values.

   Next, run the following commands to generate a database encryption key::

    $ pip install cryptography
    $ python
    >>> from cryptography.fernet import Fernet
    >>> Fernet.generate_key()

   This will output a bytestring, e.g. ``b'mystring='``. Copy only the contents
   of ``'...'``, and add it to your ``.env`` file as ``DB_ENCRYPTION_KEY``, e.g.
   ``DB_ENCRYPTION_KEY="mystring="``.

   To exit the Python shell, press ``Ctrl-Z`` and then ``Enter`` on Windows, or
   ``Ctrl-D`` on OS X or Linux. Alternatively, you could also type the Python
   command ``exit()`` and press ``Enter``.

   Finally, set the following environment variables (if you're an OddBird, you
   can find these values in the shared Keybase team folder --
   ``metecho/env``)::

    DOCKER_SFDX_HUB_KEY=...
    SFDX_CLIENT_ID=...
    SFDX_CLIENT_SECRET=...
    GITHUB_HOOK_SECRET=...
    GITHUB_CLIENT_ID=...
    GITHUB_CLIENT_SECRET=...
    GITHUB_APP_ID=...
    DOCKER_GITHUB_APP_KEY=...

   Note that none of the values should be quoted, and while
   ``DOCKER_SFDX_HUB_KEY`` and ``DOCKER_GITHUB_APP_KEY`` are RSA private keys,
   they must have newlines replaced with ``\n`` in order to work properly with
   the Docker ``env_file`` configuration option (see `this issue`_).

3. Run ``./derrick build`` to build/re-build all the container images.

4. Run ``./derrick up`` to start the server(s).

5. Visit `<http://localhost:8080/>`_ in your browser.

6. When you're done working on Metecho, ``Ctrl-C`` in the terminal where the
   containers are running to exit. You can also ``./derrick down`` to stop
   all running containers, or ``./derrick prune`` to clean up unused
   images/containers. (``docker-compose ps`` will tell you what containers are
   currently running.)

.. _Docker Desktop: https://www.docker.com/products/docker-desktop
.. _this issue: https://github.com/moby/moby/issues/12997

Setting up the GitHub App
-------------------------

To deploy this app, you will need to set up a GitHub App and give it proper
permissions. You can do that at
``https://github.com/organizations/<your_org>/settings/apps``

The GitHub app lets users log into Metecho with their GitHub account, connect to
repositories, create branches, pull requests, and commit code. The app will need
the following permissions:

- Repository permissions
    - Contents: Read & write
    - Metadata: Read-only
    - Pull requests: Read & write
    - Commit statuses: Read & write
    - Workflows: Read & write
- Organization permissions:
    - Members: Read-only
- User permissions:
    - Email addresses: Read-only
- Subscribe to events:
    - Pull request
    - Pull request review
    - Push

If you want to allow Metecho to create new repositories in your organization,
you must grant access to the app to all repositories, not a subset of them, and
enable these additional permissions:

- Repository permissions
    - Administration: Read & write
- Organization permissions
    - Members: Read & write

To enable logging in with GitHub, set the "User authorization callback URL" to
``https://<your-deployed-url>/accounts/github/login/callback/``, and be sure the
"Request user authorization (OAuth) during installation" box is checked.

To enable GitHub webhooks, set the "Webhook URL" to
``https://<your-deployed-url>/api/hook/``, and be sure the "Active" box is
checked and "SSL verification" is enabled.

Use the "Webhook secret" value as your ``GITHUB_HOOK_SECRET`` environment
variable in Metecho.

Use the app's "App ID" as ``GITHUB_APP_ID``, "Client ID" as
``GITHUB_CLIENT_ID``, and "Client secret" as ``GITHUB_CLIENT_SECRET``.

Finally, generate a new private key for the app, replace newlines with ``\n``,
and set it as the ``DOCKER_GITHUB_APP_KEY`` environment variable (the entire
key, not a path to one).

Logging in as a superuser
~~~~~~~~~~~~~~~~~~~~~~~~~

First log in using your GitHub account.

Then turn this user into a superuser using the ``promote_superuser`` command::

    $ docker-compose run --rm web python manage.py promote_superuser <username>

You will also need, when you log in, to make sure that the GitHub app
that provides Metecho with webhook updates and GitHub API access **is
enabled for any Organizations you are testing against**. By default it
will only install for the user you are logging in as.

GitHub Webhooks in Development
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To test GitHub webhooks in development, you will need to use the tool
`ngrok`_, which sets up a tunnel from the internet-at-large to your
computer. Run it like so::

   $ ngrok http --host-header=localhost:8080 8080

You will get output that indicates the name of the ngrok tunnel, which will look
like ``https://<some hash>.ngrok.io``. You will need to adjust the GitHub App to
point to the ``/api/hook/`` path of your ngrok tunnel (e.g.
``https://<some hash>.ngrok.io/api/hook/``). This means that it's a
one-person-at-a-time thing, which is a problem for which we don't yet have
a solution.

As an OddBird, you can access the app at
`<https://github.com/organizations/oddbird/settings/apps/metecho-local-dev>`_.

.. _ngrok: https://ngrok.com/

Setting up the database
-----------------------

If your database has outdated sample data for development, remove it with::

    $ ./derrick truncate

To populate the database with sample data for development, run::

    $ ./derrick truncate
    $ ./derrick populate

To allow automated emails to send with correct links, you'll need to set up the
default ``Site`` object in the Django admin. Assuming you've already set your
user up as a superuser, go to
`<http://localhost:8080/admin/sites/site/1/change/>`_ and set the "Domain name"
field appropriately (to ``localhost:8080``). If you are setting up a deployed
production or staging instance, set this value to the domain from which you are
serving that instance.

Docker development tasks
------------------------

Most tasks are defined in ``derrick``; take a look in there and you
will see you can run e.g.::

    $ ./derrick up  # start containers and servers
    $ ./derrick down  # shut down running containers
    $ ./derrick build  # rebuild all containers
    $ ./derrick lint  # format and lint JS, Sass, Python, etc
    $ ./derrick test  # run JS and Python tests
    $ ./derrick test:py  # run Python tests
    $ ./derrick test:js  # run JS tests
    $ ./derrick test:js:watch  # run JS tests and watches for changes
    $ ./derrick add:js <package>  # add a yarn/npm package to dependencies
    $ ./derrick lock:py  # update requirements *.txt from *.in files
    $ ./derrick migrate <app> <prefix>  # run Django migrations
    $ ./derrick migrations <app>  # add new Django migrations (``makemigrations``)
    $ ./derrick messages <locale>  # build messages for i18n
    $ ./derrick schema  # generate OpenAPI schema file
    $ ./derrick shell  # open Python shell
    $ ./derrick prune  # clean up unused Docker images and containers
    $ ./derrick storybook  # build storybook and run dev server

To run any development tasks (such as changing Python or JS dependencies, or
generating or running migrations, or running a Django shell), you will need to
run them inside the Docker image. This takes the general form ``docker-compose
run --no-deps web [command]``. In some cases, such as for migrations or a Django
shell, you will want to omit the ``--no-deps`` flag.

You shouldn't need to run any other setup tasks; the Docker images will take
care of setting up a database and installing Python and JS dependencies for you.

When you change Python or JS dependencies, you will need to rebuild the Docker
images, as we store dependencies in the images for speed: ``./derrick
build``.

Docker caches each command in the `Dockerfile <Dockerfile>`_ as its own layer.
If you change the Dockerfile, changing earlier layers will bust the cache on the
lower layers and make your next build slow again.

Docker development using VS Code
--------------------------------

Because front-end and back-end dependencies are installed in a Docker container
instead of locally, text editors that rely on locally-installed packages (e.g.
for code formatting/linting on save) need access to the running Docker
container. `VS Code`_ supports this using the `Remote Development`_ extension
pack.

Once you have the extension pack installed, when you open the Metecho folder
in VS Code, you will be prompted to ``Reopen in Container``. Doing so will
effectively run ``docker-compose up`` and reload your window, now running inside
the Docker container. If you do not see the prompt, run the "Remote-Containers:
Open Folder in Container..." command from the VS Code Command Palette to start
the Docker container.

A number of project-specific VS Code extensions will be automatically installed
for you within the Docker container. See `.devcontainer/devcontainer.json
<.devcontainer/devcontainer.json>`_ and `.devcontainer/docker-compose.dev.yml
<.devcontainer/docker-compose.dev.yml>`_ for Docker-specific VS Code settings.

The first build will take a number of minutes, but subsequent builds will be
significantly faster.

In contrast to ``docker-compose up``, VS Code does not automatically run
database migrations or start the development server/watcher. To do so, open an
`integrated terminal`_ in VS Code (``Ctrl-```) and use any of the development
commands (this terminal runs inside the Docker container)::

    $ python manage.py migrate  # run database migrations
    $ yarn serve  # start the development server/watcher

For any commands, when using the VS Code integrated terminal inside the
Docker container, omit any ``docker-compose run --rm web...`` prefix, e.g.::

    $ python manage.py promote_superuser <username>
    $ yarn test:js
    $ python manage.py truncate_data
    $ python manage.py populate_data

After running ``yarn serve``, view the running app at
`<http://localhost:8080/>`_ in your browser.

For more detailed instructions and options, see the `VS Code documentation`_.

.. _VS Code: https://code.visualstudio.com/
.. _Remote Development: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack
.. _integrated terminal: https://code.visualstudio.com/docs/editor/integrated-terminal
.. _VS Code documentation: https://code.visualstudio.com/docs/remote/containers

Internationalization
--------------------

To build and compile ``.mo`` and ``.po`` files for the back end, run::

   $ ./derrick messages <locale>

For the front end, translation JSON files are served from
``locales/<language>/`` directories, and the `user language is auto-detected at
runtime`_.

During development, strings are parsed automatically from the JS, and an English
translation file is auto-generated to ``locales_dev/en/translation.json`` on
every build. When this file changes, translations must be copied over to the
``locales/en/translation.json`` file in order to have any effect.

Strings with dynamic content (i.e. known only at runtime) cannot be
automatically parsed, but will log errors while the app is running if they're
missing from the served translation files. To resolve, add the missing key:value
translations to ``locales/<language>/translation.json``.

This applies to the server code too, except no error will be raised. Therefore,
you should use string literals everywhere in server-side code that might be
exposed to the front end, to properly generate translation files. See error
message handling in ``metecho/api/sf_run_flow.py`` for an example.

.. _user language is auto-detected at runtime: https://github.com/i18next/i18next-browser-languageDetector

Storybook Development Workflow
------------------------------

When doing development for the component library in Storybook,
use one of these two commands::

    $ ./derrick storybook  # if running outside of container
    $ yarn storybook  # if working in a remote container in VS Code

After running one of these commands, you can view the Storybook at
`<http://localhost:6006/>`_ in your browser.
