#!/bin/sh
# Can this be in the Dockerfile?
python manage.py migrate

# Use the presence of $PORT as a proxy for "are we local or Heroku?"
if [ -z ${PORT+x} ];
then
    # PORT unset, we presume this is local dev:
    PORT=8000 yarn serve
else
    # PORT set, we presume this is Heroku:
    yarn django:serve:prod
fi
