# Complete DevOps Pipeline

A production-grade CI/CD pipeline that builds a Next.js application and deploys it to AWS EC2 using Jenkins, Docker, Docker Hub, Nginx, and PostgreSQL.

> **Academic project (B.Tech — AWS + DevOps).** Built to demonstrate industry-style end-to-end automation: every push to GitHub is linted, type-checked, containerized, pushed to a registry, deployed behind a reverse proxy, and gated by a health check.

---

## Architecture

```
Developer
   │  git push
   ▼
GitHub (senapati484/complete-devops-pipeline)
   │
   │  webhook / manual build with BRANCH parameter
   ▼
Jenkins (on EC2)
   │
   ├─► Checkout (branch + commit SHA)
   ├─► npm ci ──► ESLint ──► tsc --noEmit ──► prisma generate ──► next build
   ├─► docker build (multi-stage Dockerfile) ──► tag :BUILD_ID + :latest
   ├─► docker login ──► docker push
   │
   ▼
Docker Hub (senapati484/devops-control-center)
   │
   │  SSH to deploy host, write .env + docker-compose.yml, copy nginx.conf
   ▼
EC2 Deploy Host
   │
   │  docker pull + docker compose up -d
   ▼
┌──────────────────────────────────────────┐
│  Nginx (port 80)                         │
│     │  reverse proxy + /api/health route │
│     ▼                                    │
│  Next.js app (port 3000, standalone)     │
│     │  Prisma client →                   │
│     ▼                                    │
│  PostgreSQL 16 (port 5432, volume)       │
└──────────────────────────────────────────┘
   │
   │  /api/health polled for 12 × 10s
   ▼
Health gate ──► success │ failure → rollback compose stack
   │
   ▼
Live website  ──►  http://<EC2_PUBLIC_IP>/
```

### Key design choices

- **Multi-stage Dockerfile** — `deps` → `builder` → `runner`. Final image is `node:22-alpine` + Next.js standalone output + production `node_modules` only. Runs as non-root `nextjs` user.
- **Standalone Next.js output** — `next.config.ts` sets `output: "standalone"`, so the runner stage doesn't need the full `.next/` tree.
- **PostgreSQL inside Compose** — the `postgres` service is on the same `app-network` bridge as the app; the app's `depends_on: condition: service_healthy` blocks startup until `pg_isready` passes. Data persists in the named `postgres_data` volume.
- **Nginx reverse proxy** — terminates port 80 and forwards to `app:3000` over the internal network. `/_next/static` gets its own location block to skip the upgrade headers.
- **Health gate + rollback** — the Jenkinsfile polls `/api/health` 12 times at 10 s intervals. On failure, it tears the stack down and brings it back up from the previous `:latest` image (see *Known Limitations* below).
- **Secrets never in the repo** — every credential (`DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_*`, `POSTGRES_PASSWORD`, Docker Hub, GitHub) is a Jenkins credential store entry injected at build/deploy time.

---

## Repository layout

```
.
├── Jenkinsfile                 # CI/CD pipeline definition
├── docker/
│   ├── Dockerfile              # Multi-stage Next.js image
│   ├── docker-compose.yml      # Local-dev compose (hardcoded creds — never used in prod)
│   └── docker-entrypoint.sh    # Runs prisma db push, then starts node server.js
├── nginx/
│   └── nginx.conf              # Reverse proxy, /_next/static passthrough, /api/health route
├── prisma/
│   └── schema.prisma           # User, Deployment, Pipeline, Activity, Notification
├── src/                        # Next.js App Router source
│   └── app/
│       ├── (auth)/             # login, register
│       ├── (dashboard)/        # dashboard pages
│       ├── (marketing)/        # public landing
│       ├── admin/              # admin-only routes
│       └── api/                # route handlers: health, deploy, deployments, profile, users, …
├── .env.example                # Template for required environment variables
├── next.config.ts              # output: "standalone", turbopack root
├── package.json
└── README.md
```

---

## Pipeline stages (Jenkinsfile)

| #  | Stage               | What runs                                                                 |
|----|---------------------|---------------------------------------------------------------------------|
| 1  | Checkout            | `git checkout */${BRANCH}` with `github` credential, capture short SHA    |
| 2  | Build Info          | Sets `currentBuild.displayName` / `description` to `#N - branch`          |
| 3  | Setup Node          | `tool "NodeJS 22"` → `PATH`; falls back to system Node if not configured  |
| 4  | Pre-flight Checks   | Print `docker`, `docker compose`, `git`, `node`, `npm` versions            |
| 5  | Install Dependencies| `npm ci`; stashes `node_modules/`                                         |
| 6  | Lint                | `npm run lint` (ESLint)                                                   |
| 7  | TypeScript Check    | `npx tsc --noEmit`                                                        |
| 8  | Prisma Generate     | `npx prisma generate` (client only — no DB required)                      |
| 9  | Build               | `npm run build` (Next.js)                                                 |
| 10 | Build Docker Image  | `docker build -f docker/Dockerfile -t :BUILD_ID -t :latest .`             |
| 11 | Docker Hub Login    | `docker login` with `dockerhub` credential, `docker info` for verification|
| 12 | Push Docker Image   | Push both `:BUILD_ID` and `:latest`                                       |
| 13 | Deploy              | Write `docker-compose.yml` + `.env` to `~/deployments/...`, `docker pull` + `up -d` |
| 14 | Health Check        | Poll `http://localhost/api/health` up to 12 × 10 s; on failure → rollback |

