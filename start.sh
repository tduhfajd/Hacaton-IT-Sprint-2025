#!/bin/bash

# SmartSupport - Единый скрипт запуска всей системы

set -e

echo "🚀 Starting SmartSupport System..."
echo ""

# Проверяем наличие .env.prod
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please create .env.prod with all required environment variables"
    exit 1
fi

# Останавливаем и удаляем старые контейнеры
echo "🧹 Cleaning up old containers..."
docker stop smart-support-backend smart-support-frontend-user smart-support-frontend-operator smart-support-frontend-admin smart-support-db smart-support-redis smart-support-rabbitmq smart-support-celery-worker smart-support-landing 2>/dev/null || true
docker rm smart-support-backend smart-support-frontend-user smart-support-frontend-operator smart-support-frontend-admin smart-support-db smart-support-redis smart-support-rabbitmq smart-support-celery-worker smart-support-landing 2>/dev/null || true

# Создаем volumes если не существуют
echo "📦 Creating volumes..."
docker volume create smart-support-db-data 2>/dev/null || true
docker volume create smart-support-redis-data 2>/dev/null || true
docker volume create smart-support-rabbitmq-data 2>/dev/null || true

# Проверяем наличие сети nginx-net
echo "🌐 Checking nginx-net network..."
if ! docker network inspect nginx-net >/dev/null 2>&1; then
    echo "❌ Error: nginx-net network does not exist!"
    echo "Please create it first: docker network create nginx-net"
    exit 1
fi

# Запускаем систему
echo "🎯 Starting all services..."
docker-compose --env-file .env.prod up -d --build

# Ждем готовности сервисов
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Проверяем статус
echo ""
echo "📊 Service Status:"
docker-compose --env-file .env.prod ps

echo ""
echo "✅ SmartSupport is starting up!"
echo ""
echo "🌍 Access points:"
echo "  - Landing:  https://smartsupport.vadimevgrafov.ru"
echo "  - User:     https://user-smartsupport.vadimevgrafov.ru"
echo "  - Operator: https://operator-smartsupport.vadimevgrafov.ru"
echo "  - Admin:    https://admin-smartsupport.vadimevgrafov.ru"
echo "  - API:      https://api-smartsupport.vadimevgrafov.ru"
echo "  - RabbitMQ: https://rabbitmq-smartsupport.vadimevgrafov.ru"
echo ""
echo "📝 Logs: docker-compose --env-file .env.prod logs -f"
echo "🛑 Stop: docker-compose --env-file .env.prod down"

