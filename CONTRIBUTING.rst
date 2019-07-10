Development Setup
=================

Cloning the project
-------------------

::

    $ git clone git@github.com:SFDO-Tooling/MetaShare
    $ cd MetaShare

Docker-based development
------------------------

1. Install `Docker Desktop (Community Edition)`_ and make sure it is running.

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
   ``metashare/env``)::

    BUCKETEER_AWS_ACCESS_KEY_ID=...
    BUCKETEER_AWS_SECRET_ACCESS_KEY=...
    BUCKETEER_BUCKET_NAME=...

3. Run ``make build`` to build/re-build all the container images.

4. Run ``make up`` to start the server(s).

5. Visit `<http://localhost:8080/>`_ in your browser.

6. When you're done working on MetaShare, ``Ctrl-C`` in the terminal where the
   containers are running to exit. You can also ``make down`` to stop all
   running containers, or ``make prune`` to clean up unused images/containers.
   (``docker-compose ps`` will tell you what containers are currently running.)

.. _Docker Desktop (Community Edition): https://www.docker.com/products/docker-desktop

Setting up the database
-----------------------

To populate the database with sample data for development, run::

    $ make populate

If your database has outdated sample data for development, remove it with::

    $ make truncate

Docker development tasks
~~~~~~~~~~~~~~~~~~~~~~~~

Most tasks are defined in the `Makefile <Makefile>`_; take a look in there and
you will see you can run e.g.::

    $ make up  # start containers and servers
    $ make down  # shut down running containers
    $ make build  # rebuild all containers
    $ make lint  # format and lint JS, Sass, Python
    $ make test  # run JS and Python tests
    $ make migrate  # run Django migrations
    $ make migrations  # add new Django migrations (``makemigrations``)
    $ make shell  # open Python shell
    $ make prune  # clean up unused Docker images and containers

To run any development tasks (such as changing Python or JS dependencies, or
generating or running migrations, or running a Django shell), you will need to
run them inside the Docker image. This takes the general form ``docker-compose
run --no-deps web [command]``. In some cases, such as for migrations or a Django
shell, you will want to omit the ``--no-deps`` flag.

You shouldn't need to run any other setup tasks; the Docker images will take
care of setting up a database and installing Python and JS dependencies for you.

When you change Python or JS dependencies, you will need to rebuild the Docker
images, as we store dependencies in the images for speed: ``make build``.

Docker caches each command in the `Dockerfile <Dockerfile>`_ as its own layer.
If you change the Dockerfile, changing earlier layers will bust the cache on the
lower layers and make your next build slow again.

Docker development using VS Code
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Because front-end and back-end dependencies are installed in a Docker container
instead of locally, text editors that rely on locally-installed packages (e.g.
for code formatting/linting on save) need access to the running Docker
container. `VS Code`_ supports this using the `Remote Development`_ extension
pack.

Once you have the extension pack installed, when you open the MetaShare folder
in VS Code, you will be prompted to "Reopen in Container". Doing so will
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

    $ python manage.py promote_superuser <your email>
    $ yarn test

After running ``yarn serve``, view the running app at
`<http://localhost:8080/>`_ in your browser.

To view logs from other Docker containers (e.g. redis or postgres), run the
"Docker Containers: View Logs" command from the VS Code Command Palette and
select the desired container.

For more detailed instructions and options, see the `VS Code documentation`_.

.. _VS Code: https://code.visualstudio.com/
.. _Remote Development: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack
.. _integrated terminal: https://code.visualstudio.com/docs/editor/integrated-terminal
.. _VS Code documentation: https://code.visualstudio.com/docs/remote/containers

Logging in with GitHub
----------------------

To setup the GitHub OAuth integration, run the ``populate_social_apps``
management command. The values to use in place of the ``XXX`` and ``YYY`` flags
can be found in the GitHub App, or if you're an OddBird you can find these
values in the shared Keybase team folder (``metashare/prod.db``)::

    $ docker-compose run --rm web python manage.py populate_social_apps --gh-id XXX --gh-secret YYY

Once you've done that and successfully logged in, you probably want to make your
user a superuser. You can do that easily via the ``promote_superuser``
management command::

    $ docker-compose run --rm web python manage.py promote_superuser <your email>

Internationalization
--------------------

To build and compile ``.mo`` and ``.po`` files for the back end, run::

   $ docker-compose run --rm web python manage.py makemessages --locale <locale>
   $ docker-compose run --rm web python manage.py compilemessages

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

.. _GNU gettext toolset: https://www.gnu.org/software/gettext/
.. _user language is auto-detected at runtime: https://github.com/i18next/i18next-browser-languageDetector
