# Migration 009: Make Email Nullable

## Проблема
При создании обращения без email система пыталась вставить `NULL` в поле `users.email`, которое было определено как `NOT NULL`. Это приводило к ошибке `500 Internal Server Error`.

## Решение
Изменили поле `email` в таблице `users`, чтобы разрешить `NULL` значения.

## SQL команда
```sql
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

## Применение миграции
```bash
docker exec smart-support-db psql -U postgres -d smart_support -c "ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"
```

## Результат
- Поле `email` теперь может быть `NULL`
- UNIQUE constraint остается активным (PostgreSQL позволяет множественные NULL для UNIQUE полей)
- Пользователи могут создавать обращения без указания email
- Каждый пользователь без email создается как отдельная запись (нет дедупликации)

## Дата применения
27.10.2025

## Связанные изменения
- `backend/src/controllers/AppealController.ts`: логика создания пользователей с email = NULL
- `frontend/operator/src/components/ChatWindow.tsx`: скрытие поля Email если оно NULL или guest-email

