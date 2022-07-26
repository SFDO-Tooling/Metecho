# Metecho Settings

The Django `settings` module/system has been in production for many applications
for a long time. People like Daniel Roy Greenfield (of
[Two Scoops of Django](https://twoscoopspress.com/products/two-scoops-of-django-1-11)
fame) have developed great patterns for using Django settings in
[12-factor applications](https://12factor.net/) on Heroku.

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

Since we're all 12-factor-y, we use
[`django-environ`](https://django-environ.readthedocs.io/en/latest/index.html)
to read all secrets and most other config that needs to be done per-deployment
from environment variables (instead of generically in code).

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

# Metecho Proctypes

- `web`: the asgi server that handles HTTP and WebSockets
- `worker`: the main worker type
- `scheduler`: the town clock, that implements cron scheduling for jobs on any
  work queue
