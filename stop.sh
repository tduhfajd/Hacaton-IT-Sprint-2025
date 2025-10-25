#!/bin/bash

# SmartSupport - Скрипт остановки системы

set -e

echo "🛑 Stopping SmartSupport System..."
echo ""

cd "$(dirname "$0")"

# Останавливаем через docker-compose
if [ -f docker-compose.yml ]; then
    docker-compose --env-file .env.prod down
fi

echo ""
echo "✅ SmartSupport stopped successfully!"

