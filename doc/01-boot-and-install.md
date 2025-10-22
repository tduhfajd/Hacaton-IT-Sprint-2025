# 🧑‍💻 Установка Ubuntu и базовая настройка сервера

## 📌 Цель

Развернуть сервер на мини-ПК под управлением Ubuntu Server 22.04 LTS, установить базовое ПО и подготовить среду для развёртывания GitLab и веб-приложения.

---

### 🔧 Этап 1: Создание загрузочной флешки с Ubuntu

**ОС, с которой работал:** macOS Sequoia 15.4.1  
**Инструмент:** Balena Etcher  
**ISO-образ:** `ubuntu-22.04.4-live-server-amd64.iso`

**Шаги:**
1. Скачал образ Ubuntu с [releases.ubuntu.com](https://releases.ubuntu.com/22.04/)
2. Установил [Balena Etcher](https://etcher.io)
3. Выбрал образ и флешку → Нажал Flash
4. Проверил, что флешка загрузочная

---

### 🔧 Этап 2: Установка Ubuntu на мини-ПК

**Процессор:** Intel N100  
**ОЗУ / SSD:** 16 ГБ / 512 ГБ  
**Действия:**
1. Подключил флешку, включил ПК
2. Зашёл в BIOS, выставил загрузку с USB
3. Установил Ubuntu Server с настройками по умолчанию
4. Задал hostname: `pet`
5. Создал пользователя: `macadamm`
6. Перезагрузился, удалил флешку

---

### 🔧 Этап 3: Подключение к серверу по SSH

**Сервер:** определяем ip  
**Команда:**

```bash
ip a  # нашёл IP, например: 192.168.1.148
ssh 
```
**Mac:** подключаюсь по ssh  
**Команда:**

```bash
ssh macadamm@192.168.1.148
```

✅ Успешно подключился из локальной сети с macOS по SSH

---

### 🔧 Этап 4: Базовая настройка Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git htop ufw unzip
```

✅ Базовые пакеты установлены успешно

---

### 🔧 Этап 5: Настройка доступа по SSH ключу

**Mac:** создание и копирование SSH ключа  
**Команда:**

```bash
ssh-keygen -t ed25519 # генерация ключа, если ранее не создавался
cat ~/.ssh/id_ed25519.pub # копируем выведенное значение ключа

```

**Сервер:** добавляем публичный ключ Mac  
**Команда:**

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys # Вставь туда содержимое id_ed25519.pub сохраняем и выходим
chmod 600 ~/.ssh/authorized_keys # устанавливаем права на чтение и запись только для владельца


```

✅ Доступ по SSH успешно настроен

---

### 🔐 Этап 6: Отключение доступа по паролю. Элемент безопасности

**Сервер:**   
**Команда:**

1. Открываем файл конфигурации SSH:
```bash
sudo nano /etc/ssh/sshd_config
```

2. Находим (или добавляем) строку и меняем yes на no и убираем # в начале строки:

```
PasswordAuthentication no
```

3. Сохраняем файл и перезапускаем SSH:

```bash
sudo systemctl restart ssh
```

✅ Успешно отключили доступ по паролю

---

### 🔐 Этап 7: Базовая настройка фаервола. Элемент безопасности

**Сервер:**   
**Команда:**

1. Разрещаем SSH:
```bash
sudo ufw allow OpenSSH
```

2. Разрешаем веб-доступ (для сайтов и GitLab)

```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 2224/tcp      # SSH Gitlab

```

3. Включаем фаервол:

```bash
sudo ufw enable

```

4. Включаем фаервол:

```bash
sudo ufw status verbose

```

✅ Успешно включили фаервол

---

### 🔧 Этап 8: Проброс портов для доступа к серверу из интернета.  

**Роутер:** 

##### Пробросим следующие порты:

| Назначение           | Внешний порт | Внутренний порт | Протокол | Комментарий                           |
|----------------------|--------------|------------------|----------|---------------------------------------|
| SSH доступ           | `2222`       | `22`             | TCP      | Для подключения к серверу            |
| GitLab SSH           | `2224`       | `2224`           | TCP      | Для `git clone` в GitLab             |
| HTTP (веб-приложения)| `80`         | `80`             | TCP      | Для сайта и GitLab                   |
| HTTPS                | `443`        | `443`            | TCP      | Защищённый доступ к сайтам/GitLab    |


**Mac:** Настройка SSH-конфига  
**Команда:**

Создадим (или отредактируем) файл `~/.ssh/config` на Mac:

```bash
nano ~/.ssh/config
```

Добавим туда:

```bash
Host pet-server
  HostName 188.64.136.8
  Port 2222
  User macadamm
```

Теперь подключение супер-простое:

```bash
ssh pet-server
```

✅ Успешно добавили к серверу доступ из интернета

---

### 🔧 Этап 9: Установка Docker и Docker Compose на сервер Ubuntu — это базовый инструмент для всего проекта.

---

#### 🐳 Установка Docker на Ubuntu 22.04 / 24.04

1. **Обновим систему:**

```bash
sudo apt update && sudo apt upgrade -y
```

2. **Установим нужные зависимости:**

```bash
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

3. **Добавим ключ репозитория Docker:**

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

4. **Добавим репозиторий Docker:**

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

5. **Установим Docker Engine:**

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
```

6. **Проверьим, что Docker работает:**

```bash
sudo docker run hello-world
```

---

#### 🧩 Установка Docker Compose (v2, как плагин)

```bash
sudo apt install docker-compose-plugin -y
```

Проверь:

```bash
docker compose version
```

---

#### 👤 (Опционально) Добавлю себя в группу `docker`

Чтобы не писать `sudo` каждый раз:

```bash
sudo usermod -aG docker $USER
```

🔁 После этого необходимо выйти и снова зайти в сессию (`exit` и заново SSH).

✅ Docker и Docker Compose успешно установлены на сервер.

---