Pipeline options: `timestamps`, `ansiColor("xterm")`, `logRotator(numToKeepStr: "10")`, `skipDefaultCheckout`, `disableConcurrentBuilds`, `timeout(30, MINUTES)`.

### Parameters

| Name         | Type   | Default  | Description                          |
|--------------|--------|----------|--------------------------------------|
| `ENVIRONMENT`| choice | `staging`| `staging` or `production`            |
| `BRANCH`     | string | `main`   | Git branch to build and deploy       |

### Required Jenkins credentials

Configure these in **Manage Jenkins → Credentials** with the IDs used by the Jenkinsfile:

| Credential ID         | Type           | Purpose                                |
|-----------------------|----------------|----------------------------------------|
| `github`              | Username+PAT   | Clone the repo                         |
| `dockerhub`           | Username+PAT   | Push images to Docker Hub              |
| `DATABASE_URL`        | Secret text    | Prisma connection string               |
| `JWT_SECRET`          | Secret text    | JWT signing secret                     |
| `NEXTAUTH_SECRET`     | Secret text    | NextAuth secret                        |
| `NEXTAUTH_URL`        | Secret text    | `http://<EC2_PUBLIC_IP>`               |
| `POSTGRES_PASSWORD`   | Secret text    | PostgreSQL password                    |

---

## Local development

```bash
git clone https://github.com/senapati484/complete-devops-pipeline.git
cd complete-devops-pipeline
cp .env.example .env.local        # fill in secrets for local dev
npm ci
npx prisma generate
npm run dev                       # http://localhost:3000
```

To run the full stack locally with the same topology as production:

```bash
docker compose -f docker/docker-compose.yml up -d
# app on http://localhost, postgres on internal bridge network
```

> ⚠️ The `docker/docker-compose.yml` is for local development only — it hardcodes credentials to keep `docker compose up` working out of the box. The Jenkinsfile **never** uses this file: it generates its own `docker-compose.yml` at deploy time with the `dockerUsername`/`imageName`/`imageTag` from the build and credentials injected from the Jenkins store.

---

## Production deployment

The Jenkinsfile expects the following on the EC2 host that runs Jenkins:

1. **Jenkins** with the Docker Pipeline plugin and the credentials listed above.
2. **NodeJS 22** tool configured in **Manage Jenkins → Tools** (optional — falls back to system Node).
3. **Docker socket accessible** to the Jenkins container (mount `/var/run/docker.sock`).
4. **A deploy directory** writable by the Jenkins user: `/home/ubuntu/deployments/devops-control-center/`. The pipeline writes `docker-compose.yml`, `.env`, and `nginx.conf` here on every run.
5. **EC2 Security Group** allowing inbound **port 80** (HTTP) from the internet.
6. **A wildcard or default A record** pointing to the EC2 public IP (optional — the app also works on the bare IP).

### First-time setup

1. Create the GitHub repo and push the contents of this directory.
2. On the EC2 host, run Jenkins (Docker or native), install suggested plugins, create the credentials in the table above.
3. Create a new **Pipeline** job, point it at this repo, set `BRANCH = main` and `ENVIRONMENT = staging`.
4. Click **Build with Parameters**. The first run pulls base images, builds, pushes to Docker Hub, and brings up Nginx + Next.js + Postgres.
5. Hit `http://<EC2_PUBLIC_IP>/` — you should see the landing page. `/api/health` should return `{"status":"ok", ...}`.

### Triggering a deploy

- **Manual:** Jenkins → the job → *Build with Parameters* → set `BRANCH` → **Build**.
- **Automatic:** add a GitHub webhook (`http://<EC2_HOST>:8080/github-webhook/`) and a Jenkins trigger; the job will start on every push to the watched branch.

---

## Health endpoint

`GET /api/health` returns:

```json
{ "status": "ok", "timestamp": "2026-07-09T10:00:00.000Z" }
```

The Jenkins pipeline polls this URL on `http://localhost` (i.e. from inside the EC2 host) up to **12 times at 10-second intervals**. A successful response is the gate to a green build.

---

## Known limitations

These are accepted trade-offs for an academic project. Documenting them so evaluators get the honest answer if they ask:

1. **Rollback is image-redemption, not version-revert.** The post-build failure handler runs `docker compose up` against the `:latest` tag. If a bad image was the *latest* push, "rollback" redeploys that same bad image. A proper rollback would keep per-build tags (`:build-26`) and redeploy a known-good one.
2. **`docker compose pull` after `docker pull`.** Redundant but harmless — the explicit pull guarantees the new image is on the host before compose creates the container.
3. **No persistent build artifact store** beyond Docker Hub. The `cleanWs()` + `docker rmi` chain in the `always` block prunes the top 5 images to keep disk usage bounded.
4. **Single-host deployment.** No blue/green, no autoscaling, no CDN. Appropriate for the project's scope.

---

## Tech stack

| Layer        | Choice                                                |
|--------------|--------------------------------------------------------|
| App          | Next.js 16 (App Router, standalone output) + React 19 |
| Language     | TypeScript                                             |
| UI           | Tailwind CSS v4, Radix UI, framer-motion, lucide-react |
| ORM / DB     | Prisma 6 + PostgreSQL 16                               |
| Auth         | NextAuth + JWT (`jsonwebtoken`, `bcryptjs`)            |
| CI/CD        | Jenkins (Declarative Pipeline)                         |
| Container    | Docker (multi-stage, non-root, Alpine)                 |
| Registry     | Docker Hub (`senapati484/devops-control-center`)       |
| Reverse proxy| Nginx (Alpine)                                         |
| Cloud        | AWS EC2                                                |

---

## License

This project is part of a B.Tech academic submission.
