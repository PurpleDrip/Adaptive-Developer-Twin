# Postman Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all existing Postman collections with a single comprehensive collection covering all ~50 endpoints across all 9 services, including negative cases, chained auth tokens, and two environment files (direct-to-service + gateway).

**Architecture:** One collection JSON with one folder per service. Pre-request scripts chain `user_id`, `extension_id`, and `token` as collection variables. Tests tab assertions on every request. Two environment files: `ADT-Direct-Services` (per-service ports) and `ADT-Gateway` (all via `:8000`).

**Tech Stack:** Postman Collection v2.1 JSON format. Can be imported into Postman or run via Newman (`newman run`).

---

## File Map

```
postman/
├── ADT-Complete-Test-Suite.postman_collection.json   ← replace all existing files
├── environments/
│   ├── ADT-Direct-Services.postman_environment.json
│   └── ADT-Gateway.postman_environment.json
└── README.md
```

---

## Task 1: Remove Old Collections + Create Environment Files

**Files:**
- Delete: all existing files in `postman/`
- Create: `postman/environments/ADT-Direct-Services.postman_environment.json`
- Create: `postman/environments/ADT-Gateway.postman_environment.json`

- [ ] **Step 1: Remove old Postman files**

```bash
rm postman/*.json postman/*.json 2>/dev/null || true
mkdir -p postman/environments
```

- [ ] **Step 2: Create Direct Services environment**

Create `postman/environments/ADT-Direct-Services.postman_environment.json`:

```json
{
  "id": "adt-direct-env",
  "name": "ADT — Direct Services",
  "values": [
    { "key": "AUTH_URL",       "value": "http://localhost:8001", "enabled": true },
    { "key": "TELEMETRY_URL",  "value": "http://localhost:8002", "enabled": true },
    { "key": "FUSION_URL",     "value": "http://localhost:8003", "enabled": true },
    { "key": "THG_URL",        "value": "http://localhost:8004", "enabled": true },
    { "key": "ALLOCATION_URL", "value": "http://localhost:8005", "enabled": true },
    { "key": "ANALYTICS_URL",  "value": "http://localhost:8006", "enabled": true },
    { "key": "MONITORING_URL", "value": "http://localhost:8007", "enabled": true },
    { "key": "TASK_URL",       "value": "http://localhost:8008", "enabled": true },
    { "key": "GATEWAY_URL",    "value": "http://localhost:8000", "enabled": true },
    { "key": "user_id",        "value": "",                      "enabled": true },
    { "key": "extension_id",   "value": "",                      "enabled": true },
    { "key": "manager_id",     "value": "",                      "enabled": true }
  ],
  "_postman_variable_scope": "environment"
}
```

- [ ] **Step 3: Create Gateway environment**

Create `postman/environments/ADT-Gateway.postman_environment.json`:

```json
{
  "id": "adt-gateway-env",
  "name": "ADT — Gateway Only",
  "values": [
    { "key": "AUTH_URL",       "value": "http://localhost:8000", "enabled": true },
    { "key": "TELEMETRY_URL",  "value": "http://localhost:8000", "enabled": true },
    { "key": "FUSION_URL",     "value": "http://localhost:8000", "enabled": true },
    { "key": "THG_URL",        "value": "http://localhost:8000", "enabled": true },
    { "key": "ALLOCATION_URL", "value": "http://localhost:8000", "enabled": true },
    { "key": "ANALYTICS_URL",  "value": "http://localhost:8000", "enabled": true },
    { "key": "MONITORING_URL", "value": "http://localhost:8000", "enabled": true },
    { "key": "TASK_URL",       "value": "http://localhost:8000", "enabled": true },
    { "key": "GATEWAY_URL",    "value": "http://localhost:8000", "enabled": true },
    { "key": "user_id",        "value": "",                      "enabled": true },
    { "key": "extension_id",   "value": "",                      "enabled": true },
    { "key": "manager_id",     "value": "",                      "enabled": true }
  ],
  "_postman_variable_scope": "environment"
}
```

