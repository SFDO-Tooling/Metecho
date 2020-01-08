#!/bin/sh
# Use the presence of $PORT as a proxy for "are we local or Heroku?"
if [ -z ${PORT+x} ];
then
    # PORT unset, we presume this is local dev:
    python manage.py migrate
    DJANGO_ALLOW_ASYNC_UNSAFE=true yarn serve
else
    # PORT set, we presume this is Heroku:
    yarn django:serve:prod
fi
