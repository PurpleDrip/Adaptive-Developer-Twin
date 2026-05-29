# ADT API Test Suite

## Collections
- `ADT-Complete-Test-Suite.postman_collection.json` — All ~50 endpoints with positive + negative cases

## Environments
- `environments/ADT-Direct-Services.postman_environment.json` — Hits each service directly on its port (8001-8008)
- `environments/ADT-Gateway.postman_environment.json` — All traffic routed through gateway (:8000)

## Run with Newman

```bash
# Install Newman
npm install -g newman

# Direct services
newman run ADT-Complete-Test-Suite.postman_collection.json \
  -e environments/ADT-Direct-Services.postman_environment.json

# Via gateway
newman run ADT-Complete-Test-Suite.postman_collection.json \
  -e environments/ADT-Gateway.postman_environment.json
```

## Run order
The "Auth Service" folder must run first — it populates `user_id` and `extension_id` collection variables used by subsequent requests.
