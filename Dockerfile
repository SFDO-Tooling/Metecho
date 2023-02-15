FROM ghcr.io/oddbird/pyjs:py3.10-node16

ARG BUILD_ENV=production
ARG PROD_ASSETS
WORKDIR /app

# Env setup:
ENV PYTHONPATH /app
ENV DJANGO_SETTINGS_MODULE config.settings.production

RUN npm install --save-dev mini-css-extract-plugin
RUN npm install --location=global sfdx-cli --ignore-scripts
RUN npm install --location=global @testim/testim-cli
RUN npm install --location=global vlocity
RUN npm install --location=global puppeteer --unsafe-perm=true
RUN sfdx plugins:install sfdmu

RUN npx --yes playwright install-deps 

# Python requirements:
COPY ./requirements requirements
RUN pip install --no-cache-dir --upgrade pip pip-tools \
  && pip install --no-cache-dir -r requirements/prod.txt
RUN if [ "${BUILD_ENV}" = "development" ] ; then \
  pip install --no-cache-dir -r requirements/dev.txt; \
  fi

RUN cci robot install_playwright
RUN pip install --upgrade cumulusci
RUN pip install behave
RUN pip install pandas
RUN pip install pandasql
RUN pip uninstall -y psutil
RUN pip install psutil==5.9.2
RUN pip install cryptography==38.0.1

# JS client setup:
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install --check-files
COPY . /app
RUN ls
RUN pwd
RUN mkdir dist
RUN mkdir dist/prod
RUN yarn prod
# Avoid building prod assets in development
#RUN if [ "${BUILD_ENV}" = "production" ] || [ -n "${PROD_ASSETS}" ] ; then yarn prod ; else mkdir -p dist/prod ; fi
RUN pwd
RUN \
  # Sample keys, not to be used for realsies:
  DB_ENCRYPTION_KEY="IfFzxkuTnuk-J-TnjisNz0wlBHmAILOnAzoG-NpMQNE=" \
  SFDX_CLIENT_SECRET="sample secret" \
  SFDX_CLIENT_CALLBACK_URL="sample callback" \
  SFDX_CLIENT_ID="sample id" \
  SFDX_HUB_KEY="sample key" \
  python manage.py collectstatic --noinput
