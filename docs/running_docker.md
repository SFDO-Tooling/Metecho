# Docker Development Setup

## Cloning the project

    $ git clone git@github.com:SFDO-Tooling/Metecho
    $ cd Metecho

## Docker-based development

1.  Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and
    make sure it is running. Ensure you're running `docker-compose` at least
    version `1.25.2` to avoid container-abort bugs. The latest Docker Desktop
    should come with this version or later.

2.  Create an `.env` file with the required environment variables:

        $ cp env.example .env

    Edit this file to change `DJANGO_SECRET_KEY` and `DJANGO_HASHID_SALT` to any
    two different arbitrary string values.

    Next, run the following commands to generate a database encryption key:

        $ pip install cryptography
        $ python
        >>> from cryptography.fernet import Fernet
        >>> Fernet.generate_key()

    This will output a bytestring, e.g. `b'mystring='`. Copy only the contents
    of `'...'`, and add it to your `.env` file as `DB_ENCRYPTION_KEY`, e.g.
    `DB_ENCRYPTION_KEY="mystring="`.

    To exit the Python shell, press `Ctrl-Z` and then `Enter` on Windows, or
    `Ctrl-D` on OS X or Linux. Alternatively, you could also type the Python
    command `exit()` and press `Enter`.

    Finally, set the following environment variables:

        DOCKER_SFDX_HUB_KEY=...
        SFDX_CLIENT_ID=...
        SFDX_CLIENT_SECRET=...
        GITHUB_HOOK_SECRET=...
        GITHUB_CLIENT_ID=...
        GITHUB_CLIENT_SECRET=...
        GITHUB_APP_ID=...
        DOCKER_GITHUB_APP_KEY=...

    Note that none of the values should be quoted, and while
    `DOCKER_SFDX_HUB_KEY` and `DOCKER_GITHUB_APP_KEY` are RSA private keys, they
    must have newlines replaced with `\n` in order to work properly with the
    Docker `env_file` configuration option (see
    [this issue](https://github.com/moby/moby/issues/12997)).

3.  Run `./derrick build` to build/re-build all the container images.

4.  Run `./derrick up` to start the server(s).

5.  Visit <http://localhost:8080/> in your browser.

6.  When you're done working on Metecho, `Ctrl-C` in the terminal where the
    containers are running to exit. You can also `./derrick down` to stop all
    running containers, or `./derrick prune` to clean up unused
    images/containers. (`docker-compose ps` will tell you what containers are
    currently running.)

## Setting up the database

If your database has outdated sample data for development, remove it with:

    $ ./derrick truncate

To populate the database with sample data for development, run:

    $ ./derrick truncate
    $ ./derrick populate

## Docker development tasks

Most tasks are defined in `derrick`; take a look in there and you will see you
can run e.g.:

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

## Docker development using VS Code

Because front-end and back-end dependencies are installed in a Docker container
instead of locally, text editors that rely on locally-installed packages (e.g.
for code formatting/linting on save) need access to the running Docker
container. [VS Code](https://code.visualstudio.com/) supports this using the
[Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)
extension pack.

Once you have the extension pack installed, when you open the Metecho folder in
VS Code, you will be prompted to `Reopen in Container`. Doing so will
effectively run `docker-compose up` and reload your window, now running inside
the Docker container. If you do not see the prompt, run the "Remote-Containers:
Open Folder in Container\..." command from the VS Code Command Palette to start
the Docker container.

A number of project-specific VS Code extensions will be automatically installed
for you within the Docker container. See
[.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) and
[.devcontainer/docker-compose.dev.yml](.devcontainer/docker-compose.dev.yml) for
Docker-specific VS Code settings.

The first build will take a number of minutes, but subsequent builds will be
significantly faster.

In contrast to `docker-compose up`, VS Code does not automatically run database
migrations or start the development server/watcher. To do so, open an
[integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal)
in VS Code (`Ctrl-`\`) and use any of the development commands (this terminal
runs inside the Docker container):

    $ python manage.py migrate  # run database migrations
    $ yarn serve  # start the development server/watcher

For any commands, when using the VS Code integrated terminal inside the Docker
container, omit any `docker-compose run --rm web...` prefix, e.g.:

    $ python manage.py promote_superuser <username>
    $ yarn test:js
    $ python manage.py truncate_data
    $ python manage.py populate_data

After running `yarn serve`, view the running app at <http://localhost:8080/> in
your browser.

For more detailed instructions and options, see the
[VS Code documentation](https://code.visualstudio.com/docs/remote/containers).
