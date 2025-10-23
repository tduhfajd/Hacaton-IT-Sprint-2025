# Smart Support - Celery Workers

Асинхронные обработчики задач для AI анализа обращений.

## 🏗️ Архитектура

```
Backend (Node.js) → RabbitMQ → Celery Worker (Python) → PostgreSQL
```

## 📋 Задачи (Tasks)

### 1. `tasks.analyze_appeal`
- **Анализирует обращение:**
  - Определяет приоритет (low/medium/high/critical)
  - Определяет тональность (positive/neutral/negative)
  - Извлекает ключевые слова
  - Создаёт краткое резюме
- **Сохраняет в БД:** `appeals` (обновляет колонки AI анализа)

### 2. `tasks.generate_response`
- **Генерирует вариант ответа:**
  - Ищет релевантные статьи в базе знаний
  - Формирует текст ответа оператору
- **Сохраняет в БД:** `ai_responses`

## 🚀 Запуск

### Docker (Production)
```bash
docker-compose up -d celery-worker
docker logs -f smart-support-celery-worker
```

### Local Development
```bash
cd workers
pip install -r requirements.txt
celery -A celery_app worker --loglevel=info
```

## 🔧 Конфигурация

Переменные окружения (см. `docker-compose.production.yml`):
- `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`, `RABBITMQ_PASS`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## 📊 Мониторинг

RabbitMQ Management UI:
```
https://rabbitmq-smartsupport.vadimevgrafov.ru
User: admin
Pass: SmartSupport2025!
```

## 🧪 Тестирование

```bash
# Отправить тестовую задачу
python -c "
from celery_app import app
result = app.send_task('tasks.analyze_appeal', args=['test-id', 'Тест', 'Описание'])
print(f'Task ID: {result.id}')
"
```

## 🔮 Будущие улучшения

- [ ] GigaChat интеграция (реальный AI)
- [ ] Контекст диалога (история сообщений)
- [ ] Embeddings для поиска в KB
- [ ] Retry политики
- [ ] Flower UI для мониторинга

