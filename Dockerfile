FROM alpine:3.10

ARG BUILD_ENV=development

# System & Python setup:
# @@@ Do we need redis-tools?
RUN apk --no-cache add gettext libjpeg libffi libpq libxml2 libxslt nodejs python3 py3-pip redis yarn zlib openssl ca-certificates
COPY ./requirements /requirements
RUN apk --no-cache add --virtual build-deps build-base gcc jpeg-dev libffi-dev libxml2-dev libxslt-dev postgresql-dev python3-dev zlib-dev && \
    pip3 install --no-cache-dir -r requirements/prod.txt && \
    pip3 install --no-cache-dir -r requirements/dev.txt && \
    apk del build-deps

# Python server setup:
COPY ./compose/web/start-server.sh /start-server.sh
RUN chmod +x /start-server.sh
RUN ln -s $(which python3) /usr/local/bin/python

# JS client setup:
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
WORKDIR /app
RUN yarn install --check-files && yarn cache clean

COPY . /app

# Env setup:
ENV PYTHONPATH /app
ENV DATABASE_URL postgres://metashare@db:5432/metashare
# A sample key, not to be used for realsies:
ENV DB_ENCRYPTION_KEY 'IfFzxkuTnuk-J-TnjisNz0wlBHmAILOnAzoG-NpMQNE='
ENV DJANGO_HASHID_SALT 'sample hashid salt'
ENV DJANGO_SECRET_KEY 'sample secret key'
ENV DJANGO_SETTINGS_MODULE config.settings.production
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# === Actually run things:

# Avoid building prod assets in development
RUN if [ "${BUILD_ENV}" = "production" ] ; then yarn prod ; else mkdir -p dist/prod ; fi
RUN python manage.py collectstatic --noinput

CMD /start-server.sh
