# 🚀 SmartSupport - Быстрый старт

## 📋 Что это?

**SmartSupport** - интеллектуальная система обработки обращений с ИИ-анализом и Telegram интеграцией.

## 🎯 Основные возможности

- 💬 **Два канала связи**: Web-интерфейс + Telegram бот
- 🤖 **ИИ-помощник**: автоматический анализ и генерация ответов (GigaChat)
- 🔄 **Умные статусы**: автоматическое управление жизненным циклом обращений
- ⏱️ **Автозавершение**: неактивные диалоги закрываются через 5 минут
- 📚 **База знаний**: поиск по всей БЗ с ранжированием релевантности

## 🚀 Запуск за 3 шаги

### 1. Настройка

```bash
cd it-support
cp .env.prod.example .env.prod
# Отредактируйте .env.prod (укажите GigaChat API ключи, Telegram токен)
```

### 2. Запуск

```bash
docker-compose --env-file .env.prod up -d
```

### 3. Проверка

```bash
docker ps
# Должно быть запущено 11 контейнеров
```

## 🌐 Доступ к интерфейсам

| Интерфейс | URL | Авторизация |
|-----------|-----|-------------|
| **Landing** | https://smartsupport.vadimevgrafov.ru | - |
| **Пользователи** | https://user-smartsupport.vadimevgrafov.ru | - |
| **Операторы** | https://operator-smartsupport.vadimevgrafov.ru | Без авторизации (тестирование) |
| **Администраторы** | https://admin-smartsupport.vadimevgrafov.ru | admin / admin |
| **API** | https://api-smartsupport.vadimevgrafov.ru | - |

## 📱 Telegram бот

1. Получите токен бота у @BotFather
2. Укажите его в `.env.prod` (`TELEGRAM_BOT_TOKEN`)
3. Перезапустите backend: `docker-compose --env-file .env.prod restart backend`

## 🔄 Жизненный цикл обращения

```
📝 Создание → 🤖 ИИ-анализ → 💬 Диалог с оператором → ✅ Завершение
   ↓              ↓                  ↓                      ↓
Web/Telegram   Приоритет         Автозакрытие         5 мин или вручную
              Тональность         чата после          + уведомление
              Категория           ответа              в Telegram
              ИИ-ответ            оператора
```

## 📊 Управление статусами

| Событие | Переход статуса | Визуальный эффект |
|---------|-----------------|-------------------|
| Оператор открыл | `Новое` → `В работе` | - |
| Оператор ответил | остаётся `В работе` | Чат закрывается |
| Гражданин ответил | `В работе` → `Новое` | Бейдж 🔴 |
| 5 мин неактивности | `В работе` → `Завершено` | + уведомление |

## 🛠️ Полезные команды

```bash
# Просмотр логов
docker-compose --env-file .env.prod logs -f backend
docker-compose --env-file .env.prod logs -f celery-worker

# Перезапуск сервисов
docker-compose --env-file .env.prod restart backend
docker-compose --env-file .env.prod restart celery-worker celery-beat

# Остановка
docker-compose --env-file .env.prod down

# Полная переборка (при изменении кода)
docker-compose --env-file .env.prod build --no-cache
docker-compose --env-file .env.prod up -d
```

## 🧪 Тестирование

### Через Web

1. Откройте https://user-smartsupport.vadimevgrafov.ru
2. Заполните форму и отправьте
3. Откройте https://operator-smartsupport.vadimevgrafov.ru
4. Увидите обращение с ИИ-рекомендацией
5. Ответьте → чат закроется автоматически

### Через Telegram

1. Найдите бота по токену
2. `/start` → выберите категорию → опишите проблему
3. В панели оператора увидите обращение из Telegram
4. Ответьте в панели → ответ придёт в Telegram

## 🐛 Решение проблем

### Обращения не появляются

```bash
# Проверьте логи backend
docker logs smart-support-backend --tail 50

# Проверьте подключение к БД
docker-compose --env-file .env.prod ps db
```

### ИИ не генерирует ответы

```bash
# Проверьте Celery Worker
docker logs smart-support-celery-worker --tail 50

# Проверьте GigaChat API ключи в .env.prod
grep GIGACHAT .env.prod
```

### Telegram бот не отвечает

```bash
# Проверьте токен
grep TELEGRAM_BOT_TOKEN .env.prod

# Проверьте логи backend
docker logs smart-support-backend | grep -i telegram
```

### Диалог не закрывается автоматически

```bash
# Проверьте что PWA отключён в браузере
# Откройте DevTools → Application → Service Workers → Unregister

# Или используйте режим инкогнито
```

## 📚 Больше информации

- **Полная документация**: `README.md`
- **API документация**: https://api-smartsupport.vadimevgrafov.ru/api-docs
- **Отчёт о тестировании**: `TESTING_REPORT.md`

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи контейнеров
2. Убедитесь, что все 11 контейнеров запущены
3. Проверьте переменные окружения в `.env.prod`
4. См. раздел "Решение проблем" выше

---

**SmartSupport** - Разработано командой КИТВ для ИТ-Спринт 2025 🚀

