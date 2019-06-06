web: daphne --bind 0.0.0.0 --port $PORT metashare.asgi:application
worker: python manage.py rqworker default
dev_worker: honcho start -f Procfile_dev_worker 
scheduler: python manage.py rqscheduler default
release: python manage.py migrate --noinput
