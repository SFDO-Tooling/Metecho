FROM oddbirds/pyjs:py3.10-node16

ARG BUILD_ENV=development
WORKDIR /app

# Env setup:
ENV PYTHONPATH /app
ENV DJANGO_SETTINGS_MODULE config.settings.production

# Python requirements:
COPY ./requirements requirements
RUN pip install --no-cache-dir --upgrade pip pip-tools \
    && pip install --no-cache-dir -r requirements/prod.txt
RUN if [ "${BUILD_ENV}" = "development" ] ; then \
    pip install --no-cache-dir -r requirements/dev.txt; \
    fi

# Install sfdx
RUN npm install --global sfdx-cli --ignore-scripts

# JS client setup:
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install --check-files

COPY . /app

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

CMD /app/start-server.sh
