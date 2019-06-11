.PHONY: up down build run migrate shell lint test prune

up:
	docker-compose up

down:
	docker-compose down

build:
	docker-compose build

lint:
	docker-compose run --no-deps web yarn lint

test:
	docker-compose run --no-deps web yarn test:all

# Django management:
migrate:
	docker-compose run web python manage.py migrate

shell:
	docker-compose run web python manage.py shell

# See https://docs.docker.com/config/pruning/ for more detail.
prune:
	docker image prune
	docker container prune
