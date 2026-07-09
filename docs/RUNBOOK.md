# First-Build Runbook

A step-by-step walkthrough for the first successful Jenkins build + deploy of the DevOps Control Center. After your first green run, see `TROUBLESHOOTING.md` for the per-stage failure cheat sheet.

---

## 0. Prerequisites (one-time, before you start)

### 0.1 Confirm you have these

- [ ] An EC2 instance running Ubuntu (the one that hosts Jenkins).
- [ ] SSH key on your laptop: `~/Desktop/Dev/aws/server.pem` (chmod 400).
- [ ] A GitHub PAT with `repo` scope, stored in Jenkins as credential ID `github`.
- [ ] A Docker Hub account + access token, stored in Jenkins as `dockerhub`.
- [ ] A Jenkins API token (for the pre-flight script). See 0.2.
- [ ] Security group inbound rule allowing port 80 from `0.0.0.0/0` (or your demo network).

### 0.2 Create a Jenkins API token (one-time, ~30 seconds)

1. Open Jenkins at `http://<EC2_PUBLIC_IP>:8080` and log in.
2. Click your username (top right) → **Configure** → **API Token** section.
3. Click **Add new Token**, give it a name (e.g., `preflight-script`), click **Generate**.
4. **Copy the token** — it won't be shown again. You'll paste it into the pre-flight script when prompted.

### 0.3 Verify the 7 Jenkins credentials exist

Open **Manage Jenkins → Credentials → System → Global credentials**. You should see entries for:

| ID                   | Kind        |
|----------------------|-------------|
| `github`             | Username + password |
| `dockerhub`          | Username + password |
| `DATABASE_URL`       | Secret text |
| `JWT_SECRET`         | Secret text |
| `NEXTAUTH_SECRET`    | Secret text |
| `NEXTAUTH_URL`       | Secret text |
| `POSTGRES_PASSWORD`  | Secret text |

> 💡 The ID is what the Jenkinsfile references. If you used a different ID when creating a credential, the build will fail at the Deploy stage with `CredentialsBindingException`.

### 0.4 Required credential values

| Credential         | Example value                                                       |
|--------------------|---------------------------------------------------------------------|
| `DATABASE_URL`     | `postgresql://postgres:YOUR_PG_PASS@postgres:5432/devops_dashboard` |
| `JWT_SECRET`       | 32+ random characters (`openssl rand -hex 32`)                      |
| `NEXTAUTH_SECRET`  | 32+ random characters (can be the same as JWT_SECRET)               |
| `NEXTAUTH_URL`     | `http://<EC2_PUBLIC_IP>`                                            |
| `POSTGRES_PASSWORD`| The password you want for the `postgres` user                       |

> ⚠️ `DATABASE_URL` hostname must be `postgres` (the docker-compose service name), **not** `localhost`. The app runs inside the compose network where `postgres` resolves to the DB container.

---

## 1. SSH into the EC2 host

```bash
ssh -i ~/Desktop/Dev/aws/server.pem ubuntu@<EC2_PUBLIC_IP>
```

You should land in `/home/ubuntu`.

---

## 2. Upload the scripts to the EC2 host

From your **laptop**:

```bash
scp -i ~/Desktop/Dev/aws/server.pem \
    scripts/preflight.sh scripts/smoke-test.sh \
    ubuntu@<EC2_PUBLIC_IP>:~/
```

Then on the **EC2 host**:

```bash
chmod +x ~/preflight.sh ~/smoke-test.sh
```

---

## 3. Run the pre-flight script

```bash
./preflight.sh
```

The script will:

1. Auto-detect the public IP from EC2 metadata.
2. Verify `docker`, `docker compose`, `curl`, `git` are installed.
3. Confirm the Docker daemon is reachable.
4. Create `/home/ubuntu/deployments/devops-control-center/` if missing.
5. Check GitHub + Docker Hub are reachable.
6. **Prompt for Docker Hub username + password** (you'll see the cursor not move on the password line — that's normal).
7. **Prompt for Jenkins username + API token** (same — silent input).
8. Verify all 7 Jenkins credentials exist.
9. Check port 80 is free.

**Expected output:** all green `✓` checks, ending with `All pre-flight checks passed.`

If anything fails, see `TROUBLESHOOTING.md` — there's a row per pre-flight check.

---

## 4. Trigger the first Jenkins build

1. Open Jenkins: `http://<EC2_PUBLIC_IP>:8080`.
2. Open your pipeline job (whatever you named it).
3. Click **Build with Parameters** (left sidebar).
4. Set:
   - `ENVIRONMENT` = `staging` (or `production` if you have DNS + HTTPS).
   - `BRANCH` = `main`.
5. Click **Build**.
6. Click into the running build (the build number will appear in the Build History).

---

## 5. Watch the 14 stages

Click on the running build, then **Console Output**. Here's what healthy output looks like at each stage, and what to do if it diverges.

### Stage 1 — Checkout
**Healthy:** `Checked out: main @ <7-char-sha>`
**If it fails:** `Failed to connect to repository` → credential `github` is wrong, or the PAT has expired/revoked. Generate a new PAT in GitHub, update the credential in Jenkins.

### Stage 2 — Build Info
**Healthy:** `Build: #1 - main`
**If you see this stage fail:** something is structurally wrong with the Jenkinsfile. You edited it; revert to main and try again.

