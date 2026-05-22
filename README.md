# QuizHub 

A real-time multiplayer quiz platform built with **FastAPI**, **PostgreSQL**, and **Redis**. Supports game rooms, leaderboards, question collections, and game history — with built-in observability via Prometheus, Grafana, and Loki.

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI 0.115, Python 3.13+ |
| Database | PostgreSQL 16 (async via asyncpg + SQLAlchemy) |
| Cache / PubSub | Redis 7 |
| Migrations | Alembic |
| Auth | JWT (python-jose + bcrypt) |
| Monitoring | Prometheus + Grafana + Loki + Promtail |
| Error tracking | Sentry |
| Reverse proxy | Nginx |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/)
- [uv](https://github.com/astral-sh/uv) (Python package manager) — only needed for local development outside Docker

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/quizhub.git
cd quizhub
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# PostgreSQL
POSTGRES_USER=quizhub
POSTGRES_PASSWORD=your_password
POSTGRES_DB=quizhub
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Sentry (optional)
SENTRY_DSN=
```

> **Note:** `POSTGRES_HOST` should be `db` and `REDIS_HOST` should be `redis` when running inside Docker Compose.

### 3. Start all services

```bash
docker compose up --build -d
```

This starts the following containers:

| Service | Description | Port |
|---|---|---|
| `backend-1`, `backend-2` | FastAPI app (load balanced) | internal |
| `db` | PostgreSQL 16 | internal |
| `redis` | Redis 7 | internal |
| `worker` | Background game saver worker | — |
| `nginx` | Reverse proxy (HTTP/HTTPS) | 80, 443 |
| `prometheus` | Metrics collection | 9090 |
| `grafana` | Dashboards | 3000 |
| `loki` | Log aggregation | 3100 |
| `promtail` | Log shipper | — |

### 4. Run database migrations

```bash
docker compose exec backend-1 uv run alembic upgrade head
```

---

## Verifying the Setup

Check the API is running:

```bash
curl http://localhost/health
# {"status": "ok"}
```

| URL | Description |
|---|---|
| `http://localhost/docs` | Interactive API docs (Swagger UI) |
| `http://localhost/metrics` | Prometheus metrics endpoint |
| `http://localhost:9090` | Prometheus |
| `http://localhost:3000` | Grafana (admin / `admin123`) |

---

## Project Structure

```
quizhub/
├── backend/
│   ├── app/
│   │   ├── routers/        # auth, questions, collections, rooms, game, leaderboard, game_history
│   │   ├── workers/        # game_saver background worker
│   │   ├── core/           # redis, db connections
│   │   └── rate_limiter.py
│   ├── main.py
│   ├── config.py
│   └── pyproject.toml
├── nginx/
├── grafana/
├── prometheus.yml
├── loki-config.yml
├── promtail-config.yml
├── docker-compose.yml
└── .env
```

---

## Local Development (without Docker)

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

Make sure a local PostgreSQL and Redis are running, and update `.env` with `POSTGRES_HOST=localhost` and `REDIS_HOST=localhost`.

---

## API Overview

| Router | Prefix | Description |
|---|---|---|
| Auth | `/auth` | Register, login, JWT tokens |
| Questions | `/questions` | CRUD for quiz questions |
| Collections | `/collections` | Question collections |
| Rooms | `/rooms` | Game room management |
| Game | `/game` | Real-time game logic |
| Leaderboard | `/leaderboard` | Rankings |
| Game History | `/game-history` | Past game results |