# 📊 Мониторинг Smart Support

## ✅ Установлено и настроено

Система мониторинга на базе **Prometheus + Grafana** с уведомлениями в **Telegram**.

### 🛠️ Компоненты:

1. **Prometheus** - сбор метрик
   - URL: https://prometheus.vadimevgrafov.ru
   - Порт: 9090 (внутри Docker сети)

2. **Grafana** - визуализация и алерты
   - URL: https://grafana.vadimevgrafov.ru
   - Логин: `admin` / Пароль: `admin`
   - ⚠️ Рекомендуется сменить пароль!

3. **Node Exporter** - метрики системы
   - CPU, RAM, Disk, Network

4. **cAdvisor** - метрики Docker контейнеров
   - Статус контейнеров, использование ресурсов

---

## 🚨 Активные алерты (4 шт.)

### 🔴 Критичные алерты:

1. **Backend Container Down**
   - Условие: Контейнер `smart-support-backend` остановлен
   - Задержка: 2 минуты
   - Действие: Проверьте `docker ps` и логи контейнера

2. **Critical Disk Usage**
   - Условие: Диск заполнен > 90%
   - Задержка: 1 минута
   - Действие: Срочно освободите место (логи, docker system prune)

### 🟡 Предупреждающие алерты:

3. **High CPU Usage**
   - Условие: CPU > 80% в течение 5 минут
   - Действие: Проверьте `htop` или `docker stats`

4. **High Memory Usage**
   - Условие: RAM > 85% в течение 5 минут
   - Действие: Проверьте `free -h` или перезапустите контейнеры

---

## 📱 Telegram уведомления

- **Бот:** @smart_support_altrts_bot
- **Chat ID:** 242942609
- Все алерты отправляются автоматически в Telegram

### Формат уведомлений:

```
🔴 [FIRING] Smart Support Backend Container Down
Backend контейнер Smart Support не работает!
Started: 2025-10-29 18:45:00
```

---

## 🎯 Как использовать

### 1. Просмотр метрик в Grafana:
1. Откройте https://grafana.vadimevgrafov.ru
2. Войдите: `admin` / `admin`
3. Перейдите в **Alerting → Alert rules**
4. Создайте дашборды с графиками (CPU, RAM, Docker контейнеры)

### 2. Просмотр алертов:
- **Grafana:** https://grafana.vadimevgrafov.ru/alerting/list
- **Telegram:** автоматически приходят уведомления

### 3. Добавление новых алертов:

**Через Grafana UI:**
1. Alerting → Alert rules → New alert rule
2. Выберите Prometheus как data source
3. Напишите PromQL запрос
4. Настройте условия и Telegram contact point

**Через API (пример):**
```bash
curl -X POST -H "Content-Type: application/json" \
  -u admin:admin \
  -d '{
    "uid": "my_alert",
    "title": "My Alert",
    "condition": "A",
    "data": [{
      "refId": "A",
      "datasourceUid": "<DS_UID>",
      "model": {
        "expr": "up{job=\"prometheus\"} == 0"
      }
    }],
    "for": "1m"
  }' \
  https://grafana.vadimevgrafov.ru/api/v1/provisioning/alert-rules
```

---

## 🔧 Управление

### Перезапуск мониторинга:
```bash
cd /srv/monitoring
echo 'zdvivw7h' | sudo -S docker-compose restart
```

### Просмотр логов:
```bash
docker logs prometheus
docker logs grafana
docker logs node-exporter
docker logs cadvisor
```

### Проверка метрик:
```bash
# Все targets
curl -s http://localhost:9090/api/v1/targets | jq

# Метрики CPU
docker exec prometheus wget -q -O- \
  'http://localhost:9090/api/v1/query?query=node_cpu_seconds_total'
```

---

## 📊 Полезные PromQL запросы

### Использование CPU:
```promql
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### Использование RAM:
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

### Использование Disk:
```promql
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes)) * 100
```

### Статус контейнеров:
```promql
container_last_seen{name=~"smart-support.*"}
```

### Docker контейнеры (CPU):
```promql
rate(container_cpu_usage_seconds_total{name=~"smart-support.*"}[5m]) * 100
```

---

## 🎨 Рекомендуемые дашборды Grafana

Импортируйте готовые дашборды:

1. **Node Exporter Full** - ID: `1860`
   - Полная информация о системе

2. **Docker Container & Host Metrics** - ID: `179`
   - Метрики Docker контейнеров

3. **Prometheus 2.0 Stats** - ID: `3662`
   - Статистика Prometheus

**Как импортировать:**
1. Grafana → Dashboards → Import
2. Введите ID дашборда
3. Выберите Prometheus data source
4. Load

---

## 🛡️ Безопасность

⚠️ **Важно:**
- Смените пароль Grafana: `admin` → Settings → Change Password
- Telegram бот токен хранится в `/tmp/setup_grafana_alerts.sh`
- Prometheus и Grafana доступны через HTTPS с Let's Encrypt

---

## 📞 Troubleshooting

### Алерты не приходят в Telegram:

1. Проверьте contact point:
```bash
docker exec grafana curl -s -u admin:admin \
  http://localhost:3000/api/v1/provisioning/contact-points
```

2. Отправьте тестовое сообщение:
```bash
curl -X POST \
  "https://api.telegram.org/bot8317768797:AAGmZF1pblCmTl8huo1mlT_6vzq_NESfrV8/sendMessage" \
  -d "chat_id=242942609" \
  -d "text=Test"
```

### Prometheus не собирает метрики:

```bash
docker exec prometheus wget -q -O- http://localhost:9090/api/v1/targets
```

Если target `down` → проверьте сеть:
```bash
docker network inspect nginx-net
```

### Grafana не запускается:

```bash
docker logs grafana --tail 50
echo 'zdvivw7h' | sudo -S chown -R 472:472 /srv/monitoring/grafana
docker restart grafana
```

---

## 📁 Файлы конфигурации

- **Docker Compose:** `/srv/monitoring/docker-compose.yml`
- **Prometheus:** `/srv/monitoring/prometheus/config/prometheus.yml`
- **Grafana Data:** `/srv/monitoring/grafana/`

---

## 🚀 Дальнейшие улучшения

1. **Добавить PostgreSQL exporter** для мониторинга БД
2. **Настроить RabbitMQ monitoring** для очередей Celery
3. **Создать дашборды** для Smart Support метрик
4. **Добавить retention policy** для экономии места (по умолчанию 15 дней)
5. **Настроить backup** Grafana дашбордов

---

**Дата настройки:** 2025-10-29  
**Версия:** 1.0