### Stage 3 — Setup Node
**Healthy:** No output, or `NodeJS tool not configured in Jenkins; using system Node.js` (the script falls back gracefully if you didn't configure a NodeJS tool).
**If it fails:** the `NodeJS 22` tool name in the Jenkinsfile doesn't match a tool you configured. Either configure it (**Manage Jenkins → Tools → NodeJS Installations → Add NodeJS** with name `NodeJS 22` and version `22.x.x`), or rename the reference in the Jenkinsfile.

### Stage 4 — Pre-flight Checks
**Healthy:** A block printing:
```
=== Tool Versions ===
Docker version 24.x.x, build xxxxx
Docker Compose version v2.x.x
git version 2.x.x
node v22.x.x
10.x.x
=== All tools available ===
```
**If it fails:** a tool is missing. `apt install <tool>` and rerun.

### Stage 5 — Install Dependencies
**Healthy:** Lots of `npm` output, ending with `added N packages`. No errors.
**If it fails:** `npm ci` requires `package-lock.json` to be in sync with `package.json`. If you've added dependencies without committing the lockfile, this fails. Run `npm install` locally and commit the lockfile.

### Stage 6 — Lint
**Healthy:** No output (clean lint), or a list of warnings. **Build will fail on errors only.**
**If it fails:** fix the lint errors reported, commit, push.

### Stage 7 — TypeScript Check
**Healthy:** No output (no type errors).
**If it fails:** `error TSxxxx: ...` lines. Fix the types, commit, push.

### Stage 8 — Prisma Generate
**Healthy:** `✔ Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client`
**If it fails:** `prisma/schema.prisma` is invalid. Run `npx prisma validate` locally.

### Stage 9 — Build
**Healthy:** Next.js output ending with route summary table, e.g.:
```
Route (app)                                 Size  First Load JS
┌ ○ /                                      XXX B         XXX kB
├ ○ /_not-found                            XXX B         XXX kB
└ ƒ /api/health                            XXX B         XXX kB
```
**If it fails:** usually a runtime error in a page or API route. Read the trace, fix, commit, push.

### Stage 10 — Build Docker Image
**Healthy:** A long block of `Step 1/N ...` lines, ending with:
```
Successfully built <sha>
Successfully tagged senapati484/devops-control-center:<BUILD_ID>
Successfully tagged senapati484/devops-control-center:latest
```
**If it fails:**
- `Cannot connect to the Docker daemon` → Docker socket not mounted into Jenkins container. Restart Jenkins with `-v /var/run/docker.sock:/var/run/docker.sock`.
- `npm ERR! ...` inside the build → corrupted `package-lock.json`. Regenerate locally.

### Stage 11 — Docker Hub Login
**Healthy:** `Login Succeeded` followed by a long `docker info` dump.
**If it fails:** `unauthorized: incorrect username or password` → the `dockerhub` credential is wrong. Update it. (Make sure you're using a Docker Hub **access token**, not your account password — Docker Hub deprecates password logins.)

### Stage 12 — Push Docker Image
**Healthy:** Two digest lines, one for `:BUILD_ID` and one for `:latest`.
**If it fails:** `denied: requested access to the resource is denied` → the credential works for login but doesn't have push rights on the repo. Make sure your Docker Hub user owns the `senapati484` namespace (or change `DOCKER_USERNAME` in the Jenkinsfile to your own).

### Stage 13 — Deploy
**Healthy:** A sequence of:
- `mkdir ...` (silent)
- `writeFile` (silent)
- `cp nginx/nginx.conf .../nginx.conf` (silent)
- `docker pull ...` → `<Digest>: <sha>` line
- `docker compose ... pull` → `Pulling postgres` / `Pulling app` / `Pulling nginx`
- `docker compose ... up -d --remove-orphans` → `Container devops-postgres ...` / `Container devops-app ...` / `Container devops-nginx ...`

**If it fails:**
- `permission denied` on the deploy dir → run the chown fix from pre-flight.
- `no such host` for `postgres` → the docker-compose.yml wasn't generated properly. Re-check the `deployComposeTemplate` function in the Jenkinsfile.
- `port 80 is already allocated` → kill whatever else is on port 80 (`sudo lsof -i :80`).

### Stage 14 — Health Check
**Healthy:** A retry loop with messages like `Health check attempt 1/12 failed -- retrying in 10s ...` for 1-3 attempts, then `Health check passed! (attempt N/12)`.
**If it fails (all 12 attempts fail):** the post block tears down the stack and redeploys `:latest`. The build ends in red.
Most common cause: `/api/health` returns non-200, which is almost always a Prisma/DATABASE_URL issue. Run `./smoke-test.sh` on the EC2 host to see which container is unhealthy.

---

## 6. Confirm the deployment

```bash
./smoke-test.sh
```

Expected output: all green `✓` checks, ending with:
```
✓ All smoke tests passed. The deployment is live and serving real traffic.
Open: http://<EC2_PUBLIC_IP>/
```

---

## 7. Open the live site

In your browser: `http://<EC2_PUBLIC_IP>/`

You should see the landing page. Try `/login` and `/register` to confirm NextAuth + Prisma are both talking to Postgres.

---

## 8. (Optional) Verify the Docker image on Docker Hub

Open `https://hub.docker.com/r/senapati484/devops-control-center/tags` — you should see the new build's tag, plus the moving `:latest` tag.

---

## What's next

See `TROUBLESHOOTING.md` for the per-stage failure cheat sheet (use this for repeat runs), and the main `README.md` for the full architecture and design notes.
