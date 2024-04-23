export

.PHONY: dev-build dev-start clean

DEV_DC = docker compose -p casper-kms-plugin -f docker/docker-compose.dev.yml

dev-build:
	$(DEV_DC) build

dev-start:
	$(DEV_DC) up

clean:
	$(DEV_DC) stop
