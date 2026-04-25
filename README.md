# RMS — Reservation Management Service

## Описание проекта

Backend сервиса бронирования столов и книг в кафе. Отвечает за создание и подтверждение броней, заявки на быстрое бронирование, просмотр доступных слотов и администрирование броней.

## Локальный запуск

Требуются локально установленные:

- `make`
- `docker`

Для полного запуска (сборка workspace, поднятие postgres, установка зависимостей, старт Nest в watch-режиме) достаточно выполнить:

```
make
```

Поднять все контейнеры:

```
make workspace-up
```

Опустить все контейнеры:

```
make workspace-down
```

Запустить проект (контейнеры должны быть подняты):

```
make start
```

Запустить тесты:

```
make test
```

Запустить линтер:

```
make lint
```

## Swagger

После старта проекта документация API доступна по адресу:

```
http://localhost:3000/swaggerui
```

## Авторизация

Все запросы к API проходят через глобальный `AuthGuard`, который проверяет заголовок:

```
Authorization: Bearer <RMS_API_KEY>
```

## Структура

```
src/
  main.ts                     # bootstrap, ValidationPipe, Swagger /swaggerui
  app.module.ts               # ConfigModule, DatabaseRmsModule, APP_GUARD
  guards/
    auth.guard.ts             # Bearer api-key guard
    guards.errors.ts
  infrastructure/
    clients/
      database/
        database-rms.client.ts
        database-rms.module.ts
prisma/
  rms/
    schema.prisma             # provider = postgresql, без моделей
    prisma.config.ts
test/
  jest.json
  setup-tests.ts
```
