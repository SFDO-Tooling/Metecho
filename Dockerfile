FROM oddbirds/pyjs:v-0.1.0

ARG BUILD_ENV=development

# Python server setup:
COPY ./compose/web/start-server.sh /start-server.sh
RUN chmod +x /start-server.sh

# Python requirements:
COPY ./requirements /requirements
RUN pip install --no-cache-dir -r requirements/prod.txt
RUN if [ "${BUILD_ENV}" = "development" ]; then pip install --no-cache-dir -r requirements/dev.txt; fi

# Install sfdx
RUN mkdir sfdx && wget -qO- https://developer.salesforce.com/media/salesforce-cli/sfdx-linux-amd64.tar.xz | tar xJ -C sfdx --strip-components 1 && ./sfdx/install && rm -rf sfdx

# JS client setup:
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
WORKDIR /app
RUN yarn install --check-files

COPY . /app
RUN addgroup dyno && bin/post_compile && mv bin/run-cci /usr/local/bin/run-cci

# Env setup:
ENV PYTHONPATH /app
ENV DATABASE_URL postgres://metecho@postgres:5432/metecho
# A sample key, not to be used for realsies:
ENV DB_ENCRYPTION_KEY 'IfFzxkuTnuk-J-TnjisNz0wlBHmAILOnAzoG-NpMQNE='
ENV DJANGO_HASHID_SALT 'sample hashid salt'
ENV DJANGO_SECRET_KEY 'sample secret key'
ENV DJANGO_SETTINGS_MODULE config.settings.production
ENV METECHO_CCI_PATH '/usr/local/bin/run-cci'

# Avoid building prod assets in development
RUN if [ "${BUILD_ENV}" = "production" ] ; then yarn prod ; else mkdir -p dist/prod ; fi
RUN python manage.py collectstatic --noinput

CMD /start-server.sh
