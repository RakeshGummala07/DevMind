# DevMind

AI-powered developer intelligence platform — connect GitHub repositories and understand, search, review, document, and monitor them with retrieval-augmented AI. Runs entirely free and local: MySQL, MongoDB, Redis, Kafka, Qdrant, and Ollama, all via Docker Compose.

## Status: Phase 3 (in progress) — GitHub repository connection

Phases 1–2 are done. Phase 3 so far covers connecting and listing repositories — PR/issue/commit sync and webhooks are still ahead.

- **`auth-service`**: now stores each user's GitHub access token, AES-GCM encrypted at rest, and exposes it only via an internal, non-gateway-routed endpoint protected by a shared secret (`INTERNAL_API_KEY`) — the token still never reaches the frontend.
- **`repository-service`**: `GET /api/repositories/available` (repos on the user's GitHub account, flagged if already connected), `POST /api/repositories/connect`, `GET /api/repositories`, `GET /api/repositories/{id}`, `POST /api/repositories/{id}/index` (publishes `repository.index.requested` to Kafka — consumed once `ingestion-service` exists in Phase 4). Connecting a repo publishes `repository.created`.
- **Frontend**: `RepositoriesPage` is now real — lists connected repos, lists GitHub repos available to connect, and prompts to connect GitHub if the account has none linked yet.
- **UI**: floating glassmorphic navbar (sticky, rounded, inset from the edges, backdrop-blur), full responsive pass (off-canvas sidebar drawer below 900px, responsive grids), and a fix for a GitHub-login race condition (React StrictMode was double-firing the OAuth code exchange).

Still ahead in Phase 3: commits/issues/PRs sync, GitHub webhook handling with signature validation. `RepositoryDetailPage` and everything past it are still placeholders.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript (no TS), Redux Toolkit, TanStack Query, Framer Motion, Recharts |
| Backend | Java 21, Spring Boot 3, Spring Cloud Gateway, Spring Security, Spring Kafka |
| Relational data | MySQL |
| Document data | MongoDB |
| Cache / rate limiting | Redis |
| Events | Kafka |
| Vector search | Qdrant |
| AI inference | Ollama (local, free — no cloud API required) |
| Object storage | MinIO |
| Observability | Prometheus, Grafana, OpenSearch, OpenTelemetry, Jaeger |

## Design system

DevMind's UI encodes its own product thesis in its palette: `--ember` (warm) marks the system actively reasoning — indexing, generating, retrieving — and `--signal` (cool teal) marks a claim that's grounded in cited source. The **trace line** — a hairline thread that pulses across the top nav and chat panels during async work — is the app's signature element, deliberately echoing the distributed tracing the product itself is built on. See `frontend/src/styles/tokens.css` and `frontend/src/utils/motionTokens.js` for the full token set.

## Running locally

```bash
cp .env.example .env
# edit .env — at minimum leave the defaults for a first run; add real
# GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET once Phase 2/3 lands

# lightweight profile — recommended for day-to-day frontend/backend work
docker compose -f docker-compose.lite.yml up --build

# full stack — infra + all 7 services + observability
docker compose up --build
```

Frontend: http://localhost:5173
API gateway: http://localhost:9000 (health: `/actuator/health`)
Grafana (full stack only): http://localhost:3001
Jaeger (full stack only): http://localhost:16686

Ollama needs at least one model pulled before AI features work:
```bash
docker exec -it devmind-ollama-1 ollama pull llama3.1:8b
docker exec -it devmind-ollama-1 ollama pull nomic-embed-text
```

## Project structure

```
devmind/
├── frontend/            React app (Vite, no TypeScript)
├── backend/              Maven reactor + 7 Spring Boot services
├── infrastructure/       Config for Prometheus, Grafana, etc.
├── k8s/                  Optional local Kubernetes manifests (Minikube/K3d)
├── scripts/               backup / restore / development helper scripts
├── docs/                  Architecture, API, deployment, security docs
├── docker-compose.yml
├── docker-compose.lite.yml
└── .env.example
```

## Zero-cost guarantee

Nothing in this stack requires a paid account. AI runs on Ollama locally; every datastore is self-hosted via Docker Compose. Cloud deployment is documented separately as an optional path, never a requirement.


POST http://localhost:9000/api/auth/oauth/github/callback 500 (Internal Server Error)