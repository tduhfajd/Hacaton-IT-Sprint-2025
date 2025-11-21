# 03 — Карта репозитория

Используйте этот раздел как "справочник местности": он показывает, какие каталоги существуют, за что отвечают файлы и где лежит документация.

## 📁 Основные каталоги верхнего уровня

| Путь | Назначение |
| --- | --- |
| `backend/` | Node.js API + Telegram бот. Внутри `src/` (controllers, services, routes), `migrations/`, `tests/`, `scripts/`. |
| `frontend/` | Три фронтенд-приложения: `user/`, `operator/`, `admin/`. Каждый проект — отдельный Vite + Tailwind SPA. |
| `workers/` | Celery workers на Python, выполняющие AI-анализ и генерацию ответов (`tasks/`, `celery_app.py`, `gigachat_client.py`). |
| `database/` | SQL-модули, дампы или вспомогательные материалы по БД (используется миграциями backend). |
| `knowledge-base/` | Markdown-статьи, которые используются AI при генерации ответов. Категории соответствуют типам обращений. |
| `landing/`, `static/` | Публичный лендинг и статические ассеты. |
| `nginx/`, `nginx-configs/`, `nginx-vhosts/` | Конфигурации reverse proxy, SSL и виртуальных хостов. |
| `scripts/` | Bash/Node утилиты для деплоя, очистки, миграций. |
| `specs/` | Дополнительные спецификации (API, UI, исследовательские файлы). |

Кроме того, в корне лежат вспомогательные скрипты (`deploy.sh`, `deploy-landing.sh`, `start.sh`, `stop.sh`) и основной `docker-compose.yml`, который запускает всю систему.

## 🗂️ Структура backend

- `src/config/` — конфигурации базы данных, Redis, RabbitMQ, GigaChat.
- `src/controllers/`, `src/services/`, `src/routes/` — REST API и сокет-эндпоинты.
- `src/utils/` — вспомогательные классы (логгер, форматирование ответов, guards).
- `migrations/` — миграции базы (TypeORM/Knex), дополняются описаниями в `MIGRATION_*.md`.
- `tests/` и `jest.config.js` — unit/integration тесты (см. `npm run test`).

## 🖥️ Структура frontend

Каждый подпроект (`frontend/user`, `frontend/operator`, `frontend/admin`):

- `src/app`, `src/features`, `src/widgets` — UI-модули по atomic-архитектуре.
- `src/shared/api` — клиенты к backend API.
- `src/shared/config/env` — конфигурация окружения.
- `Dockerfile`, `nginx.conf`, `env.production.example` — упаковка и деплой.

## 🤖 AI и интеграции

- `workers/tasks/` — файлы Celery задач (`analyze_appeal`, `generate_response`).
- `workers/gigachat_client.py` — низкоуровневая работа с GigaChat API.
- `gigachat-config.example.json` — шаблон для локальных ключей.
- `knowledge-base/*.md` — статьи, которые индексируются и используются генератором ответов.

Подробнее про AI см. в [05 — AI и база знаний](05-knowledge-base.md).

## 📑 Документация и спецификации

| Документ | Описание |
| --- | --- |
| `README.md` | Полное описание продукта, возможностей и архитектуры. |
| `README_FOR_DUMMIES.md` | Объяснение концепций простым языком (полезно при онбординге). |
| `ARCHITECTURE.md` | Подробные диаграммы, эндпоинты, workflow обработки обращений. |
| `QUICKSTART.md` | Пошаговый запуск и типовые команды docker-compose. |
| `MONITORING.md` | Чек-листы и инструменты эксплуатации. |
| `TESTING_REPORT.md` | Результаты тестирования и покрытие кейсов. |
| `MIGRATION_*.md` | История изменений схемы БД. |
| `DEMO_CREDENTIALS.md` | Готовые демо-аккаунты и токены (используется для презентаций). |

Если не уверены, куда идти дальше — вернитесь к [wiki/README.md](README.md) и выберите нужную тему.
