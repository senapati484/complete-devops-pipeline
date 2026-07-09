# Troubleshooting — per-stage failure cheat sheet

Use this when a build fails or a deploy is unhealthy. The **Stage** column refers to the 14 stages in the Jenkinsfile; the **Smoke** column refers to failures in `scripts/smoke-test.sh`.

For a detailed walkthrough of the **first** build, see `RUNBOOK.md`.

---

## Jenkinsfile stages

| #  | Stage                | Symptom                                              | Most likely cause                                                                 | Fix                                                                                          |
|----|----------------------|------------------------------------------------------|-----------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| 1  | Checkout             | `Failed to connect to repository`                    | GitHub PAT expired/revoked, or credential ID `github` missing                     | Generate new PAT in GitHub → update credential in Jenkins                                     |
| 1  | Checkout             | `Couldn't find any revision to build`                | Branch name typo in the `BRANCH` parameter, or branch doesn't exist on the remote  | Check branch exists: `git ls-remote --heads https://github.com/senapati484/complete-devops-pipeline <branch>` |
| 2  | Build Info           | `groovy.lang.MissingPropertyException`                | Jenkinsfile syntax error after a recent edit                                       | Revert Jenkinsfile to the last known-good commit                                              |
| 3  | Setup Node           | `Tool type "nodejs" not found`                       | NodeJS plugin not installed                                                       | Install **NodeJS** plugin via Plugin Manager                                                  |
| 3  | Setup Node           | Falls back to system Node (warning)                  | NodeJS tool not configured in **Manage Jenkins → Tools**                          | Either configure the tool (recommended) or accept the fallback (works if system Node is 22+)   |
| 4  | Pre-flight Checks    | `command not found: docker`                          | Docker not on PATH for the Jenkins user                                           | `sudo usermod -aG docker jenkins` and restart the Jenkins container/process                  |
| 5  | Install Dependencies | `npm ci` fails: `EUSAGE` / lockfile out of sync      | `package.json` changed but `package-lock.json` wasn't committed                    | Locally: `npm install` → commit the lockfile → push                                           |
| 5  | Install Dependencies | `ENETUNREACH` / `getaddrinfo EAI_AGAIN`              | No internet egress from the Jenkins host                                          | Check route table, NAT gateway, security group outbound rules                                |
| 6  | Lint                 | ESLint errors reported                                | Real lint errors in the code                                                      | Fix the errors, commit, push                                                                 |
| 6  | Lint                 | `Cannot find module 'eslint-config-next'`            | `npm ci` was skipped or failed silently                                            | Look at Stage 5 output more carefully                                                         |
| 7  | TypeScript Check     | `error TSxxxx:`                                      | Real type error                                                                   | Fix the type error, commit, push                                                              |
| 7  | TypeScript Check     | `Cannot find name 'X' / Cannot find module 'Y'`      | Stale `node_modules` after a dependency change                                    | Wipe `node_modules` and `package-lock.json`, run `npm install`, commit lockfile               |
| 8  | Prisma Generate      | `Prisma schema validation - Error`                   | Invalid `schema.prisma`                                                           | Run `npx prisma validate` locally                                                             |
| 8  | Prisma Generate      | `P3009` / migration engine errors                    | Not a problem here — Stage 8 only runs `generate`, not `migrate`                   | If you see P3009, you're looking at Stage 13 entrypoint output, not this stage                |
| 9  | Build                | `Module not found: Can't resolve 'X'`                | Missing/renamed import                                                            | Fix the import, commit, push                                                                 |
| 9  | Build                | `Error: useState only works in a client component`   | Server Component using a client hook                                              | Add `'use client'` directive or refactor                                                       |
| 9  | Build                | OOM / SIGKILL during build                           | Jenkins agent has < 2 GB free RAM                                                 | Increase the EC2 instance type or add swap                                                    |
| 10 | Build Docker Image   | `Cannot connect to the Docker daemon`                | Docker socket not mounted into the Jenkins container                              | Recreate the Jenkins container with `-v /var/run/docker.sock:/var/run/docker.sock`           |
| 10 | Build Docker Image   | `ERROR: failed to solve: failed to read dockerfile`  | Dockerfile path wrong, or `.dockerignore` excluded `docker/`                      | Confirm `docker/Dockerfile` exists; check `.dockerignore`                                     |
| 10 | Build Docker Image   | `npm ERR! ...` inside the build                      | Corrupt lockfile or registry outage                                               | Wait and retry, or regenerate lockfile locally                                                |
| 11 | Docker Hub Login     | `unauthorized: incorrect username or password`       | Password login deprecated by Docker Hub; credential is an account password not a token | Generate a Docker Hub **access token** and update the `dockerhub` credential                 |
| 11 | Docker Hub Login     | `denied: requested access to the resource is denied` | The user doesn't own the `senapati484` namespace                                  | Either change `DOCKER_USERNAME` in Jenkinsfile to your own user, or accept the invite to the namespace |
| 12 | Push Docker Image    | `no basic auth credentials` (after a successful login) | Login and push ran in different shell sessions                                    | The Jenkinsfile uses `withCredentials` correctly — if you see this, you've forked it; check that the login step wraps the push step |
| 13 | Deploy               | `permission denied` writing to deploy dir            | The Jenkins user can't write to `/home/ubuntu/deployments/...`                    | `sudo chown -R jenkins:jenkins /home/ubuntu/deployments`                                     |
| 13 | Deploy               | `port 80 is already allocated`                       | A previous nginx or apache is still running                                        | `sudo lsof -i :80` → kill the process                                                         |
| 13 | Deploy               | `no such host: postgres`                             | The generated `docker-compose.yml` is malformed                                   | Check the `deployComposeTemplate` function in the Jenkinsfile; re-verify by manually running `docker compose -f <generated> up` |
| 13 | Deploy               | `image not found`                                    | Push (Stage 12) silently failed, or you changed `DOCKER_USERNAME` in the env but not in the compose template | Push again, or align the variables                                                            |
| 14 | Health Check         | All 12 attempts fail                                 | App starts but `/api/health` returns non-200 — almost always a Prisma/DATABASE_URL issue | Verify `DATABASE_URL` is `postgresql://postgres:...@postgres:5432/...` (hostname = service name, not `localhost`). Run `./smoke-test.sh` for details |
| 14 | Health Check         | All 12 attempts fail                                 | Postgres container never became healthy                                           | `docker logs devops-postgres` — usually wrong password or already-initialized data dir with mismatched creds |
| 14 | Health Check         | All 12 attempts fail                                 | App container is restarting                                                      | `docker logs devops-app` — usually a Prisma error or `prisma db push` failure on first run    |

