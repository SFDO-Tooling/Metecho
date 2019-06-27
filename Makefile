.PHONY: build down jstest lint migrate migrations prune pyinstall pytest run shell test up

up:
	docker-compose up

down:
	docker-compose down

build:
	docker-compose build

lint:
	docker-compose run --rm --no-deps web yarn lint

test:
	docker-compose run --rm web yarn test:all

pytest:
	docker-compose run --rm web yarn pytest

jstest:
	docker-compose run --rm web yarn test

pyinstall:
	# call as `make pyinstall P=requests` etc.
	docker-compose run --rm --no-deps web pipenv install $(P)

# Django management:
migrate:
	# call as `make migrate APP=api PREF=0001` etc.
	docker-compose run --rm web python manage.py migrate $(APP) $(PREF)

migrations:
	# call as `make migrations APP=api` etc.
	docker-compose run --rm web python manage.py makemigrations $(APP)

shell:
	docker-compose run --rm web python manage.py shell

# See https://docs.docker.com/config/pruning/ for more detail.
prune:
	docker image prune -f
	docker container prune -f
	docker volume rm $(docker volume ls -qf dangling=true)
