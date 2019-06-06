web: daphne --bind 0.0.0.0 --port $PORT metashare.asgi:application
worker: python manage.py rqworker default
scheduler: python manage.py rqscheduler default
release: python manage.py migrate --noinput
