.PHONY: up build migrate shell lint test prune

up:
	docker-compose up

down:
	docker-compose down

build:
	docker-compose build

# Django management:
migrate:
	docker-compose run web python manage.py migrate

shell:
	docker-compose run web python manage.py shell

# This could operate through yarn, so we have a single source of truth?
lint:
	docker-compose run --no-deps web yarn lintjs
	docker-compose run --no-deps web yarn stylelint
	docker-compose run --no-deps web black manage.py metashare/ config/
	docker-compose run --no-deps web isort -rc manage.py metashare/ config/
	docker-compose run --no-deps web flake8 manage.py metashare/ config/

# This could operate through yarn, so we have a single source of truth?
test:
	docker-compose run --no-deps web yarn test
	docker-compose run web pytest

# See https://docs.docker.com/config/pruning/ for more detail.
prune:
	docker image prune
	docker container prune
