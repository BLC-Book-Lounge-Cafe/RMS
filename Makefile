.DEFAULT_GOAL := all

.NOTPARALLEL:

COMPOSE := PUID=$(shell id -u) PGID=$(shell id -g) docker compose

run  := $(COMPOSE) run --rm workspace
exec := $(COMPOSE) exec workspace

NEST := $(run) nest
PNPM := $(run) pnpm

.PHONY: build
build: workspace-build workspace-up node_modules

.PHONY: all
all: build start

### ==================================================================
### Сборка проекта
### ==================================================================

.PHONY: test
test:
	$(PNPM) test

.PHONY: lint
lint:
	$(PNPM) lint

.PHONY: node_modules
node_modules:
	$(PNPM) install --package-import-method=copy

.PHONY: start
start: PNPM := $(exec) pnpm
start:
	$(PNPM) run start:dev

### ==================================================================
### Управление рабочим окружением
### ==================================================================

.PHONY: workspace
workspace:
	$(exec) sh

.PHONY: workspace-build
workspace-build:
	$(COMPOSE) build

.PHONY: workspace-up
workspace-up:
	@$(COMPOSE) up --detach

.PHONY: workspace-down
workspace-down: ; $(COMPOSE) down --remove-orphans
