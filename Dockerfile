FROM wlonk/oddbird:latest

# Install local development tools (git, docker-cli used for viewing logs):
COPY ./compose/web/install-dev-tools.sh /install-dev-tools.sh
RUN chmod +x /install-dev-tools.sh
RUN /install-dev-tools.sh

# Env setup:
ENV PYTHONPATH /app

ENV DATABASE_URL postgres://metashare@db:5432/metashare
# A sample key, not to be used for realsies:
ENV DB_ENCRYPTION_KEY 'IfFzxkuTnuk-J-TnjisNz0wlBHmAILOnAzoG-NpMQNE='
ENV DJANGO_HASHID_SALT 'sample hashid salt'
ENV DJANGO_SECRET_KEY 'sample secret key'
ENV DJANGO_SETTINGS_MODULE config.settings.production

# Python server setup:
COPY ./Pipfile.lock /Pipfile.lock
COPY ./Pipfile /Pipfile
COPY ./compose/web/start-server.sh /start-server.sh

RUN chmod +x /start-server.sh
RUN pipenv lock
RUN pipenv install --dev --system --deploy --ignore-pipfile

# JS client setup:
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

COPY . /app

# === Actually run things:
WORKDIR /app
RUN yarn install --check-files

# Avoid building prod assets in development
ARG BUILD_ENV=development
RUN if [ "${BUILD_ENV}" = "production" ] ; then yarn prod ; else mkdir -p dist/prod ; fi
RUN python manage.py collectstatic --noinput

CMD /start-server.sh
