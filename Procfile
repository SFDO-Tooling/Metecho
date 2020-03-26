web: /start-server.sh
worker: python manage.py rqworker default
worker-short: honcho start -f Procfile_worker_short
release: python manage.py migrate --noinput
