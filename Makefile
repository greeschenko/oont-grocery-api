.PHONY: build run test

build:
	docker-compose up --build

run:
	docker-compose up

test:
	docker-compose exec app npm run test
	docker-compose exec app npm run test:e2e
