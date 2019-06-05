FROM python:3.7

RUN apt-get update && apt-get install -y gettext

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONPATH /app
ENV DJANGO_SETTINGS_MODULE config.settings.local
ENV DATABASE_URL postgres://metashare@db:5432/metashare

RUN pip install --upgrade pip
RUN pip install pipenv
COPY ./Pipfile.lock /Pipfile.lock
COPY ./Pipfile /Pipfile
RUN pipenv install --dev --system --deploy --ignore-pipfile

COPY ./compose/web/start-dev.sh /start-dev.sh
RUN chmod +x /start-dev.sh

WORKDIR /app

CMD /start-dev.sh