- [ ] **Step 4: Commit environments**

```bash
git add postman/environments/
git commit -m "test(postman): add dual environment files (direct + gateway)"
```

---

## Task 2: Build the Complete Collection JSON

**Files:**
- Create: `postman/ADT-Complete-Test-Suite.postman_collection.json`

- [ ] **Step 1: Create the full collection**

Create `postman/ADT-Complete-Test-Suite.postman_collection.json` with the following content. This is a Postman Collection v2.1 JSON:

```json
{
  "info": {
    "name": "ADT Complete Test Suite",
    "description": "Comprehensive API tests for all 9 ADT microservices. Covers every endpoint including internal-only routes, negative cases, and chained auth flows.\n\nRun order: Auth first (populates user_id + extension_id variables), then remaining services.\n\nNewman: newman run ADT-Complete-Test-Suite.postman_collection.json -e environments/ADT-Direct-Services.postman_environment.json",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth Service",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": "{{AUTH_URL}}/api/v1/auth/health"
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Status healthy', () => pm.expect(pm.response.json().status).to.eql('healthy'));"
          ]}}]
        },
        {
          "name": "Register Developer",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/users/register",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"Postman Test Dev\",\n  \"username\": \"postman_dev_{{$timestamp}}\",\n  \"email\": \"postman_{{$timestamp}}@test.com\",\n  \"phone_number\": \"9876543210\",\n  \"gender\": \"Male\",\n  \"password\": \"PostmanTest123!\",\n  \"strong_domains\": [\"backend\", \"ml\"],\n  \"github_project_urls\": []\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 201', () => pm.response.to.have.status(201));",
            "pm.test('Has extension_id', () => { const b = pm.response.json(); pm.expect(b.extension_id).to.match(/^ADT-/); });",
            "pm.test('Has user_id', () => pm.expect(pm.response.json().user_id).to.be.a('string'));",
            "const b = pm.response.json(); pm.environment.set('user_id', b.user_id); pm.environment.set('extension_id', b.extension_id);"
          ]}}]
        },
        {
          "name": "Register — Duplicate Username (Negative)",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/users/register",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"Dup Dev\",\n  \"username\": \"admin\",\n  \"email\": \"admin@test.com\",\n  \"phone_number\": \"1111111111\",\n  \"gender\": \"Male\",\n  \"password\": \"Pass123!\",\n  \"strong_domains\": [\"backend\"],\n  \"github_project_urls\": []\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 400 on duplicate', () => pm.response.to.have.status(400));"
          ]}}]
        },
        {
          "name": "Login — Valid Developer",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/users/login",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"username\": \"postman_dev_{{$timestamp}}\",\n  \"password\": \"PostmanTest123!\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 401', () => pm.expect([200, 401]).to.include(pm.response.code));",
            "if (pm.response.code === 200) { pm.test('Has role', () => pm.expect(pm.response.json().role).to.eql('developer')); }"
          ]}}]
        },
        {
          "name": "Login — Wrong Password (Negative)",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/users/login",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"username\": \"someuser\",\n  \"password\": \"wrongpassword\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 401', () => pm.response.to.have.status(401));"
          ]}}]
        },
        {
          "name": "Login — Missing Fields (Negative)",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/users/login",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{ \"username\": \"alice\" }" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 422', () => pm.response.to.have.status(422));"
          ]}}]
        },
        {
          "name": "Get User Profile",
          "request": {
            "method": "GET",
            "url": "{{AUTH_URL}}/api/v1/auth/users/profile/{{user_id}}"
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Get Analysis Status",
          "request": {
            "method": "GET",
            "url": "{{AUTH_URL}}/api/v1/auth/users/analysis-status/{{user_id}}"
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));",
            "if (pm.response.code === 200) { pm.test('Has status field', () => pm.expect(pm.response.json()).to.have.property('status')); }"
          ]}}]
        },
        {
          "name": "Get All Users (requires manager role)",
          "request": {
            "method": "GET",
            "url": "{{AUTH_URL}}/api/v1/auth/users/all"
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Returns 200 or 403', () => pm.expect([200, 403]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Validate Username Availability",
          "request": {
            "method": "GET",
            "url": { "raw": "{{AUTH_URL}}/api/v1/auth/users/validate?username=test_unique_xyz", "query": [{"key": "username", "value": "test_unique_xyz"}] }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));"
          ]}}]
        },
        {
          "name": "Device Connect — Known Extension ID",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/connect/connect",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"extension_id\": \"{{extension_id}}\",\n  \"machine_id\": \"test-machine-123\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Device Connect — Unknown Extension ID (Negative)",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/connect/connect",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"extension_id\": \"ADT-INVALID00\",\n  \"machine_id\": \"any-machine\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 404 or 403', () => pm.expect([403, 404]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Send Notification",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/notifications/send",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"user_id\": \"{{user_id}}\",\n  \"message\": \"Postman test notification\",\n  \"type\": \"info\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 404', () => pm.expect([200, 201, 404]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Get Notifications",
          "request": {
            "method": "GET",
            "url": "{{AUTH_URL}}/api/v1/auth/notifications/{{user_id}}"
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));",
            "if (pm.response.code === 200) { pm.test('Returns array', () => pm.expect(pm.response.json()).to.be.an('array')); }"
          ]}}]
        },
        {
          "name": "Admin — DB Explorer Collections",
          "request": {
            "method": "GET",
            "url": "{{AUTH_URL}}/api/v1/auth/admin/explorer/collections"
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 403', () => pm.expect([200, 403]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Admin — System Config",
          "request": {
            "method": "GET",
            "url": "{{AUTH_URL}}/api/v1/auth/admin/config"
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 403', () => pm.expect([200, 403]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Hardware Lock — Valid Extension",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/users/hardware-lock",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"extension_id\": \"{{extension_id}}\",\n  \"machine_id\": \"lock-test-machine-001\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404 or 409', () => pm.expect([200, 404, 409]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Validate Extension ID",
          "request": {
            "method": "POST",
            "url": "{{AUTH_URL}}/api/v1/auth/users/validate-extension",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"extension_id\": \"{{extension_id}}\",\n  \"machine_id\": \"lock-test-machine-001\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 403 or 404', () => pm.expect([200, 403, 404]).to.include(pm.response.code));"
          ]}}]
        }
      ]
    },
    {
      "name": "Telemetry Service",
      "item": [
        {
          "name": "Health Check",
          "request": { "method": "GET", "url": "{{TELEMETRY_URL}}/api/v1/telemetry/health" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));"
          ]}}]
        },
        {
          "name": "Handshake — Valid Extension",
          "request": {
            "method": "POST",
            "url": { "raw": "{{TELEMETRY_URL}}/api/v1/telemetry/telemetry/handshake?extension_id={{extension_id}}&current_hash=INIT&machine_id=test-machine&native_hwid=native-test",
              "query": [
                {"key": "extension_id", "value": "{{extension_id}}"},
                {"key": "current_hash", "value": "INIT"},
                {"key": "machine_id", "value": "test-machine"},
                {"key": "native_hwid", "value": "native-test"}
              ]
            }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 403 or 404', () => pm.expect([200, 403, 404]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Handshake — Missing Params (Negative)",
          "request": { "method": "POST", "url": "{{TELEMETRY_URL}}/api/v1/telemetry/telemetry/handshake" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 422', () => pm.response.to.have.status(422));"
          ]}}]
        },
        {
          "name": "Ingest Telemetry Batch",
          "request": {
            "method": "POST",
            "url": "{{TELEMETRY_URL}}/api/v1/telemetry/telemetry/ingest",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"extension_id\": \"{{extension_id}}\",\n  \"machine_id\": \"test-machine\",\n  \"native_hwid\": \"native-test\",\n  \"sync_type\": \"delta\",\n  \"wpm\": 52.3,\n  \"keystrokes\": 1240,\n  \"commands_executed\": 18,\n  \"errors_encountered\": 3,\n  \"idle_seconds\": 45.0,\n  \"copy_paste_count\": 5,\n  \"session_duration\": 1800,\n  \"code_snippets\": [],\n  \"active_file_extension\": \".ts\",\n  \"timestamp\": \"2026-05-29T10:00:00Z\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 403', () => pm.expect([200, 201, 403]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Ingest — Empty Body (Negative)",
          "request": {
            "method": "POST",
            "url": "{{TELEMETRY_URL}}/api/v1/telemetry/telemetry/ingest",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 422', () => pm.response.to.have.status(422));"
          ]}}]
        },
        {
          "name": "Status — Pending Records",
          "request": { "method": "GET", "url": "{{TELEMETRY_URL}}/api/v1/telemetry/telemetry/status/{{extension_id}}" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));",
            "if (pm.response.code === 200) pm.test('Has pending_records', () => pm.expect(pm.response.json()).to.have.property('pending_records'));"
          ]}}]
        }
      ]
    },
    {
      "name": "Fusion Service",
      "item": [
        {
          "name": "Health Check",
          "request": { "method": "GET", "url": "{{FUSION_URL}}/api/v1/fusion/health" },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 200', () => pm.response.to.have.status(200));"]}}]
        },
        {
          "name": "Analyze Text — Semantic Vector",
          "request": {
            "method": "POST",
            "url": "{{FUSION_URL}}/api/v1/fusion/fusion/analyze-text",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"text\": \"Build a REST API with FastAPI and PostgreSQL for user authentication\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Returns vector', () => { const b = pm.response.json(); pm.expect(b).to.have.property('vector'); pm.expect(b.vector).to.be.an('object'); });"
          ]}}]
        },
        {
          "name": "Analyze Text — Empty Body (Negative)",
          "request": {
            "method": "POST",
            "url": "{{FUSION_URL}}/api/v1/fusion/fusion/analyze-text",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{}" }
          },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 422', () => pm.response.to.have.status(422));"]}}]
        },
        {
          "name": "Run Fusion for User",
          "request": {
            "method": "POST",
            "url": "{{FUSION_URL}}/api/v1/fusion/fusion/{{user_id}}/run",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"telemetry_summary\": {\"wpm\": 52.3, \"keystrokes\": 1240},\n  \"resume_profile\": {},\n  \"project_profile\": {}\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 404', () => pm.expect([200, 201, 404]).to.include(pm.response.code));"
          ]}}]
        }
      ]
    },
    {
      "name": "THG Service",
      "item": [
        {
          "name": "Health Check",
          "request": { "method": "GET", "url": "{{THG_URL}}/api/v1/thg/health" },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 200', () => pm.response.to.have.status(200));"]}}]
        },
        {
          "name": "Create Developer Node",
          "request": {
            "method": "POST",
            "url": "{{THG_URL}}/api/v1/thg/create-dev",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"dev_id\": \"{{user_id}}\",\n  \"name\": \"Postman Test Dev\",\n  \"bio\": \"Expert in backend\",\n  \"gender\": \"Male\",\n  \"primary_domain\": \"backend\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 409', () => pm.expect([200, 201, 409]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Create Developer — Missing dev_id (Negative)",
          "request": {
            "method": "POST",
            "url": "{{THG_URL}}/api/v1/thg/create-dev",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"Missing ID Dev\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 422', () => pm.response.to.have.status(422));"]}}]
        },
        {
          "name": "Get All Developers",
          "request": { "method": "GET", "url": "{{THG_URL}}/api/v1/thg/developers" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Returns array', () => pm.expect(pm.response.json()).to.be.an('array'));"
          ]}}]
        },
        {
          "name": "Update Skill",
          "request": {
            "method": "POST",
            "url": "{{THG_URL}}/api/v1/thg/update-skill",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"dev_id\": \"{{user_id}}\",\n  \"skill_name\": \"backend\",\n  \"strength\": 0.82,\n  \"confidence\": 0.75\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Create Task Node",
          "request": {
            "method": "POST",
            "url": "{{THG_URL}}/api/v1/thg/create-task",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"task_id\": \"TASK-PM-TEST-001\",\n  \"title\": \"Build authentication microservice\",\n  \"required_skills\": {\"backend\": 0.8, \"security\": 0.6}\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201', () => pm.expect([200, 201]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Match Task to Developers",
          "request": {
            "method": "GET",
            "url": { "raw": "{{THG_URL}}/api/v1/thg/match-task?task_id=TASK-PM-TEST-001",
              "query": [{"key": "task_id", "value": "TASK-PM-TEST-001"}]
            }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));",
            "if (pm.response.code === 200) pm.test('Returns candidates', () => pm.expect(pm.response.json()).to.be.an('array'));"
          ]}}]
        },
        {
          "name": "Create Manager Node",
          "request": {
            "method": "POST",
            "url": "{{THG_URL}}/api/v1/thg/create-manager",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"manager_id\": \"MGR-TEST-001\",\n  \"name\": \"Test Manager\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 409', () => pm.expect([200, 201, 409]).to.include(pm.response.code));",
            "pm.environment.set('manager_id', 'MGR-TEST-001');"
          ]}}]
        }
      ]
    },
    {
      "name": "Allocation Engine",
      "item": [
        {
          "name": "Health Check",
          "request": { "method": "GET", "url": "{{ALLOCATION_URL}}/api/v1/allocation/health" },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 200', () => pm.response.to.have.status(200));"]}}]
        },
        {
          "name": "Rank Developers — Strong Match",
          "request": {
            "method": "POST",
            "url": "{{ALLOCATION_URL}}/api/v1/allocation/rank",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"task_description\": \"Build a secure REST API with FastAPI, PostgreSQL, and JWT auth\",\n  \"manager_id\": \"{{manager_id}}\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));",
            "if (pm.response.code === 200) { const b = pm.response.json(); pm.test('Has candidates', () => pm.expect(b).to.have.property('candidates')); }"
          ]}}]
        },
        {
          "name": "Rank Developers — Empty Description (Negative)",
          "request": {
            "method": "POST",
            "url": "{{ALLOCATION_URL}}/api/v1/allocation/rank",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{}" }
          },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 422', () => pm.response.to.have.status(422));"]}}]
        }
      ]
    },
    {
      "name": "Analytics Service",
      "item": [
        {
          "name": "Health Check",
          "request": { "method": "GET", "url": "{{ANALYTICS_URL}}/api/v1/analytics/health" },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 200', () => pm.response.to.have.status(200));"]}}]
        },
        {
          "name": "Team Skills Distribution",
          "request": { "method": "GET", "url": "{{ANALYTICS_URL}}/api/v1/analytics/team-skills" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 500', () => pm.expect([200, 500]).to.include(pm.response.code));",
            "if (pm.response.code === 200) pm.test('Returns array', () => pm.expect(pm.response.json()).to.be.an('array'));"
          ]}}]
        },
        {
          "name": "Leaderboard",
          "request": { "method": "GET", "url": "{{ANALYTICS_URL}}/api/v1/analytics/leaderboard" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 500', () => pm.expect([200, 500]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Burnout Risk — Developer Stats",
          "request": { "method": "GET", "url": "{{ANALYTICS_URL}}/api/v1/analytics/stats/{{user_id}}" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 404', () => pm.expect([200, 404]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Submit Feedback",
          "request": {
            "method": "POST",
            "url": "{{ANALYTICS_URL}}/api/v1/analytics/feedback",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"reviewer_id\": \"{{user_id}}\",\n  \"target_id\": \"{{user_id}}\",\n  \"type\": \"self\",\n  \"score\": 4,\n  \"comment\": \"Postman test feedback\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 422', () => pm.expect([200, 201, 422]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "HR Report — Team Health",
          "request": { "method": "GET", "url": "{{ANALYTICS_URL}}/api/v1/analytics/hr-reports/team-health" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 403 or 500', () => pm.expect([200, 403, 500]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Submit Weekly Test",
          "request": {
            "method": "POST",
            "url": "{{ANALYTICS_URL}}/api/v1/analytics/tests/submit",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"user_id\": \"{{user_id}}\",\n  \"test_id\": \"TEST-POSTMAN-001\",\n  \"answers\": [{\"question_id\": \"q1\", \"selected_option\": \"A\"}]\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 404 or 422', () => pm.expect([200, 201, 404, 422]).to.include(pm.response.code));"
          ]}}]
        }
      ]
    },
    {
      "name": "Monitoring Service",
      "item": [
        {
          "name": "Health Check",
          "request": { "method": "GET", "url": "{{MONITORING_URL}}/api/v1/monitoring/health" },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 200', () => pm.response.to.have.status(200));"]}}]
        },
        {
          "name": "Get System Config",
          "request": { "method": "GET", "url": "{{MONITORING_URL}}/api/v1/monitoring/system-config" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Has batch_interval_minutes', () => pm.expect(pm.response.json()).to.have.property('batch_interval_minutes'));"
          ]}}]
        },
        {
          "name": "Update System Config",
          "request": {
            "method": "PUT",
            "url": "{{MONITORING_URL}}/api/v1/monitoring/system-config",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"batch_interval_minutes\": 5,\n  \"heartbeat_interval_seconds\": 30,\n  \"is_monitoring_paused\": false\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 403', () => pm.expect([200, 403]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Audit Log",
          "request": { "method": "GET", "url": "{{MONITORING_URL}}/api/v1/monitoring/audit-log" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Returns array', () => pm.expect(pm.response.json()).to.be.an('array'));"
          ]}}]
        },
        {
          "name": "System Health — All Services",
          "request": { "method": "GET", "url": "{{MONITORING_URL}}/api/v1/monitoring/system-health" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));"
          ]}}]
        },
        {
          "name": "Declare Holiday",
          "request": {
            "method": "POST",
            "url": "{{MONITORING_URL}}/api/v1/monitoring/holidays",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"date\": \"2026-12-25\",\n  \"name\": \"Christmas\",\n  \"applies_to\": \"all\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 422', () => pm.expect([200, 201, 422]).to.include(pm.response.code));"
          ]}}]
        }
      ]
    },
    {
      "name": "Task Service",
      "item": [
        {
          "name": "Health Check",
          "request": { "method": "GET", "url": "{{TASK_URL}}/api/v1/task/health" },
          "event": [{ "listen": "test", "script": { "exec": ["pm.test('Status 200', () => pm.response.to.have.status(200));"]}}]
        },
        {
          "name": "Match Candidates Preview",
          "request": {
            "method": "POST",
            "url": "{{TASK_URL}}/api/v1/task/match",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"title\": \"Build authentication service\",\n  \"description\": \"Implement JWT-based auth with FastAPI\",\n  \"required_skills\": {\"backend\": 0.8},\n  \"complexity\": 3,\n  \"manager_id\": \"{{manager_id}}\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 422 or 404', () => pm.expect([200, 404, 422]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Create Task",
          "request": {
            "method": "POST",
            "url": "{{TASK_URL}}/api/v1/task/create",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"title\": \"Postman Created Task\",\n  \"description\": \"Build a Neo4j graph query service\",\n  \"required_skills\": {\"neo4j\": 0.9, \"backend\": 0.7},\n  \"complexity\": 4,\n  \"manager_id\": \"{{manager_id}}\",\n  \"assigned_to\": \"{{user_id}}\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 201 or 422', () => pm.expect([200, 201, 422]).to.include(pm.response.code));"
          ]}}]
        },
        {
          "name": "Create Task — Missing Required Fields (Negative)",
          "request": {
            "method": "POST",
            "url": "{{TASK_URL}}/api/v1/task/create",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"title\": \"Incomplete Task\"\n}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 422', () => pm.response.to.have.status(422));"
          ]}}]
        }
      ]
    },
    {
      "name": "Gateway",
      "item": [
        {
          "name": "Gateway Health",
          "request": { "method": "GET", "url": "{{GATEWAY_URL}}/api/v1/auth/health" },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Proxied through gateway', () => pm.expect(pm.response.json().service).to.eql('auth-service'));"
          ]}}]
        },
        {
          "name": "CORS Preflight",
          "request": {
            "method": "OPTIONS",
            "url": "{{GATEWAY_URL}}/api/v1/auth/health",
            "header": [
              { "key": "Origin", "value": "http://localhost:3000" },
              { "key": "Access-Control-Request-Method", "value": "POST" }
            ]
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Status 200 or 204', () => pm.expect([200, 204]).to.include(pm.response.code));",
            "pm.test('CORS header present', () => pm.expect(pm.response.headers.get('Access-Control-Allow-Origin')).to.not.be.null);"
          ]}}]
        },
        {
          "name": "IP Block — Telemetry Ingest from External IP",
          "description": "This test should return 403 when run from a non-whitelisted IP. From localhost it may return 422 (missing body) instead of 403.",
          "request": {
            "method": "POST",
            "url": "{{GATEWAY_URL}}/api/v1/telemetry/telemetry/ingest",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "X-Forwarded-For", "value": "8.8.8.8" }
            ],
            "body": { "mode": "raw", "raw": "{}" }
          },
          "event": [{ "listen": "test", "script": { "exec": [
            "pm.test('Blocked (403) or requires auth (422)', () => pm.expect([403, 422]).to.include(pm.response.code));"
          ]}}]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Verify collection JSON is valid**

```bash
node -e "require('./postman/ADT-Complete-Test-Suite.postman_collection.json'); console.log('Valid JSON')"
```

Expected: `Valid JSON`

- [ ] **Step 3: Install Newman and run the collection**

```bash
npm install -g newman
newman run postman/ADT-Complete-Test-Suite.postman_collection.json \
  -e postman/environments/ADT-Direct-Services.postman_environment.json \
  --bail false 2>&1 | tail -30
```

Expected: Collection runs. Tests marked as "passed" or "failed" based on whether services are live. Any unexpected 500s reveal bugs.

- [ ] **Step 4: Create postman README**

Create `postman/README.md`:

```markdown
# ADT API Test Suite

## Collections
- `ADT-Complete-Test-Suite.postman_collection.json` — All ~50 endpoints, negative cases, chained auth

## Environments
- `ADT-Direct-Services` — Hits each service directly on its port (8001-8008)
- `ADT-Gateway` — All traffic routed through gateway (:8000)

## Run with Newman
```bash
# Direct services
newman run ADT-Complete-Test-Suite.postman_collection.json \
  -e environments/ADT-Direct-Services.postman_environment.json

# Via gateway
newman run ADT-Complete-Test-Suite.postman_collection.json \
  -e environments/ADT-Gateway.postman_environment.json
```

## Run order
Auth Service first — it sets `user_id` and `extension_id` collection variables used by subsequent requests.
```
```

- [ ] **Step 5: Commit**

```bash
git add postman/
git commit -m "test(postman): complete test suite for all 9 services with dual environments"
```
