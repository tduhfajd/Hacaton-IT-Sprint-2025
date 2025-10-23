#!/bin/bash

# Скрипт для настройки nginx vhosts для frontend поддоменов
# Запустите: sudo bash SETUP_NGINX_VHOSTS.sh

echo "🔧 Настройка nginx vhosts для Smart Assistant..."
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Пожалуйста, запустите скрипт с sudo:"
    echo "   sudo bash $0"
    exit 1
fi

# User Frontend vhost
cat > /srv/proxy/vhost.d/user-smartsupport.vadimevgrafov.ru << 'EOF'
location / {
    proxy_pass http://188.64.136.8:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
EOF

echo "✅ Создан vhost для user-smartsupport.vadimevgrafov.ru"

# Operator Frontend vhost
cat > /srv/proxy/vhost.d/operator-smartsupport.vadimevgrafov.ru << 'EOF'
location / {
    proxy_pass http://188.64.136.8:3003;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
EOF

echo "✅ Создан vhost для operator-smartsupport.vadimevgrafov.ru"

# Admin Frontend vhost
cat > /srv/proxy/vhost.d/admin-smartsupport.vadimevgrafov.ru << 'EOF'
location / {
    proxy_pass http://188.64.136.8:3004;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
EOF

echo "✅ Создан vhost для admin-smartsupport.vadimevgrafov.ru"

# Перезапуск nginx-proxy
echo ""
echo "🔄 Перезапуск nginx-proxy..."
cd /srv/proxy
docker-compose restart nginx-proxy

echo ""
echo "✅ Nginx vhosts настроены!"
echo ""
echo "🌐 Ваши поддомены теперь доступны:"
echo "   https://user-smartsupport.vadimevgrafov.ru"
echo "   https://operator-smartsupport.vadimevgrafov.ru"
echo "   https://admin-smartsupport.vadimevgrafov.ru"
echo ""
echo "🔒 SSL сертификаты Let's Encrypt будут автоматически выпущены через несколько минут"
echo ""

