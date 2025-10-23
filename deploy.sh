#!/bin/bash

# Smart Assistant Production Deployment Script
# This script deploys the application to production with subdomains

set -e

echo "🚀 Starting Production Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if nginx-net exists
echo "📡 Checking nginx-net network..."
if ! docker network inspect nginx-net >/dev/null 2>&1; then
    echo -e "${RED}❌ nginx-net network does not exist!${NC}"
    echo "Please create it first: docker network create nginx-net"
    exit 1
fi
echo -e "${GREEN}✅ nginx-net network exists${NC}"
echo ""

# Create .env files from examples if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f ".env.production" ]; then
    echo "Creating .env.production from example..."
    cp env.production.example .env.production
    echo -e "${YELLOW}⚠️  Please edit .env.production with your actual credentials!${NC}"
fi

for dir in frontend/user frontend/operator frontend/admin; do
    if [ ! -f "$dir/.env.production" ]; then
        echo "Creating $dir/.env.production from example..."
        cp "$dir/env.production.example" "$dir/.env.production"
    fi
done

echo -e "${GREEN}✅ Environment files ready${NC}"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Existing containers stopped${NC}"
echo ""

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.production.yml build --no-cache

echo ""
echo "🚀 Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🔍 Health Check:"
echo ""

# Wait for backend to be healthy
echo "Checking backend health..."
for i in {1..30}; do
    if docker exec smart-support-backend node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; then
        echo -e "${GREEN}✅ Backend is healthy!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend health check failed after 30 attempts${NC}"
        echo "Check logs: docker-compose -f docker-compose.production.yml logs backend"
        exit 1
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📍 Your services should be available at:"
echo "   🌐 User Interface:      https://user-smartsupport.vadimevgrafov.ru"
echo "   👔 Operator Dashboard:  https://operator-smartsupport.vadimevgrafov.ru"
echo "   ⚙️  Admin Panel:         https://admin-smartsupport.vadimevgrafov.ru"
echo "   🔌 API:                 https://api-smartsupport.vadimevgrafov.ru"
echo "   📚 Documentation:       https://docs-smartsupport.vadimevgrafov.ru"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose -f docker-compose.production.yml logs -f [service]"
echo "   Stop all:     docker-compose -f docker-compose.production.yml down"
echo "   Restart:      docker-compose -f docker-compose.production.yml restart [service]"
echo ""
echo "🔐 Note: SSL certificates will be automatically issued by Let's Encrypt"
echo "   This may take a few minutes on first deployment."
echo ""