---

## Post-build failures (the `post { failure { ... } }` block)

| Symptom                                          | Cause                                                                                       | Fix                                                                                              |
|--------------------------------------------------|---------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| `docker compose down` fails with `no such network` | First build, no prior deployment to tear down                                              | Harmless — the `|| true` swallows it                                                              |
| Rollback succeeds but the site is still broken   | The "rollback" redeployed `:latest`, which IS the bad image (see `README.md` → Known limitations) | Manually redeploy an older image: `docker pull senapati484/devops-control-center:<known-good-build-id>`, edit `docker-compose.yml` to reference that tag, `docker compose up -d` |
| `docker logout` fails                            | Already logged out (no session)                                                            | Harmless — the `|| true` swallows it                                                              |
| `docker rmi` fails with `image is being used`    | Cleanup tried to delete an image currently used by a running container                       | Use `docker image prune -a -f --filter "until=168h"` instead (also see `README.md` → Known limitations) |

---

## Smoke test (`scripts/smoke-test.sh`) failures

| Check                              | Likely cause                                                                                  | Fix                                                                                          |
|------------------------------------|------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `devops-postgres` not running     | Postgres crashed on startup (bad password, bad data dir)                                       | `docker logs devops-postgres` — first time? wipe the named volume: `docker volume rm devops-control-center_postgres_data` |
| `devops-app` restarting            | Prisma error in entrypoint (db push failed) or app throws on boot                             | `docker logs devops-app --tail 100`                                                           |
| `devops-nginx` not running         | Port 80 conflict, or nginx.conf has a syntax error                                            | `docker logs devops-nginx`; test the conf with `docker exec devops-nginx nginx -t`           |
| `/api/health` returns 500          | Prisma can't reach the DB                                                                     | Confirm `DATABASE_URL` is set in the deployed `.env` (under `~/deployments/devops-control-center/.env`) and that the hostname is `postgres` |
| `/api/health` returns 404          | You're hitting the wrong path, or the app hasn't rebuilt with the latest route                | `curl -v http://localhost/api/health` to see what's actually returned                       |
| `/` returns 502                    | nginx can't reach `app:3000`                                                                  | `docker logs devops-nginx`; the depends_on ordering may be wrong — restart with `docker compose up -d --force-recreate` |
| `app container cannot reach itself on app:3000` | DNS resolution broken inside the bridge network                                        | `docker network inspect devops-control-center_app-network` — both `app` and `nginx` should appear |
| `nginx cannot reach app:3000`      | App is on a different network than nginx                                                       | Same as above — both services must be on `app-network`                                        |

---

## Pre-flight (`scripts/preflight.sh`) failures

| Check                                    | Likely cause                                                                          | Fix                                                                                  |
|------------------------------------------|---------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| `tool not found: docker`                 | Docker not installed                                                                 | `curl -fsSL https://get.docker.com | sh`                                              |
| `tool not found: docker compose`         | Compose v1 only, or compose plugin missing                                            | Install the v2 plugin: `apt install docker-compose-plugin`                          |
| `Cannot talk to Docker daemon`           | User not in the docker group                                                          | `sudo usermod -aG docker $USER && newgrp docker`                                    |
| `Deploy dir NOT writable`                | Owned by root or another user                                                         | `sudo chown -R $(whoami) /home/ubuntu/deployments`                                  |
| `GitHub repo NOT reachable`              | No outbound HTTPS, or DNS broken                                                      | `curl -v https://github.com/senapati484/complete-devops-pipeline`                   |
| `Docker Hub login FAILED`                | Wrong password (Docker Hub deprecated password auth — use an access token)            | Docker Hub → Account Settings → Security → New Access Token → update Jenkins cred    |
| `Jenkins NOT reachable`                  | Jenkins controller not running, or wrong port                                        | `sudo systemctl status jenkins` (or `docker ps` if running in a container)         |
| `Jenkins credential MISSING: <id>`       | Credential not configured, or the ID is spelled differently from what the Jenkinsfile uses | **Manage Jenkins → Credentials** → Add a new credential with the exact ID shown    |
| `Jenkins credential MISSING` on first run, but it exists | You created it in a different credential store/folder                          | Move the credential to the system store, or update the Jenkinsfile to reference the right store |
| `Port 80 is already in use`              | A previous `nginx` container didn't stop cleanly, or you have apache/systemd nginx running | `sudo lsof -i :80` → kill the conflicting process                                   |
