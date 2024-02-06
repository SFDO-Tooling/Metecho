# Development Setup

## Using Docker

To set up Metecho using Docker please see the following instructions:
[./docs/running_docker.md](./docs/running_docker.md).

## Using Local Machine

Metecho can also be configured to run locally without Docker. To achieve this
follow the instructions provided in [./docs/running.md](./docs/running.md).

## Setting up the GitHub App

To deploy this app, you will need to set up a GitHub App and give it proper
permissions. You can do that at
`https://github.com/organizations/<your_org>/settings/apps`

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
`https://<your-deployed-url>/accounts/github/login/callback/`, and be sure the
"Request user authorization (OAuth) during installation" box is checked.

To enable GitHub webhooks, set the "Webhook URL" to
`https://<your-deployed-url>/api/hook/`, and be sure the "Active" box is checked
and "SSL verification" is enabled.

Use the "Webhook secret" value as your `GITHUB_HOOK_SECRET` environment variable
in Metecho.

Use the app's "App ID" as `GITHUB_APP_ID`, "Client ID" as `GITHUB_CLIENT_ID`,
and "Client secret" as `GITHUB_CLIENT_SECRET`. These are stored in a shared
lastpass note.

Finally, generate a new private key for the app and set it as the
`GITHUB_APP_KEY` environment variable (the entire key, not a path to one). If
developing with Docker, replace newlines with `\n` and set it as the
`DOCKER_GITHUB_APP_KEY` environment variable instead.

### Logging in as a superuser

First log in using your GitHub account.

Then turn this user into a superuser using the `promote_superuser` command:

    $ python manage.py promote_superuser <username>

Or, if using Docker-based development:

    $ docker-compose run --rm web python manage.py promote_superuser <username>

You will also need, when you log in, to make sure that the GitHub app that
provides Metecho with webhook updates and GitHub API access **is enabled for any
Organizations you are testing against**. By default it will only install for the
user you are logging in as.

### GitHub Webhooks in Development

To test GitHub webhooks in development, you will need to use the tool
[ngrok](https://ngrok.com/), which sets up a tunnel from the internet-at-large
to your computer. Run it like so:

    $ ngrok http --host-header=localhost:8080 8080

You will get output that indicates the name of the ngrok tunnel, which will look
like `https://<some hash>.ngrok.io`. You will need to adjust the GitHub App to
point to the `/api/hook/` path of your ngrok tunnel (e.g.
`https://<some hash>.ngrok.io/api/hook/`). This means that it's a
one-person-at-a-time thing, which is a problem for which we don't yet have a
solution.

## Setting up email links

To allow automated emails to send with correct links, you'll need to set up the
default `Site` object in the Django admin. Assuming you've already set your user
up as a superuser, go to <http://localhost:8080/admin/sites/site/1/change/> and
set the "Domain name" field appropriately (to `localhost:8080`). If you are
setting up a deployed production or staging instance, set this value to the
domain from which you are serving that instance.

## Internationalization

To build and compile `.mo` and `.po` files for the back end, run:

    $ python manage.py makemessages --locale <locale>
    $ python manage.py compilemessages

Or, if using Docker-based development:

    $ ./derrick messages <locale>

For the front end, translation JSON files are served from `locales/<language>/`
directories, and the
[user language is auto-detected at runtime](https://github.com/i18next/i18next-browser-languageDetector).

During development, strings are parsed automatically from the JS, and an English
translation file is auto-generated to `locales_dev/en/translation.json` on every
build. When this file changes, translations must be copied over to the
`locales/en/translation.json` file in order to have any effect.

Strings with dynamic content (i.e. known only at runtime) cannot be
automatically parsed, but will log errors while the app is running if they're
missing from the served translation files. To resolve, add the missing key:value
translations to `locales/<language>/translation.json`.

This applies to the server code too, except no error will be raised. Therefore,
you should use string literals everywhere in server-side code that might be
exposed to the front end, to properly generate translation files. See error
message handling in `metecho/api/sf_run_flow.py` for an example.

## Storybook Development Workflow

When doing development for the component library in Storybook, use one of these
two commands:

    $ ./derrick storybook  # if running outside of container
    $ yarn storybook  # if working in a remote container in VS Code

After running one of these commands, you can view the Storybook at
<http://localhost:6006/> in your browser.

For more detailed steps on contributing to the component library, see
`docs/component-library-how-to.md`.
