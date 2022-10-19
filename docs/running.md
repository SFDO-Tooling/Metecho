# Local Machine Development Setup

## Cloning the project

    $ git clone git@github.com:SFDO-Tooling/Metecho
    $ cd Metecho

## Making A Virtual Env

Metecho development requires Python v3.10. If `which python3.10` returns a
non-empty path, it's already installed and you can continue to the next step. If
it returns nothing, then install Python v3.10 using `brew install python`, or
from [Python.org](https://www.python.org/downloads/).

Assuming you're in the repo root, do the following to create a virtualenv (once
you have
[virtualenvwrapper](https://virtualenvwrapper.readthedocs.io/en/latest/)
installed locally):

    mkvirtualenv metecho --python=$(which python3.10)
    setvirtualenvproject

Install Python requirements:

    pip install -r requirements/dev.txt
    pip install -r requirements/prod.txt

Create an `.env` file with the required environment variables:

    cp env.example .env

Edit this file to change `DJANGO_SECRET_KEY` and `DJANGO_HASHID_SALT` to any two
different arbitrary string values.

Next, run the following commands to generate a database encryption key:

    python
    >>> from cryptography.fernet import Fernet
    >>> Fernet.generate_key()

This will output a bytestring, e.g. `b'mystring='`. Copy only the contents of
`'...'`, and add it to your `.env` file as `DB_ENCRYPTION_KEY`, e.g.
`DB_ENCRYPTION_KEY="mystring="`.

To exit the Python shell, press `Ctrl-Z` and then `Enter` on Windows, or
`Ctrl-D` on OS X or Linux. Alternatively, you could also type the Python command
`exit()` and press `Enter`.

Finally, set the following environment variables:

    SFDX_HUB_KEY=...
    SFDX_CLIENT_ID=...
    SFDX_CLIENT_SECRET=...
    GITHUB_HOOK_SECRET=...
    GITHUB_CLIENT_ID=...
    GITHUB_CLIENT_SECRET=...
    GITHUB_APP_ID=...
    GITHUB_APP_KEY=...

Note that none of the values should be quoted, and the variables prefixed with
`DOCKER_` can be removed.

**All of the remaining steps assume that you have the virtualenv activated.**
(`workon metecho`)

## Installing JavaScript Requirements()

The project uses [nvm](https://github.com/nvm-sh/nvm) to install a specific
version of [Node.js](http://nodejs.org). Assuming you have `nvm` already
installed and configured, run `nvm install` to install and activate the Node
version specified in `.nvmrc`. Then use [yarn](https://yarnpkg.com/) to install
dependencies:

    nvm use
    yarn

**All of the remaining steps assume that you have the nvm activated.**
(`nvm use`)

## Setting Up The Database

Assuming you have [Postgres](https://www.postgresql.org/download/) installed and
running locally:

    createdb metecho

Then run the initial migrations:

    python manage.py migrate

If your database has outdated sample data for development, remove it with:

    python manage.py truncate_data

To populate the database with sample data for development, run:

    python manage.py populate_data

## Running The Server

The local development server requires [Redis](https://redis.io/) to manage
background worker tasks. If you can successfully run `redis-cli ping` and see
output `PONG`, then you have Redis installed and running. Otherwise, run
`brew install redis` (followed by `brew services start redis`) or refer to the
[Redis Quick Start](https://redis.io/topics/quickstart).

To run the local development server:

    yarn serve

This starts a process running Django, a process running Node, and an `rq` worker
process. The running server will be available at <http://localhost:8080/>.

Recent versions of macOS have added security to restrict multithreading by
default. If running on macOS High Sierra or later, you might need to set
`OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES` via an additional environment
variable.

## Development Tasks

- `yarn serve`: starts development server (with watcher) at
  <http://localhost:8080/> (assets are served from `dist/` dir)
- `yarn test`: run all tests
- `yarn test:py`: run Python tests
- `yarn test:js`: run JS tests
- `yarn test:js:watch`: run JS tests with a watcher for development
- `yarn lint`: formats and lints all files
- `yarn lint:js`: formats, lints, and type-checks `.js` files
- `yarn lint:sass`: formats and lints `.scss` files
- `yarn lint:py`: formats and lints `.py` files
- `yarn prettier:js`: formats `.js` files
- `yarn lint:other`: formats `.json`, `.md`, and `.yml` files
- `yarn tsc`: runs JS type-checking
- `yarn build`: builds development (unminified) static assets into `dist/` dir
- `yarn prod`: builds production (minified) static assets into `dist/prod/` dir
- `yarn storybook`: build storybook and run dev server
