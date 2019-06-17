FROM wlonk/oddbird:latest

# Env setup:
ENV PYTHONPATH /app
ENV DJANGO_SETTINGS_MODULE config.settings.local
ENV DATABASE_URL postgres://metashare@db:5432/metashare

# Python server setup:
COPY ./Pipfile.lock /Pipfile.lock
COPY ./Pipfile /Pipfile
COPY ./compose/web/start-dev.sh /start-dev.sh

RUN chmod +x /start-dev.sh
RUN pipenv lock
RUN pipenv install --dev --system --deploy --ignore-pipfile

# JS client setup:
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

COPY . /app

EXPOSE 8000

# Actually run things:
WORKDIR /app
RUN yarn install
CMD /start-dev.sh
