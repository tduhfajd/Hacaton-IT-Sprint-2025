#!/bin/bash

# Скрипт для создания дампа базы данных PostgreSQL
# Использование: ./scripts/dump-database.sh [OPTIONS]
#
# Опции:
#   -h, --host HOST          Хост базы данных (по умолчанию: localhost)
#   -U, --user USER          Пользователь базы данных (по умолчанию: postgres)
#   -d, --database DB        Имя базы данных (по умолчанию: smart_support)
#   -o, --output FILE        Имя выходного файла (по умолчанию: dump_YYYYMMDD_HHMMSS.backup)
#   -p, --port PORT          Порт базы данных (по умолчанию: 5432)
#   --help                   Показать эту справку
#
# Примеры:
#   ./scripts/dump-database.sh -h old-server.example.com -U postgres -d smart_support
#   ./scripts/dump-database.sh --host 192.168.1.100 --user admin --database mydb --output mydump.backup

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Значения по умолчанию
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-smart_support}"
DB_PORT="${DB_PORT:-5432}"
OUTPUT_FILE=""

# Функция для вывода справки
show_help() {
    cat << EOF
Скрипт для создания дампа базы данных PostgreSQL

Использование: $0 [OPTIONS]

Опции:
  -h, --host HOST          Хост базы данных (по умолчанию: localhost или \$DB_HOST)
  -U, --user USER          Пользователь базы данных (по умолчанию: postgres или \$POSTGRES_USER)
  -d, --database DB        Имя базы данных (по умолчанию: smart_support или \$POSTGRES_DB)
  -o, --output FILE        Имя выходного файла (по умолчанию: dump_YYYYMMDD_HHMMSS.backup)
  -p, --port PORT          Порт базы данных (по умолчанию: 5432 или \$DB_PORT)
  --help                   Показать эту справку

Переменные окружения:
  DB_HOST                  Хост базы данных
  POSTGRES_USER            Пользователь базы данных
  POSTGRES_DB              Имя базы данных
  DB_PORT                  Порт базы данных
  PGPASSWORD               Пароль для подключения (если не указан, будет запрошен)

Примеры:
  # Использование с параметрами командной строки
  $0 -h old-server.example.com -U postgres -d smart_support

  # Использование с переменными окружения
  export DB_HOST=old-server.example.com
  export POSTGRES_USER=postgres
  export POSTGRES_DB=smart_support
  export PGPASSWORD=your_password
  $0

  # С указанием выходного файла
  $0 -h 192.168.1.100 -U admin -d mydb -o mydump.backup

  # Для Docker контейнера
  docker exec smart-support-db pg_dump -Fc -U postgres smart_support > dump.backup
EOF
}

# Парсинг аргументов командной строки
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -U|--user)
            DB_USER="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -p|--port)
            DB_PORT="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Ошибка: Неизвестный параметр: $1${NC}" >&2
            echo "Используйте --help для справки"
            exit 1
            ;;
    esac
done

# Генерация имени файла, если не указано
if [ -z "$OUTPUT_FILE" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    OUTPUT_FILE="dump_${DB_NAME}_${TIMESTAMP}.backup"
fi

# Проверка наличия pg_dump
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}Ошибка: pg_dump не найден. Установите PostgreSQL client.${NC}" >&2
    echo "Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "CentOS/RHEL: sudo yum install postgresql"
    exit 1
fi

# Вывод информации о подключении
echo -e "${GREEN}=== Создание дампа базы данных ===${NC}"
echo "Хост:        $DB_HOST"
echo "Порт:        $DB_PORT"
echo "Пользователь: $DB_USER"
echo "База данных: $DB_NAME"
echo "Выходной файл: $OUTPUT_FILE"
echo ""

# Проверка, существует ли файл
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}Предупреждение: Файл $OUTPUT_FILE уже существует.${NC}"
    read -p "Перезаписать? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Операция отменена."
        exit 0
    fi
fi

# Создание дампа
echo -e "${GREEN}Создание дампа...${NC}"
if pg_dump -Fc -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$OUTPUT_FILE"; then
    # Получение размера файла
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}✓ Дамп успешно создан!${NC}"
    echo "Файл: $OUTPUT_FILE"
    echo "Размер: $FILE_SIZE"
    echo ""
    echo "Для восстановления используйте:"
    echo "  pg_restore -h <host> -U <user> -d <database> -c $OUTPUT_FILE"
else
    echo -e "${RED}✗ Ошибка при создании дампа!${NC}" >&2
    exit 1
fi

