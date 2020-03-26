web: daphne --bind 0.0.0.0 --port $PORT metashare.asgi:application
worker: python manage.py rqworker default
worker-short: honcho start -f Procfile_worker_short
release: python manage.py migrate --noinput
