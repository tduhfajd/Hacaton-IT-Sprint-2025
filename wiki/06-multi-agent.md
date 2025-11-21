# 06 — Мультиагентная схема SmartSupport

Если рассматривать SmartSupport как мультиагентную систему, каждый компонент платформы становится автономным агентом со своими целями, событиями и каналами связи. Ниже приведена схема и описание ролей.

## 🔗 Общая среда

- **Коммуникация**: HTTP API, WebSocket (Socket.io) и RabbitMQ.
- **Хранилища**: PostgreSQL (долговременные данные), Redis (сессии, кеш), knowledge base (Markdown/таблица).
- **Наблюдаемость**: логи контейнеров, RabbitMQ management UI, метрики из [MONITORING.md](../MONITORING.md).

Сами агенты не обмениваются данными напрямую — они взаимодействуют через общую среду (API, очередь сообщений, БД).

## 📊 Схема мультиагентного взаимодействия

```mermaid
flowchart TB
    subgraph EntryPoints[Каналы пользователей]
        citizen[Citizen Agents]
        telegram[Telegram Agents]
        landing[Landing Agent]
    end

    subgraph Operators[Рабочие интерфейсы]
        operator[Operator Agents]
        admin[Admin Agent]
    end

    gateway[[API Gateway]]
    orchestrator[Orchestrator Agent<br/>(backend)]
    ai[AI Analysis Agent<br/>(Celery)]
    knowledge[Knowledge Agent]
    rabbitmq[(RabbitMQ)]
    postgres[(PostgreSQL)]
    monitoring[Monitoring/Admin Agents]
    gigachat[[GigaChat API]]
    kb[(Knowledge Base)]

    citizen -- HTTP --> gateway
    telegram -- HTTP/Bot API --> gateway
    landing -- HTTP --> gateway
    operator -- WebSocket --> gateway
    admin -- REST --> gateway

    gateway --> orchestrator
    orchestrator --> rabbitmq
    orchestrator --> postgres
    orchestrator --> knowledge
    knowledge --> kb
    knowledge --> postgres
    ai --> postgres
    ai --> knowledge
    rabbitmq --> ai
    ai --> gigachat
    monitoring <-- control/metrics --> orchestrator
    monitoring <-- metrics --> rabbitmq
    monitoring <-- logs --> postgres
    orchestrator -- events --> operator
```

## 🤖 Агентные роли

| Агент | Цель | Каналы взаимодействия |
| --- | --- | --- |
| **Citizen Agent** | Создаёт обращение, получает ответ. Представлен web-интерфейсом `frontend/user`. | REST API (`/api/appeals`), Socket.io (обновления статуса). |
| **Telegram Agent** | То же, но через Telegram бот. Преобразует сообщения бота в события API. | Telegram Bot API ↔ backend REST. |
| **Operator Agent** | Обрабатывает обращения, отправляет ответы, меняет статусы. | Socket.io подписка (`appeal.updated`), REST (`/api/appeals/:id/responses`). |
| **Admin Agent** | Управляет базой знаний, категориями, пользователями. | REST (`/api/admin/*`), обновляет KB и схему. |
| **Orchestrator Agent** | Центральный координатор (текущий backend). Управляет правами, записывает данные в БД, публикует задачи AI. | REST/WebSocket, PostgreSQL, Redis, RabbitMQ. |
| **AI Analysis Agent** | Выполняет `tasks.analyze_appeal` и `tasks.generate_response`, обращается к GigaChat, заливает результаты в `appeal_analysis`/`ai_responses`. | RabbitMQ, PostgreSQL, GigaChat API. |
| **Knowledge Agent** | Индексирует и выдаёт статьи из `knowledge-base`, снабжает AI релевантным контентом. | PostgreSQL/Markdown, Redis (кеш), взаимодействие с Orchestrator и AI агентом. |
| **Monitoring/Admin Agents** | Следят за состоянием контейнеров, метрик и очередей, перезапускают сервисы. | Docker/K8s, RabbitMQ UI, логи, скрипты из `scripts/`. |

## 🔁 Поведение и события

1. **Citizen/Telegram Agents** создают событие `appeal.created` через API.
2. **Orchestrator Agent** сохраняет обращение и публикует задачу в RabbitMQ.
3. **AI Analysis Agent** извлекает задачу, вызывает GigaChat, обновляет БД и посылает `appeal.analyzed`.
4. **Operator Agent** подписан на `appeal.updated`/`appeal.analyzed`, получает подсказки и может инициировать `appeal.responded`.
5. **Knowledge Agent** следит за изменениями статей и поддерживает актуальный индекс, чтобы ответы были релевантны.
6. **Monitoring/Admin Agents** реагируют на метрики (перезапуск, очистка очередей, обновление конфигурации).

Каждое событие можно расширять: например, добавить **Notification Agent**, который будет слушать `appeal.completed` и рассылать уведомления по e-mail/SMS, не изменяя существующие компоненты.

## 📎 Полезные ссылки

- Архитектура: [02 — Архитектура](02-architecture.md)
- AI и база знаний: [05 — AI и база знаний](05-knowledge-base.md)
- Основное описание ролей и сценариев: [01 — Обзор](01-overview.md)
