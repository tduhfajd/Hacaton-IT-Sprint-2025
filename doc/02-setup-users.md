

# 🧑‍💻 Настройка пользователей и групп для проектной команды

## 📌 Цель
 Создать структуру учётных записей, имитирующую настоящую команду: с ролями, доступами и правами.

---

## ✅ Роли и группы

| Роль         | Пользователь | Группа       | Права                        |
|--------------|---------------|--------------|------------------------------|
| Тимлид       | `teamlead`    | `teamleads`  | `sudo`, доступ ко всем данным |
| DevOps       | `devops`      | `devops`     | `sudo`, деплой, CI/CD        |
| Разработчик  | `developer`   | `developers` | код, тестовый запуск         |
| Тестировщик  | `tester`      | `testers`    | чтение логов, тесты          |
| Гость        | `guest`       | `guests`     | просмотр, ограниченный доступ|

---

## 🛠 Шаг 1: создание групп

```bash
sudo addgroup teamleads
sudo addgroup devops
sudo addgroup developers
sudo addgroup testers
sudo addgroup guests
```

---

## 👤 Шаг 2: создание пользователей

```bash
sudo adduser teamlead --ingroup teamleads
sudo adduser devops --ingroup devops
sudo adduser developer --ingroup developers
sudo adduser tester --ingroup testers
sudo adduser guest --ingroup guests
```

---

## 🔑 Шаг 3: выдача прав `sudo`

```bash
sudo usermod -aG sudo teamlead
sudo usermod -aG sudo devops
```

---

## 📂 Шаг 4: создание рабочих каталогов

```bash
sudo mkdir -p /srv/projects
sudo mkdir -p /srv/deploy
sudo mkdir -p /srv/logs
sudo mkdir -p /srv/monitoring/prometheus
sudo mkdir -p /srv/monitoring/grafana
sudo mkdir -p /srv/monitoring/prometheus/data
sudo mkdir -p /srv/monitoring/prometheus/config
sudo mkdir -p /srv/n8n
sudo mkdir -p /srv/flask/app
sudo mkdir -p /srv/flask/postgres-data
```

### Назначение групп и прав:

```bash
sudo chown :developers /srv/projects
sudo chmod 2775 /srv/projects

sudo chown :devops /srv/deploy
sudo chmod 2775 /srv/deploy

sudo chown :testers /srv/logs
sudo chmod 2755 /srv/logs
```

> `chmod 2***` — означает "наследовать группу при создании новых файлов"

---

## 🔍 Проверка

```bash
ls -ld /srv/*
```

Ожидаемый результат:

```bash
drwxrwsr-x 2 root     developers 4096 ... projects
drwxrwsr-x 2 root     devops     4096 ... deploy
drwxr-sr-x 2 root     testers    4096 ... logs
```

---

## 🧩 Комментарии

- Все пользователи работают под **своими учётными записями**
- `root` доступ используется **только через `sudo`**
- Безопасность и разграничение прав — как в настоящей команде

---
