# REST API — Agentic Studio

Документація HTTP API бекенду Django (Django REST Framework).

**Базовий URL (локально):** `http://127.0.0.1:8000/api`  
**Продакшн:** `https://agent-test-idwz.onrender.com/api` (або ваш хост + `/api`)

Усі шляхи нижче відносні до базового URL, наприклад: `GET /agents/` → `http://127.0.0.1:8000/api/agents/`.

---

## Зміст

1. [Аутентифікація](#аутентифікація)
2. [Ключі REST API](#ключі-rest-api)
3. [Реєстрація та вхід (JWT)](#реєстрація-та-вхід-jwt)
4. [Інтеграційні ключі (Gemini / GitHub)](#інтеграційні-ключі-gemini--github)
5. [Агенти](#агенти)
6. [Запуск агента та статус](#запуск-агента-та-статус)
7. [Завантаження файлів](#завантаження-файлів)
8. [Інструменти та схвалення](#інструменти-та-схвалення)
9. [Конфігурація](#конфігурація)
10. [Коди відповідей та помилки](#коди-відповідей-та-помилки)
11. [Приклади (Windows PowerShell)](#приклади-windows-powershell)

---

## Аутентифікація

Захищені ендпоінти вимагають авторизації. Підтримуються два способи:

### 1. JWT (веб-додаток, скрипти після логіну)

```http
Authorization: Bearer <access_token>
```

- Отримання: `POST /login/` або `POST /register/`
- Оновлення: `POST /token/refresh/` з тілом `{ "refresh": "<refresh_token>" }`
- Термін дії access: **12 годин**, refresh: **7 днів**

### 2. REST API ключ (інтеграції, CI, зовнішні клієнти)

```http
Authorization: Api-Key atk_<секрет>
```

Або:

```http
X-API-Key: atk_<секрет>
```

- Формат ключа: `atk_` + URL-safe токен (генерується сервером)
- Ключ показується **один раз** при створенні; у БД зберігається лише SHA-256 хеш
- Максимум **10** активних ключів на користувача (`MAX_REST_API_KEYS_PER_USER`)
- Керування ключами (створення/список/відкликання) — лише через **JWT** (або в UI: Налаштування → REST API Access)

---

## Ключі REST API

### Список активних ключів

```http
GET /rest-keys/
Authorization: Bearer <token>
```

**Відповідь `200`:**

```json
[
  {
    "id": 1,
    "name": "CI pipeline",
    "prefix": "atk_xxxxxxxxxxxx",
    "is_active": true,
    "created_at": "2026-05-23T10:00:00Z",
    "last_used_at": null
  }
]
```

### Створити ключ

```http
POST /rest-keys/
Authorization: Bearer <token>
Content-Type: application/json

{"name": "My script"}
```

**Відповідь `201`:**

```json
{
  "id": 2,
  "name": "My script",
  "prefix": "atk_xxxxxxxxxxxx",
  "is_active": true,
  "created_at": "2026-05-23T10:05:00Z",
  "last_used_at": null,
  "key": "atk_ПОВНИЙ_СЕКРЕТ_ПОКАЗУЄТЬСЯ_ОДИН_РАЗ"
}
```

### Відкликати ключ

```http
DELETE /rest-keys/<id>/
Authorization: Bearer <token>
```

**Відповідь:** `204 No Content`

---

## Реєстрація та вхід (JWT)

### Реєстрація

```http
POST /register/
Content-Type: application/json

{"username": "user1", "password": "secret123"}
```

**Відповідь `201`:**

```json
{
  "access": "<jwt_access>",
  "refresh": "<jwt_refresh>",
  "api_keys": {
    "gemini_configured": false,
    "gemini_key_hint": "",
    "github_configured": false,
    "github_status": "not_configured",
    "github_key_hint": ""
  }
}
```

### Вхід

```http
POST /login/
Content-Type: application/json

{"username": "user1", "password": "secret123"}
```

**Відповідь `200`:** той самий формат, що й при реєстрації.  
**Помилка `400`:** `{"error": "Wrong credentials"}`

### Оновлення access-токена

```http
POST /token/refresh/
Content-Type: application/json

{"refresh": "<jwt_refresh>"}
```

**Відповідь `200`:** `{"access": "<новий_access>"}`

---

## Інтеграційні ключі (Gemini / GitHub)

Зберігаються зашифровано для облікового запису. Потрібні для **запуску агентів** (Gemini) та GitHub-інструментів.

### Отримати статус

```http
GET /api-keys/
Authorization: Bearer <token> | Api-Key <key>
```

**Відповідь `200`:**

```json
{
  "gemini_configured": true,
  "gemini_key_hint": "AIza…xxxx",
  "serper_configured": true,
  "serper_key_hint": "abcd…wxyz",
  "github_configured": false,
  "github_status": "not_configured",
  "github_key_hint": ""
}
```

`github_status`: `not_configured` | `connected` | `invalid`

### Оновити ключі

```http
PUT /api-keys/
PATCH /api-keys/
Authorization: Bearer <token> | Api-Key <key>
Content-Type: application/json

{
  "gemini_api_key": "AIza...",
  "serper_api_key": "...",
  "github_token": "ghp_..."
}
```

Поля необов’язкові; порожній рядок для `github_token` або `serper_api_key` — видалити відповідний ключ.

`serper_api_key` потрібен для інструменту **web_search** (Serper). Якщо не задано в профілі, використовується `SERPER_API_KEY` з `.env` сервера.

### Перевірити GitHub

```http
POST /api-keys/github/test/
Authorization: Bearer <token> | Api-Key <key>
```

---

## Агенти

Агенти належать поточному користувачу (`owner`). Доступ лише до власних записів.

### Список агентів

```http
GET /agents/
Authorization: Api-Key atk_...
```

### Створити агента

```http
POST /agents/
Authorization: Api-Key atk_...
Content-Type: application/json
```

**Тіло (обов’язкові поля):**

| Поле | Тип | Опис |
|------|-----|------|
| `name` | string | Назва агента |
| `role` | string | Роль (напр. «Research assistant») |
| `backstory` | string | Біографія / інструкції |

**Необов’язкові:**

| Поле | Тип | За замовчуванням | Опис |
|------|-----|------------------|------|
| `additional_context` | string | `""` | Додатковий контекст |
| `max_iterations` | int | `10` | 1–20 |
| `forbidden_topics` | string | `""` | Заборонені теми |
| `tools` | string[] | `[]` | Імена інструментів з `/tools/` |

**Приклад:**

```json
{
  "name": "My Agent",
  "role": "assistant",
  "backstory": "You help with API testing.",
  "tools": ["web_search", "http_request"],
  "max_iterations": 10
}
```

> **Примітка:** поле `system_prompt` у відповіді **лише для читання** — генерується з `role`, `backstory`, `additional_context`, `forbidden_topics`. Для зворотної сумісності можна передати `system_prompt` при створенні — воно буде використане як `backstory`.

**Відповідь `201`:** об’єкт агента з `id`, `system_prompt`, `created_at`, …

### Отримати / оновити агента

```http
GET    /agents/<id>/
PATCH  /agents/<id>/
PUT    /agents/<id>/
Authorization: Api-Key atk_...
```

`PATCH` — часткове оновлення.

---

## Запуск агента та статус

### Запустити виконання

```http
POST /agents/<agent_id>/run/
Authorization: Api-Key atk_...
Content-Type: application/json

{
  "message": "Summarize the attached report",
  "attachment_paths": ["/path/from/upload/response"]
}
```

| Поле | Опис |
|------|------|
| `message` | Текст завдання (обов’язково, якщо немає вкладень) |
| `attachment_paths` | Шляхи з відповіді `POST /uploads/` (поле `path`) |

**Вимоги:**

- У профілі має бути налаштований **Gemini API key** (`gemini_configured: true`), інакше `400`.

**Відповідь `201`:**

```json
{
  "run_id": 42,
  "status": "running"
}
```

Виконання йде у фоновому потоці. Статус перевіряйте через `GET /runs/<run_id>/`.

### Статус запуску

```http
GET /runs/<run_id>/
Authorization: Api-Key atk_...
```

**Відповідь `200`:**

```json
{
  "id": 42,
  "agent": 1,
  "message": "...",
  "status": "running",
  "steps": [],
  "result": "",
  "error": "",
  "created_at": "...",
  "updated_at": "..."
}
```

**`status`:** `running` | `done` | `error`

- `steps` — журнал кроків (JSON-масив)
- `result` — фінальна відповідь агента (коли `done`)
- `error` — текст помилки (коли `error`)

### Схвалення інструментів

Якщо інструмент потребує підтвердження, використовуйте:

```http
POST /approvals/<approval_id>/
Authorization: Api-Key atk_...
Content-Type: application/json

{"decision": "approve"}
```

або `{"decision": "deny"}`.  
Опційно: `"always_allow": true` — додати інструмент до allowlist профілю.

---

## Завантаження файлів

```http
POST /uploads/
Authorization: Api-Key atk_...
Content-Type: multipart/form-data
```

Поля форми: `file` (один файл) або `files` (кілька).

**Відповідь `201`:**

```json
{
  "files": [
    {
      "id": "report_a1b2c3d4.pdf",
      "name": "report.pdf",
      "path": "C:\\...\\uploads\\1\\report_a1b2c3d4.pdf",
      "size": 12345,
      "extension": ".pdf"
    }
  ]
}
```

Дозволені розширення та ліміт розміру: `GET /config/`.

---

## Інструменти та схвалення

### Каталог інструментів

```http
GET /tools/
Authorization: Api-Key atk_...
```

**Відповідь `200`:**

```json
{
  "tools": [
    {
      "id": "web_search",
      "name": "web_search",
      "label": "Web search",
      "description": "Search the web for up-to-date information"
    }
  ]
}
```

Приклади імен для поля `tools` агента: `web_search`, `http_request`, `run_python`, `read_document`, `github_list_issues`, `github_create_issue`, …

---

## Конфігурація

```http
GET /config/
Authorization: Api-Key atk_...
```

**Відповідь `200`:**

```json
{
  "supported_extensions": ["txt", "md", "pdf", "..."],
  "max_upload_bytes": 10485760
}
```

---

## Коди відповідей та помилки

| Код | Значення |
|-----|----------|
| `200` | Успіх |
| `201` | Створено |
| `204` | Успіх без тіла (відкликання ключа) |
| `400` | Невалідні дані (`serializer.errors` або `{"error": "..."}`) |
| `401` | Не авторизовано / невалідний ключ або JWT |
| `404` | Не знайдено |

Приклад помилки валідації:

```json
{
  "role": ["This field is required."],
  "max_iterations": ["max_iterations must be between 1 and 20."]
}
```

---

## Приклади (Windows PowerShell)

> Виконуйте команди в **терміналі** (PowerShell / CMD), не в консолі браузера (F12).  
> У PowerShell `curl` — це псевдонім; для справжнього cURL використовуйте **`curl.exe`**.

```powershell
$KEY = "atk_YOUR_KEY_HERE"
$BASE = "http://127.0.0.1:8000/api"

# Список агентів
curl.exe -H "Authorization: Api-Key $KEY" "$BASE/agents/"

# Створити агента
curl.exe -X POST `
  -H "Authorization: Api-Key $KEY" `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Test\",\"role\":\"assistant\",\"backstory\":\"API test agent\"}" `
  "$BASE/agents/"

# Запустити агента (потрібен Gemini у налаштуваннях)
curl.exe -X POST `
  -H "Authorization: Api-Key $KEY" `
  -H "Content-Type: application/json" `
  -d "{\"message\":\"Hello\"}" `
  "$BASE/agents/1/run/"

# Статус запуску
curl.exe -H "Authorization: Api-Key $KEY" "$BASE/runs/1/"
```

**Альтернатива — `Invoke-RestMethod`:**

```powershell
$h = @{ Authorization = "Api-Key atk_YOUR_KEY_HERE" }
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/agents/" -Headers $h
```

---

## Типовий сценарій (API key)

1. Увійти в веб-додаток → **Налаштування** → **REST API Access** → створити ключ і скопіювати `atk_...`
2. (Опційно) `PUT /api-keys/` — додати Gemini key для запусків
3. `GET /tools/` — переглянути доступні інструменти
4. `POST /agents/` — створити агента
5. `POST /agents/<id>/run/` → отримати `run_id`
6. `GET /runs/<run_id>/` — чекати `status: "done"` і читати `result`

---

## Публічні ендпоінти (без авторизації)

| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/register/` | Реєстрація |
| POST | `/login/` | Вхід |
| POST | `/token/refresh/` | Оновлення JWT |

Усі інші ендпоінти з таблиці вище вимагають `Bearer` або `Api-Key`.
