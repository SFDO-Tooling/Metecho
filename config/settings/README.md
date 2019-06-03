# MetaShare Settings

The Django `settings` module/system has been in production for many applications
for a long time. People like Daniel Roy Greenfield (of [Two Scoops of
Django](https://twoscoopspress.com/products/two-scoops-of-django-1-11) fame)
have developed great patterns for using Django settings in [12-factor
applications](https://12factor.net/) on Heroku.

Settings are override-based, where _all_ application settings are defined in
`base.py`, and additional files can use the following incantation to become a
settings module:

```python
from .base import *  # NOQA
from .base import env
```

No frills, and if you want to further override a specific config, you just
import the module you want to override from instead of `base`, and go on with
your day.

It includes a few helpers, the most obvious one being the innocently named
`env`. It has a great docstring, but it's used for getting an environment
variable value. All secrets and most other config
that needs to be done per-deployment (instead of generically in code) should be
done through environment variables. Granular levers are good. To that end, `env`
makes it easy to grab a value:

```python
SECURE_HSTS_SECONDS = env("SECURE_HSTS_SECONDS", default=0, type_=int)
```

Since this is a normal Django settings module, all settings are just "constants"
(or by convention, all-caps named public members) on the module. So, here, we're
defining a setting called `SECURE_HSTS_SECONDS`. The first parameter is the name
of an environment variable; if that var is set, that value is used. The second
parameter, `default`, is used if the var is not set. Keep in mind, `$ export
APPLESAUCE=` will cause `env('APPLESAUCE', default='3')` to not be 3, but
instead an empty string! Lastly, there's the `type_` parameter, which is a value
coercion function. It will be called on whatever value `env` comes up with. It
will be called on the `default` if you specified a default and the key was not
set. It's functionally similar to `type_(os.environ.get(ENV_VAR, default))`, but
easier to read and covers some pitfalls. If you don't provide a default, an
exception will be raised if the env var is not present in the environment.

Minimize values that are optional but don't have a default (such as
`SENTRY_DSN`). It happens, but it requires more defensive coding to check for a
value of `""` everywhere it's in use.

Frequently, your `type_` is just `str` or `int`, but we also include `boolish`
which accepts (`"True"`, `"true"`, `"T"`, `"t"`, `"1"`, `1`) as true and
everything else is false.

Finally, the very helpful `PROJECT_ROOT` is exported. Sub-modules usually end up
appending to some existing setup keys, like `LOGGING`, `INSTALLED_APPS`, and
`REST_FRAMEWORK`.

The exact same stack is used in local dev as it is on staging as it is in
production. The differences in 2nd-level-overrides of settings is limited to how
external resources are accessed. `commonruntime.py` "inherits" (imports) from
`production.py`, so the only changes it makes are things important to running in
the Heroku common runtime, like where to get an AWS bucket id.

In addition to runtime differences, sometimes we have different Django
configurations for different processes (Proctypes). The changes in configs for
specific Proctypes should be even smaller. We have to have additional settings
modules in order to run commands lke database migrations with elevated
credentials, and to run management commands with specific logging. Sometimes
these are small enough to simply put behind an additional environment variable.

# MetaShare Proctypes

- `web`: the asgi server that handles HTTP and WebSockets
- `worker_default`: the main worker type
- `worker_short`: a queue dedicated to very fast jobs
- `scheduler`: the town clock, that implements cron scheduling for jobs on any
  work queue
- `worker`: a combined worker process that works all queues
