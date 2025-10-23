# Архитектура системы "Умный помощник для обработки обращений граждан"

## Обзор системы

Система представляет собой интеллектуального помощника для сотрудников техподдержки, который помогает эффективно обрабатывать обращения граждан с использованием AI (GigaChat).

## Роли пользователей

### 1. Гражданин (Citizen)
- **Домен**: `user-smartsupport.vadimevgrafov.ru`
- **Функции**:
  - Подача обращений через простую форму
  - Отслеживание статуса обращений по tracking number
  - Переписка с операторами в режиме чата
  - Просмотр истории своих обращений

### 2. Оператор (Operator)  
- **Домен**: `operator-smartsupport.vadimevgrafov.ru`
- **Функции**:
  - Просмотр списка всех обращений с фильтрами (категория, приоритет, статус)
  - Получение AI-анализа обращений (категория, приоритет, тональность)
  - Получение готовых вариантов ответов от AI
  - Редактирование и отправка ответов гражданам
  - Ведение переписки с гражданами
  - Изменение статуса обращений
  - Просмотр статистики обработки

### 3. Администратор (Admin)
- **Домен**: `admin-smartsupport.vadimevgrafov.ru`
- **Функции**:
  - Управление базой знаний (добавление/редактирование/удаление)
  - Управление категориями обращений
  - Управление пользователями и их ролями
  - Просмотр расширенной аналитики
  - Мониторинг работы системы
  - Настройка параметров AI

## Технологическая архитектура

### Backend API
- **Домен**: `api-smartsupport.vadimevgrafov.ru`
- **Технологии**: Node.js 18+, TypeScript, Express.js
- **База данных**: PostgreSQL 15
- **Кэш**: Redis 7
- **AI**: GigaChat API от Сбера

### Frontend
- **Технологии**: React 18, TypeScript, Vite, Tailwind CSS
- **Три отдельных сборки**:
  - User Interface (для граждан)
  - Operator Dashboard (для операторов)
  - Admin Panel (для администраторов)

### DevOps
- Docker & Docker Compose
- Nginx как reverse proxy
- Let's Encrypt для SSL сертификатов

## Структура базы данных

### Основные таблицы

1. **users** - Пользователи системы
   - id, email, password_hash, full_name, phone, role, created_at

2. **appeals** - Обращения граждан
   - id, user_id, tracking_number, subject, description
   - category_id, priority, status, address
   - submitted_at, processed_at, completed_at

3. **appeal_analysis** - AI-анализ обращений
   - id, appeal_id, sentiment_type, sentiment_score
   - category_suggestion, priority_suggestion
   - keywords, summary, ai_confidence

4. **categories** - Категории обращений
   - id, name, description, is_active

5. **responses** - Ответы операторов
   - id, appeal_id, operator_id, content
   - is_ai_generated, created_at

6. **knowledge_base** - База знаний
   - id, title, content, category_id, tags
   - created_by, created_at, updated_at

7. **chat_messages** - Сообщения в чате
   - id, appeal_id, sender_id, sender_type
   - message, message_type, is_read, created_at

8. **chat_sessions** - Сессии чата
   - id, appeal_id, operator_id, status
   - started_at, ended_at

## API Endpoints

### Публичные эндпоинты
```
GET  /health                              - Проверка здоровья системы
GET  /api/status                          - Статус API
POST /api/auth/register                   - Регистрация пользователя
POST /api/auth/login                      - Вход в систему
GET  /api/appeals/tracking/:trackingNumber - Отслеживание обращения (публично)
```

### Эндпоинты для граждан
```
POST /api/appeals                         - Создание обращения
GET  /api/appeals/:id                     - Просмотр своего обращения
GET  /api/appeals/:id/timeline            - История обращения
GET  /api/chat/:appealId                  - Чат по обращению
POST /api/chat/:appealId/message          - Отправка сообщения
```

### Эндпоинты для операторов
```
GET  /api/appeals                         - Список всех обращений (с фильтрами)
GET  /api/appeals/stats                   - Статистика обращений
POST /api/appeals/:id/status              - Изменение статуса
POST /api/appeals/:id/responses           - Добавление ответа
POST /api/ai/analyze/:id                  - Анализ обращения через AI
POST /api/ai/generate-response/:id        - Генерация ответа через AI
GET  /api/operators/dashboard             - Данные для дашборда оператора
GET  /api/operators/my-appeals            - Обращения, назначенные оператору
```

### Эндпоинты для администраторов
```
GET  /api/admin/users                     - Список пользователей
POST /api/admin/users                     - Создание пользователя
PUT  /api/admin/users/:id                 - Редактирование пользователя
GET  /api/admin/knowledge-base            - Список материалов базы знаний
POST /api/admin/knowledge-base            - Добавление материала
PUT  /api/admin/knowledge-base/:id        - Редактирование материала
DELETE /api/admin/knowledge-base/:id      - Удаление материала
GET  /api/admin/categories                - Управление категориями
GET  /api/admin/analytics                 - Расширенная аналитика
GET  /api/admin/system-health             - Мониторинг системы
```

