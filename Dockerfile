FROM oddbirds/pyjs:v0.4.0

ARG BUILD_ENV=development

# Env setup:
ENV PYTHONPATH /app
ENV DJANGO_SETTINGS_MODULE config.settings.production

# Python server setup:
COPY ./compose/web/start-server.sh /start-server.sh
RUN chmod +x /start-server.sh

# Python requirements:
COPY ./requirements /requirements
RUN pip install --no-cache-dir --upgrade pip pip-tools \
    && pip install --no-cache-dir -r requirements/prod.txt
RUN if [ "${BUILD_ENV}" = "development" ] ; then \
    pip install --no-cache-dir -r requirements/dev.txt; \
    fi

# Install sfdx
RUN mkdir sfdx && wget -qO- https://developer.salesforce.com/media/salesforce-cli/sfdx-linux-amd64.tar.xz | tar xJ -C sfdx --strip-components 1 && ./sfdx/install && rm -rf sfdx

# JS client setup:
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

COPY . /app

# === Actually run things:
WORKDIR /app
RUN yarn install --check-files

# Avoid building prod assets in development
RUN if [ "${BUILD_ENV}" = "production" ] ; then yarn prod ; else mkdir -p dist/prod ; fi
RUN DATABASE_URL="" \
  # Sample keys, not to be used for realsies:
  DB_ENCRYPTION_KEY="IfFzxkuTnuk-J-TnjisNz0wlBHmAILOnAzoG-NpMQNE=" \
  DJANGO_HASHID_SALT="sample hashid salt" \
  DJANGO_SECRET_KEY="sample secret key" \
  SFDX_CLIENT_SECRET="sample secret" \
  SFDX_CLIENT_CALLBACK_URL="sample callback" \
  SFDX_CLIENT_ID="sample id" \
  SFDX_HUB_KEY="sample key" \
  python manage.py collectstatic --noinput

CMD /start-server.sh
