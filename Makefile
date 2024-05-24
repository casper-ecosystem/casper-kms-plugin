CURRENT_DIR = .

# Extract the second argument from MAKECMDGOALS, defaulting to "stable"
PROFILE ?= $(word 2,$(MAKECMDGOALS))
PROFILE := $(if $(PROFILE),$(PROFILE),production)

DC = docker compose -f $(CURRENT_DIR)/docker/docker-compose.yml

build:
	$(DC) --profile $(PROFILE) build

up:
	$(DC) --profile $(PROFILE) up --remove-orphans

start:
	$(DC) --profile $(PROFILE) up --remove-orphans -d

stop:
	$(DC) --profile $(PROFILE) stop

build-no-cache:
	$(DC) --profile $(PROFILE) build --no-cache

build-start: build
	$(DC) --profile $(PROFILE) up --remove-orphans	-d

build-start-log: build
	$(DC) --profile $(PROFILE) up --remove-orphans

run-test:
	cd app/src && npm run test


%:
	@:

.PHONY: build up start stop build-no-cache build-start build-start-log run-test
