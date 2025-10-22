
# 📘 Настройка персонального DevOps-окружения

> _Документ отражает этапы создания удобной, функциональной и безопасной среды DevOps-инженера на собственном сервере с доступом по SSH и доменом._

## 🗂️ Структура

0. Настройка Visual Studio Code для работы с проектом по через SSH
1. Подготовка окружения и структуры директорий  
2. Символические ссылки и алиасы  
3. Красивый prompt (Starship)  
4. Обратный прокси + HTTPS (nginx-proxy + Let's Encrypt)  
5. Развёртывание GitLab с HTTPS и приватной регистрацией  
6. Запуск сервисов Prometheus и Grafana  

## 🧑🏼‍💻 0. Настройка VS Code
- Устанавливаем расширение "Remote - SSH" из Extensions;
- Нажимаем Ctrl+Shift+P (для Мак) или иконку в нижнем левом углу, чтобы открыть командную палитру;
- Выбираем Connect to Host - Remote-SSH
- Если это первое подключение, нажми + Add New SSH Host...
- Вводим команду для подключения к серверу
- После подключения VS Code перезапустится в "удалённом контексте" — мы будем видеть файловую систему сервера.

## 🧱 1. Базовая структура директорий

```bash
/srv/
├── proxy/         # nginx-proxy + letsencrypt
├── monitoring/    # prometheus + grafana
│    ├── grafana/
│    └── prometheus/
├── gitlab/        # GitLab CE
├── landing/        # тут будет страница https://vadimevgrafov.ru
├── n8n/           # n8n
├── registry-proxy/ # proxy для Container Registry
├── logs/          # Журналы
├── projects/      # Исходники 
├── deploy/        # Папки для выкладки
```

## 🔗 2. Символические ссылки

```bash
ln -s /srv/projects ~/projects
ln -s /srv/deploy ~/deploy
ln -s /srv/logs ~/logs
ln -s /srv/proxy ~/proxy
ln -s /srv/gitlab ~/gitlab
ln -s /srv/monitoring ~/mon
ln -s /srv/n8n ~/n8n
ln -s /srv/landing ~/landing

```
- Посмотреть куда ссылается конкретная символическая ссылка можно так:
```bash
ls -l ~/projects
```

- Удалить символическую ссылку можно командой:
```bash
rm ~/projects
```

## ⚡ 3. Полезные алиасы

- Создаем `~/.bash_aliases` и добавляем в него:

```bash
# Docker
alias dps='docker ps'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'

# Быстрый переход
alias prom='cd ~/mon/prometheus && ls'
alias graf='cd ~/mon/grafana && ls'
alias proj='cd ~/projects && ls'
alias dep='cd ~/deploy && ls'
alias logs='cd ~/logs && ls'

# Сеть и порты
alias ports='ss -tuln'
alias myip='curl ifconfig.me'

# Git
alias gs='git status'
alias gl='git log --oneline --graph --all --decorate'
alias gp='git pull'
alias gpp='git push'

# Утилиты
alias cl='clear && journalctl -xe'
```
- Подключаем ~/.bash_aliases:
```bash
echo 'if [ -f ~/.bash_aliases ]; then . ~/.bash_aliases; fi' >> ~/.bashrc
source ~/.bashrc
```

## 💫 4. Установка и настройка Starship prompt

```bash
curl -sS https://starship.rs/install.sh | sh
```

Добавляем в конец `~/.bashrc` или `~/.zshrc` (в моем случае bashrc, узнать можно командой: echo $SHELL):

```bash
eval "$(starship init bash)"  # или zsh
```

Конфигурация `~/.config/starship.toml`:

```toml
[username]
show_always = true

[directory]
truncate_to_repo = false
```

## 🌐 5. Обратный прокси с HTTPS

В `/srv/proxy/docker-compose.yml` развёрнут стек:

- `nginx-proxy` — принимает все входящие запросы
- `acme-companion` — автоматически выпускает и обновляет Let's Encrypt-сертификаты

```yml
version: '3.8'

services:
  nginx-proxy:
    image: jwilder/nginx-proxy:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./certs:/etc/nginx/certs:ro
      - ./vhost.d:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
      - ./conf.d/client_max_body.conf:/etc/nginx/conf.d/client_max_body.conf
    labels:
      - com.github.nginx-proxy.nginx
    networks:
      - nginx-net
  letsencrypt:
    image: nginxproxy/acme-companion
    container_name: nginx-letsencrypt
    restart: unless-stopped
    environment:
      - DEFAULT_EMAIL=vadim@evgrafov.biz
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./certs:/etc/nginx/certs
      - ./vhost.d:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
    networks:
      - nginx-net

networks:
  nginx-net:
    name: nginx-net
    driver: bridge

```

Создана общая Docker-сеть `nginx-net`.

Добавлены DNS A-записи:

| Поддомен     | Назначение  |
|--------------|-------------|
| `grafana`    | Grafana     |
| `prometheus` | Prometheus  |
| `gitlab`     | GitLab      |
| `n8n`        | n8n         |


## 8. Установка n8n
- Путь: `/srv/n8n/docker-compose.yml`
- В n8n будут задействованы сервисы, недоступные из РФ, поэтому доступ к нему настроен через Xray по VPN.
```yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    depends_on:
      - xray
      - privoxy
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=*********
      - N8N_HOST=n8n.vadimevgrafov.ru
      - N8N_PORT=5678
      - VIRTUAL_HOST=n8n.vadimevgrafov.ru
      - LETSENCRYPT_HOST=n8n.vadimevgrafov.ru
      - LETSENCRYPT_EMAIL=admin@vadimevgrafov.ru
      - HTTP_PROXY=http://privoxy:8118
      - HTTPS_PROXY=http://privoxy:8118
      - NODE_TLS_REJECT_UNAUTHORIZED=0
    volumes:
      - ./n8n_data:/home/node/.n8n
    networks:
      - nginx-net
      - xray-net

  xray:
    image: teddysun/xray
    container_name: xray
    restart: unless-stopped
    volumes:
      - ./xray_config.json:/etc/xray/config.json
    networks:
      - xray-net
    expose:
      - "1080"

  privoxy:
    build: ./privoxy
    container_name: privoxy
    restart: unless-stopped
    networks:
      - xray-net
    expose:
      - "8118"

networks:
  nginx-net:
    external: true
  xray-net:
    driver: bridge


```
- Создание volume-папки и установка прав для нее:
```bash
mkdir -p /srv/n8n/n8n_data
sudo chown -R 1000:1000 /srv/n8n/n8n_data
```
- Запуск и проверка:
```bash
cd n8n
docker compose up -d
docker compose ps
```
- Обновление n8n:
```bash
docker compose down
docker pull n8nio/n8n
docker compose up -d
```

- Все сервисы работают в `nginx-net`, доступны по HTTPS:

 - https://prometheus.vadimevgrafov.ru
 - https://grafana.vadimevgrafov.ru
 - https://n8n.vadimevgrafov.ru

## 🔐 Безопасность

- Публичная регистрация в GitLab — отключена
- DNS-записи направлены только на нужные сервисы
- Все внешние сервисы работают через HTTPS
