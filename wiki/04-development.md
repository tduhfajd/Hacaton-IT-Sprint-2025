# 04 — Разработка и сопровождение

Этот раздел собирает в одном месте настройки окружения, команды запуска и чек-листы для эксплуатации. Используйте его как шпаргалку поверх [QUICKSTART.md](../QUICKSTART.md) и [MONITORING.md](../MONITORING.md).

## 🧱 Перед стартом

- **Node.js 18+**, **npm 9+** — для backend и фронтендов.
- **Python 3.11+** — если планируется запуск Celery локально без Docker.
- **Docker / docker-compose** — основной способ поднять всю систему.
- **GigaChat и Telegram креды**:
  - Скопируйте `.env.prod.example` → `.env.prod` и заполните переменные (PostgreSQL, Redis, RabbitMQ, GigaChat, Telegram).
  - Скопируйте `gigachat-config.example.json` → `gigachat-config.json` (или используйте ENV, см. [GIGACHAT_SETUP.md](../GIGACHAT_SETUP.md)).

## 🚀 Запуск через Docker

```bash
cd it-support
docker-compose --env-file .env.prod up -d
docker ps   # 11 контейнеров в работе
```

Полезные команды (из [QUICKSTART.md](../QUICKSTART.md)):

```bash
# Логи ключевых сервисов
docker-compose --env-file .env.prod logs -f backend
docker-compose --env-file .env.prod logs -f celery-worker

# Перезапуск отдельных сервисов
docker-compose --env-file .env.prod restart backend
docker-compose --env-file .env.prod restart celery-worker celery-beat

# Остановка
docker-compose --env-file .env.prod down
```

## 💻 Локальная разработка без Docker

Используйте, когда нужно дебажить код:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (пример для operator)
cd ../frontend/operator
npm install
npm run dev -- --host

# Celery worker
cd ../../workers
pip install -r requirements.txt
celery -A celery_app worker --loglevel=info
```

Не забудьте поднять локальные экземпляры PostgreSQL, Redis и RabbitMQ либо используйте docker-compose только для инфраструктуры (выпилите фронт/бекенд из файла).

## 🧪 Тестирование и качество

- Backend:
  - `npm run test`, `npm run test:watch`, `npm run test:coverage`
  - `npm run lint` или `npm run lint:fix`
- Frontend: `npm run test` (если настроены), `npm run lint`, `npm run type-check`
- Workers: юнит-тестов нет, но можно отправить тестовую задачу (см. `workers/README.md`).
- Отчёты ручного тестирования: [TESTING_REPORT.md](../TESTING_REPORT.md).

## 📊 Мониторинг и эксплуатация

- **RabbitMQ UI**: `https://rabbitmq-smartsupport.vadimevgrafov.ru` (`admin` / `SmartSupport2025!`).
- **PostgreSQL/Redis**: подключение из `psql`/`redis-cli` по данным `.env`.
- **Логи**: `docker logs smart-support-backend --tail 50`, аналогично для Celery и фронтов.
- **Мониторинг** (UptimeRobot, Grafana и т.п.) — см. [MONITORING.md](../MONITORING.md) для списка метрик и алертов.

## 📦 Деплой

- Автоматизированные скрипты: `deploy.sh`, `deploy-landing.sh`, `start.sh`, `stop.sh`.
- Процесс:
  1. Обновите `.env.prod` на сервере (если менялись креды).
  2. Выполните `docker-compose --env-file .env.prod pull && docker-compose --env-file .env.prod up -d`.
  3. Проверьте здоровье сервисов: `/health`, `/api/status`, фронты.
  4. Просмотрите логи backend и Celery в течение первых минут.
- При изменении схемы БД:
  - Обновите `backend/migrations`.
  - Опишите изменения в соответствующем `MIGRATION_XXX.md`.
  - Запустите `npm run build && npm run migrate`.
