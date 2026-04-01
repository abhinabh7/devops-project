# DevOps Portfolio Project 🚀

A production-grade, end-to-end DevOps project built from scratch — featuring a containerized Node.js REST API with PostgreSQL and Redis, automated CI/CD pipeline, Kubernetes orchestration, and real-time monitoring with Prometheus and Grafana.

---

## 📌 Project Overview

This project demonstrates a complete DevOps workflow used by modern engineering teams. It covers containerization, automated testing and deployment, container orchestration, and production observability — all applied to a real e-commerce product API.

---

## 🏗️ Architecture

```
Browser / Client
      │
      ▼
┌─────────────────────────────────────────┐
│           Kubernetes Cluster            │
│                                         │
│  ┌──────────┐     ┌──────────────────┐  │
│  │  API x2  │────▶│   PostgreSQL     │  │
│  │ Node.js  │     │   (products DB)  │  │
│  │  :3000   │     └──────────────────┘  │
│  └────┬─────┘                           │
│       │           ┌──────────────────┐  │
│       └──────────▶│     Redis        │  │
│                   │  (cache layer)   │  │
│                   └──────────────────┘  │
│                                         │
│  ┌──────────┐     ┌──────────────────┐  │
│  │Prometheus│────▶│    Grafana       │  │
│  │ metrics  │     │   dashboards     │  │
│  └──────────┘     └──────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Application** | Node.js + Express | REST API |
| **Database** | PostgreSQL 15 | Persistent data storage |
| **Cache** | Redis 7 | Response caching (cache-aside pattern) |
| **Containerization** | Docker + Docker Compose | Local development environment |
| **Orchestration** | Kubernetes (KIND) | Production deployment |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Registry** | Docker Hub | Container image storage |
| **Monitoring** | Prometheus + Grafana | Metrics collection and visualization |

---

## 📁 Project Structure

```
devops-project/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── api/
│   ├── Dockerfile              # Container definition
│   ├── .dockerignore           # Docker build exclusions
│   ├── index.js                # Express app + routes
│   ├── db.js                   # PostgreSQL connection pool
│   ├── cache.js                # Redis connection
│   ├── metrics.js              # Prometheus metrics
│   ├── init.sql                # Database schema + seed data
│   ├── test.js                 # API integration tests
│   └── package.json
├── k8s/
│   ├── namespace.yml           # Kubernetes namespace
│   ├── configmap.yml           # Non-sensitive configuration
│   ├── secret.yml              # Sensitive credentials
│   ├── postgres.yml            # PostgreSQL Deployment + Service
│   ├── redis.yml               # Redis Deployment + Service
│   ├── api.yml                 # API Deployment + Service
│   └── monitoring.yml          # Prometheus + Grafana
└── docker-compose.yml          # Local multi-service setup
```

---

## ⚙️ Phase 1 — Docker & Docker Compose

### What was built
- Multi-stage `Dockerfile` with layer caching optimization
- `docker-compose.yml` orchestrating API, PostgreSQL, and Redis
- Automatic database initialization via `init.sql`
- Environment variable management with `.env`
- Cache-aside pattern — Redis sits in front of PostgreSQL

### Key concepts demonstrated
- Docker layer caching (copy `package.json` before source code)
- Container networking (services communicate by name, not IP)
- Volume persistence (database data survives container restarts)
- Health checks (`/health` endpoint for container orchestration)

### Run locally

```bash
git clone https://github.com/abhinabh7/devops-project.git
cd devops-project

# Create environment file
cp api/.env.example api/.env

# Start all services
docker compose up --build
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/products` | Get all products (cached) |
| POST | `/products` | Create a new product |

Test the API:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/products
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Monitor", "price": 299.99}'
```

---

## 🔄 Phase 2 — CI/CD with GitHub Actions

### What was built
- Automated pipeline triggered on every `git push` to `main`
- Two-job pipeline: **Test** → **Build & Push**
- Tests run in a real Docker Compose environment (not mocked)
- Docker image automatically pushed to Docker Hub on success
- Images tagged with both `latest` and the exact git commit SHA

### Pipeline flow

```
git push → GitHub Actions triggers
               │
               ▼
        ┌─────────────┐
        │  Job 1: Test │
        │  - spin up   │
        │    compose   │
        │  - run tests │
        └──────┬───────┘
               │ only if tests pass
               ▼
        ┌──────────────────┐
        │  Job 2: Build    │
        │  - build image   │
        │  - push DockerHub│
        └──────────────────┘
```

