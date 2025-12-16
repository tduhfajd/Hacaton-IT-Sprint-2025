#!/bin/bash

# Скрипт для создания дампа базы данных PostgreSQL из Docker контейнера
# Использование: ./scripts/dump-database-docker.sh [OPTIONS]
#
# Опции:
#   -c, --container NAME    Имя контейнера (по умолчанию: smart-support-db)
#   -U, --user USER         Пользователь базы данных (по умолчанию: postgres)
#   -d, --database DB       Имя базы данных (по умолчанию: smart_support)
#   -o, --output FILE       Имя выходного файла (по умолчанию: dump_YYYYMMDD_HHMMSS.backup)
#   --help                  Показать эту справку
#
# Примеры:
#   ./scripts/dump-database-docker.sh
#   ./scripts/dump-database-docker.sh -c my-db-container -d mydb -o mydump.backup

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Значения по умолчанию
CONTAINER_NAME="${DB_CONTAINER:-smart-support-db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-smart_support}"
OUTPUT_FILE=""

# Функция для вывода справки
show_help() {
    cat << EOF
Скрипт для создания дампа базы данных PostgreSQL из Docker контейнера

Использование: $0 [OPTIONS]

Опции:
  -c, --container NAME    Имя контейнера (по умолчанию: smart-support-db или \$DB_CONTAINER)
  -U, --user USER         Пользователь базы данных (по умолчанию: postgres или \$POSTGRES_USER)
  -d, --database DB       Имя базы данных (по умолчанию: smart_support или \$POSTGRES_DB)
  -o, --output FILE       Имя выходного файла (по умолчанию: dump_YYYYMMDD_HHMMSS.backup)
  --help                  Показать эту справку

Переменные окружения:
  DB_CONTAINER             Имя Docker контейнера
  POSTGRES_USER            Пользователь базы данных
  POSTGRES_DB              Имя базы данных

Примеры:
  # Использование с параметрами по умолчанию
  $0

  # С указанием контейнера и базы данных
  $0 -c my-db-container -d mydb

  # С указанием выходного файла
  $0 -o mydump.backup

  # Использование с переменными окружения
  export DB_CONTAINER=my-db
  export POSTGRES_USER=admin
  export POSTGRES_DB=mydb
  $0
EOF
}

# Парсинг аргументов командной строки
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--container)
            CONTAINER_NAME="$2"
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

# Проверка наличия docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Ошибка: docker не найден. Установите Docker.${NC}" >&2
    exit 1
fi

# Проверка существования контейнера
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Ошибка: Контейнер '$CONTAINER_NAME' не найден.${NC}" >&2
    echo "Доступные контейнеры:"
    docker ps -a --format '  - {{.Names}}'
    exit 1
fi

# Проверка, запущен ли контейнер
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Предупреждение: Контейнер '$CONTAINER_NAME' не запущен.${NC}"
    read -p "Запустить контейнер? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker start "$CONTAINER_NAME"
        echo "Ожидание готовности контейнера..."
        sleep 3
    else
        echo "Операция отменена."
        exit 0
    fi
fi

# Вывод информации о подключении
echo -e "${GREEN}=== Создание дампа базы данных из Docker контейнера ===${NC}"
echo "Контейнер:   $CONTAINER_NAME"
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
if docker exec "$CONTAINER_NAME" pg_dump -Fc -U "$DB_USER" -d "$DB_NAME" > "$OUTPUT_FILE"; then
    # Получение размера файла
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}✓ Дамп успешно создан!${NC}"
    echo "Файл: $OUTPUT_FILE"
    echo "Размер: $FILE_SIZE"
    echo ""
    echo "Для восстановления используйте:"
    echo "  docker exec -i $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME -c < $OUTPUT_FILE"
    echo "или"
    echo "  cat $OUTPUT_FILE | docker exec -i $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME -c"
else
    echo -e "${RED}✗ Ошибка при создании дампа!${NC}" >&2
    exit 1
fi

