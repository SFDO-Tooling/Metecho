Development Setup
=================

Cloning the project
-------------------

::

    $ git clone git@github.com:SFDO-Tooling/MetaShare
    $ cd MetaShare

Docker-based development (preferred)
------------------------------------

1. Install `Docker Desktop (Community Edition)`_ and make sure it is running.

2. Create an ``.env`` file with the required environment variables::

    $ cp env.example .env

   Edit this file to change ``DJANGO_SECRET_KEY`` and ``DJANGO_HASHID_SALT`` to
   any two different arbitrary string values. Also set ``DB_ENCRYPTION_KEY``::

    $ python
    >>> from cryptography.fernet import Fernet
    >>> Fernet.generate_key()

   This will output a bytestring, e.g. ``b'mystring='``. Copy only the contents
   of ``'...'``, e.g. ``DB_ENCRYPTION_KEY="mystring="``.

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

Logging in with Salesforce
--------------------------

To setup the Salesforce OAuth integration, run the ``populate_social_apps``
management command. The values to use in place of the ``XXX`` and ``YYY`` flags
can be found on the Connected App you've made in your Salesforce configuration,
or if you're an OddBird, you can find these values in the shared Keybase team
folder (``metashare/prod.db``)::

    $ docker-compose run web python manage.py populate_social_apps --prod-id XXX --prod-secret YYY

You can also run it with ``--test-id`` and ``--test-secret``, or ``--cust-id``
and ``--cust-secret``, or all three sets at once, to populate all three
providers.

Once you've logged in, you probably want to make your user a superuser. You can
do that easily via the ``promote_superuser`` management command::

    $ docker-compose run web python manage.py promote_superuser <your email>

Internationalization
--------------------

To build and compile ``.mo`` and ``.po`` files for the backend, run::

   $ docker-compose run web python manage.py makemessages --locale <locale>
   $ docker-compose run web python manage.py compilemessages

For the front-end, translation JSON files are served from
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