### Secrets management
All credentials stored as GitHub Actions secrets — never hardcoded in code or pipeline files.

---

## ☸️ Phase 3 — Kubernetes

### What was built
- Full Kubernetes deployment using KIND (Kubernetes in Docker)
- Separate `Namespace` for app isolation
- `ConfigMap` for non-sensitive configuration
- `Secret` for database credentials
- `Deployment` with `replicas: 2` for the API (horizontal scaling)
- `Service` objects for stable internal DNS
- `livenessProbe` and `readinessProbe` on the API

### Key concepts demonstrated

**Self-healing** — kill a pod and watch Kubernetes recreate it automatically:
```bash
kubectl delete pod <api-pod-name> -n devops-app
kubectl get pods -n devops-app --watch
# New pod appears within seconds ✅
```

**Health probes:**
- `livenessProbe` — restarts unhealthy pods automatically
- `readinessProbe` — removes pods from load balancer until ready

**Internal DNS** — services find each other by name:
```
api → postgres-service.devops-app.svc.cluster.local
api → redis-service.devops-app.svc.cluster.local
```

### Deploy to Kubernetes

```bash
# Create cluster
kind create cluster --name devops-cluster

# Deploy in order (dependencies first)
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secret.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/redis.yml
kubectl apply -f k8s/api.yml

# Verify everything is running
kubectl get all -n devops-app
```

---

## 📊 Phase 4 — Monitoring

### What was built
- Prometheus metrics instrumented directly in the Express app
- Three metric types: Counter, Gauge, Histogram
- RED method dashboards in Grafana (Rate, Errors, Duration)
- Prometheus deployed to Kubernetes scraping the API every 15 seconds
- Grafana dashboards with 4 panels

### Metrics collected

| Metric | Type | Description |
|---|---|---|
| `http_requests_total` | Counter | Total requests by route, method, status |
| `http_request_duration_ms` | Histogram | Response time distribution |
| `http_active_requests` | Gauge | Currently in-flight requests |
| `devops_api_process_*` | Various | Node.js runtime metrics |

### Grafana Dashboard Panels

| Panel | Query | Why |
|---|---|---|
| Request Rate | `rate(http_requests_total[5m])` | Requests per second |
| Error Rate | `rate(http_requests_total{status_code=~"5.."}[5m])` | 5xx errors per second |
| p99 Response Time | `histogram_quantile(0.99, rate(http_request_duration_ms_bucket[5m]))` | Worst 1% experience |
| Memory Usage | `devops_api_process_resident_memory_bytes / 1024 / 1024` | RAM in MB |

### Deploy monitoring

```bash
kubectl apply -f k8s/monitoring.yml

# Access Prometheus
kubectl port-forward -n monitoring service/prometheus-service 9090:9090

# Access Grafana (admin / admin123)
kubectl port-forward -n monitoring service/grafana-service 3001:3000
```

---

## 🎯 Key Engineering Decisions

**Why cache-aside pattern?**
First request hits PostgreSQL and stores result in Redis for 60 seconds. Subsequent requests serve from Redis (~1ms vs ~20ms). Cache is invalidated on writes to keep data consistent.

**Why parameterized SQL queries?**
Prevents SQL injection attacks. User input is never concatenated directly into SQL strings.

**Why layer caching in Dockerfile?**
Copying `package.json` before source code means `npm install` only re-runs when dependencies change — not on every code change. Saves minutes on large projects.

**Why p99 instead of average response time?**
Averages hide tail latency. p99 shows the worst experience 1% of users are having — the metric that actually matters for user experience.

**Why separate namespaces for app and monitoring?**
If the app has problems, monitoring stays healthy so you can observe what's wrong. Separation of concerns at the infrastructure level.

---

## 🚀 Getting Started

### Prerequisites
- Docker Desktop
- kubectl
- KIND
- Git
- Node.js 18+

### Quick start

```bash
# Clone the repo
git clone https://github.com/abhinabh7/devops-project.git
cd devops-project

# Local development
docker compose up --build

# Kubernetes deployment
kind create cluster --name devops-cluster
kubectl apply -f k8s/

# Access the app
kubectl port-forward -n devops-app service/api-service 3000:3000
curl http://localhost:3000/health
```

---

## 📄 License

MIT License — feel free to use this project as a reference or starting point for your own DevOps learning.

---

## 👤 Author

**Abhinabh**
- GitHub: [@abhinabh7](https://github.com/abhinabh7)
- Docker Hub: [abhinabh](https://hub.docker.com/u/abhinabh)
