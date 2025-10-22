# Smart Assistant for Citizen Appeals

Интеллектуальная система для обработки обращений граждан с использованием искусственного интеллекта GigaChat для быстрого и качественного обслуживания.

## 🚀 Возможности

- **Подача обращений**: Простая и удобная форма для граждан
- **ИИ-анализ**: Автоматическая категоризация, приоритизация и анализ тональности
- **Панель оператора**: Управление обращениями с предложениями ИИ
- **База знаний**: Административная панель для управления знаниями
- **Реальное время**: Чат между гражданами и операторами
- **Аналитика**: Мониторинг и статистика системы
- **PWA**: Прогрессивное веб-приложение для мобильных устройств

## 🏗️ Архитектура

### Технологический стек

**Backend:**
- Node.js 18+ с TypeScript
- Express.js для API
- PostgreSQL 15 для данных
- Redis 7 для кэширования
- GigaChat API для ИИ-анализа

**Frontend:**
- React 18 с TypeScript
- Tailwind CSS для стилизации
- Vite для сборки
- PWA возможности

**DevOps:**
- Docker & Docker Compose
- Nginx для прокси
- GitHub Actions для CI/CD

### Структура проекта

```
smart-assistant/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # API контроллеры
│   │   ├── services/        # Бизнес-логика
│   │   ├── models/          # Модели данных
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API маршруты
│   │   └── config/          # Конфигурация
│   ├── tests/               # Тесты
│   └── Dockerfile
├── frontend/                # Frontend приложение
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы
│   │   ├── services/        # API сервисы
│   │   └── styles/          # Стили
│   └── Dockerfile
├── database/                # База данных
│   ├── init/                # Инициализация
│   └── migrations/          # Миграции
├── nginx/                   # Nginx конфигурация
├── docker-compose.yml       # Docker Compose
└── .github/workflows/       # CI/CD
```

## 🚀 Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- Git

### Установка

1. **Клонирование репозитория:**
```bash
git clone <repository-url>
cd smart-assistant
```

2. **Настройка окружения:**
```bash
# Скопируйте файлы конфигурации
cp backend/.env.example backend/.env
cp .env.example .env

# Отредактируйте переменные окружения
nano backend/.env
```

3. **Запуск с Docker Compose:**
```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

4. **Доступ к приложению:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### Локальная разработка

1. **Backend:**
```bash
cd backend
npm install
npm run dev
```

2. **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

3. **База данных:**
```bash
# Запуск только БД и Redis
docker-compose up -d postgres redis
```

## 🔧 Конфигурация

### Переменные окружения

Основные переменные для настройки:

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_assistant
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379

# GigaChat API
GIGACHAT_CLIENT_ID=your-client-id
GIGACHAT_AUTH_KEY=your-auth-key
GIGACHAT_AUTH_ENDPOINT=https://ngw.devices.sberbank.ru:9443/api/v2/oauth
GIGACHAT_API_ENDPOINT=https://gigachat.devices.sberbank.ru/

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Сертификаты Министерства цифрового развития

Для работы с GigaChat API необходимо установить сертификаты:

```bash
# Создание директории для сертификатов
sudo mkdir -p /usr/local/share/ca-certificates/mindigital

# Копирование сертификатов
sudo cp mindigital-certs/*.crt /usr/local/share/ca-certificates/mindigital/

# Обновление сертификатов
sudo update-ca-certificates
```

## 🧪 Тестирование

### Backend тесты
```bash
cd backend
npm test                    # Запуск тестов
npm run test:coverage      # С покрытием
npm run test:watch         # В режиме наблюдения
```

### Frontend тесты
```bash
cd frontend
npm test                   # Запуск тестов
npm run test:coverage      # С покрытием
```

### E2E тесты
```bash
npm run test:e2e           # End-to-end тесты
```

## 📦 Сборка для продакшена

### Docker образы
```bash
# Backend
docker build -t smart-assistant-backend ./backend

# Frontend
docker build -t smart-assistant-frontend ./frontend
```

### Продакшен развертывание
```bash
# Использование продакшен конфигурации
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Мониторинг

### Логи
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Метрики
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (если настроена)

### Health checks
- Backend: http://localhost:3001/api/health
- Frontend: http://localhost:3000

## 🛠️ Разработка

### Структура задач

Проект использует структурированный подход к разработке:

1. **Спецификация** (`specs/`) - Описание требований
2. **Планирование** (`plan.md`) - Техническое планирование
3. **Задачи** (`tasks.md`) - Детальный план реализации
4. **Реализация** - Код и тесты

### Git workflow

```bash
# Создание feature ветки
git checkout -b feature/new-feature

# Коммит изменений
git add .
git commit -m "feat: add new feature"

# Push и создание PR
git push origin feature/new-feature
```

### Code style

Проект использует:
- **ESLint** для линтинга
- **Prettier** для форматирования
- **TypeScript** для типизации

```bash
# Проверка стиля
npm run lint

# Автоисправление
npm run lint:fix

# Форматирование
npm run format
```

## 📚 API Документация

### Основные эндпоинты

- `GET /api/health` - Проверка здоровья
- `POST /api/auth/login` - Авторизация
- `GET /api/appeals` - Список обращений
- `POST /api/appeals` - Создание обращения
- `GET /api/appeals/:id` - Детали обращения

### Аутентификация

API использует JWT токены:

```bash
# Получение токена
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Использование токена
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/appeals
```

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте feature ветку
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 📞 Поддержка

- Email: support@vadimevgrafov.ru
- Документация: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🗺️ Roadmap

- [ ] Интеграция с внешними системами
- [ ] Мобильное приложение
- [ ] Расширенная аналитика
- [ ] Многоязычность
- [ ] API для внешних разработчиков

---

**Smart Assistant for Citizen Appeals** - Современное решение для эффективной работы с обращениями граждан.