## Workflow обработки обращения

### 1. Подача обращения
```
Гражданин → user.vadimevgrafov.ru → Форма обращения
  ↓
POST /api/appeals
  ↓
Сохранение в БД + Генерация tracking_number
  ↓
Автоматический запуск AI анализа
```

### 2. AI-анализ
```
POST /api/ai/analyze/:id
  ↓
GigaChat API анализирует текст
  ↓
Определяет:
  - Категорию (ЖКХ, дороги, благоустройство и т.д.)
  - Приоритет (критично, высокий, средний, низкий)
  - Тональность (позитивная, нейтральная, негативная, агрессивная)
  - Ключевые слова
  - Краткое резюме
  ↓
Сохранение результатов в appeal_analysis
```

### 3. Генерация предложенного ответа
```
POST /api/ai/generate-response/:id
  ↓
GigaChat использует:
  - Текст обращения
  - Результаты анализа
  - Базу знаний (knowledge_base)
  ↓
Генерирует готовый черновик ответа
  ↓
Возвращает оператору
```

### 4. Работа оператора
```
Оператор → operator.vadimevgrafov.ru
  ↓
Видит:
  - Список обращений с AI-анализом
  - Готовый черновик ответа
  ↓
Действия:
  - Просматривает/редактирует ответ
  - Отправляет ответ гражданину
  - Меняет статус обращения
  - Ведет переписку в чате
```

### 5. Переписка
```
Гражданин ←→ Оператор
  через WebSocket или Long Polling
  
История сохраняется в chat_messages
```

## Ключевые сценарии использования

### Сценарий 1: Жалоба на проблему
```
1. Гражданин подает жалобу: "Не горит фонарь на ул. Ленина, 25"
2. AI анализирует:
   - Категория: благоустройство
   - Приоритет: высокий (безопасность)
   - Тональность: негативная
3. AI генерирует ответ:
   "Спасибо за обращение. Передано в службу благоустройства..."
4. Оператор проверяет и отправляет ответ
5. Гражданин получает уведомление
```

### Сценарий 2: Информационный запрос
```
1. Гражданин спрашивает: "Как оформить льготы?"
2. AI анализирует:
   - Категория: социальная защита
   - Приоритет: средний
   - Тональность: нейтральная
3. AI находит в базе знаний инструкцию
4. Генерирует ответ с пошаговой инструкцией
5. Оператор добавляет ссылки и отправляет
```

### Сценарий 3: Благодарность
```
1. Гражданин пишет благодарность
2. AI определяет:
   - Категория: обратная связь
   - Приоритет: низкий
   - Тональность: позитивная
3. Генерирует вежливый ответ
4. Оператор отправляет
5. Статистика учитывает положительный отзыв
```

## Текущий статус реализации

### ✅ Реализовано
- База данных с полной схемой
- Backend API со всеми основными роутами
- GigaChat интеграция (анализ и генерация)
- Модели данных (Appeal, User, Category, Response, etc.)
- Контроллеры (Appeal, AI, Auth, Chat, File)
- Middleware (аутентификация, валидация, ошибки)
- Frontend базовая структура (React, TypeScript)
- Docker конфигурации для разработки

### ⏳ В процессе
- Подключение всех роутов к main index.ts
- Разделение frontend на 3 приложения (user, operator, admin)
- WebSocket для чата
- Административная панель базы знаний

### 📋 Требует реализации
- Production развертывание с поддоменами
- Nginx конфигурация для поддоменов
- SSL сертификаты (Let's Encrypt)
- Monitoring и logging (Prometheus, Grafana)
- Backup и восстановление БД
- CI/CD pipeline
- Тесты (unit, integration, e2e)
- Документация API (Swagger/OpenAPI)

## Следующие шаги

1. **Завершить backend интеграцию** - подключить все роуты
2. **Создать 3 frontend приложения** - разделить по ролям
3. **Реализовать real-time чат** - WebSocket или SSE
4. **Заполнить базу знаний** - добавить типовые ответы
5. **Настроить production** - Docker Compose с поддоменами
6. **Тестирование** - проверить все сценарии
7. **Мониторинг** - настроить логи и метрики
8. **Документация** - API docs и user guides

## Контакты и ресурсы

- **Production domains**:
  - User: https://user-smartsupport.vadimevgrafov.ru
  - Operator: https://operator-smartsupport.vadimevgrafov.ru
  - Admin: https://admin-smartsupport.vadimevgrafov.ru
  - API: https://api-smartsupport.vadimevgrafov.ru

- **Development**:
  - Backend: http://localhost:3001
  - Frontend User: http://localhost:3000
  - Frontend Operator: http://localhost:3002
  - Frontend Admin: http://localhost:3003

- **GigaChat**:
  - Auth endpoint: https://ngw.devices.sberbank.ru:9443/api/v2/oauth
  - API endpoint: https://gigachat.devices.sberbank.ru/

