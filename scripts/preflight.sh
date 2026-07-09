#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# preflight.sh — verify every external dependency the Jenkins pipeline touches
# is healthy, BEFORE you click "Build with Parameters" in Jenkins.
#
# RUNS ON THE EC2 HOST (not on the laptop). It needs the same Docker socket
# Jenkins uses, the same network egress, and the same deploy directory.
#
# Usage:
#   chmod +x preflight.sh
#   ./preflight.sh
#
# Optional env overrides (otherwise auto-detected or prompted):
#   DEPLOY_DIR          default: /home/ubuntu/deployments/devops-control-center
#   COMPOSE_PROJECT     default: devops-control-center
#   DOCKERHUB_USER      default: prompted
#   JENKINS_URL         default: http://localhost:8080
#   GITHUB_REPO         default: senapati484/complete-devops-pipeline
#   IMAGE_NAME          default: devops-control-center
# ─────────────────────────────────────────────────────────────────────────────
set -u

# ─── Styling ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() { PASS_COUNT=$((PASS_COUNT+1)); printf "${GREEN}✓${NC} %s\n" "$1"; }
fail() { FAIL_COUNT=$((FAIL_COUNT+1)); printf "${RED}✗${NC} %s\n" "$1"; [ "${2:-}" = "fatal" ] && { printf "\n${RED}Aborting.${NC} Fix the above and re-run.\n"; exit 1; }; }
warn() { WARN_COUNT=$((WARN_COUNT+1)); printf "${YELLOW}!${NC} %s\n" "$1"; }
info() { printf "${BLUE}»${NC} %s\n" "$1"; }
section() { echo; printf "${BLUE}━━━ %s ━━━${NC}\n" "$1"; }

# ─── 0. Banner + auto-detect public IP ──────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DevOps Control Center — Pre-flight Checks                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo

# IMDSv2: require a session token first; fall back to IMDSv1 if the PUT fails.
# Many hardened AWS accounts (e.g. those with "HttpTokens=required") reject the
# plain GET, so the IP would show as <unavailable> otherwise.
IMDS_TOKEN="$(curl -fsS --max-time 3 -X PUT http://169.254.169.254/latest/api/token \
    -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600' 2>/dev/null || true)"
if [ -n "$IMDS_TOKEN" ]; then
    PUBLIC_IP="$(curl -fsS --max-time 3 -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
        http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<unavailable>')"
else
    PUBLIC_IP="$(curl -fsS --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<unavailable>')"
fi
if [ "$PUBLIC_IP" = "<unavailable>" ]; then
    warn "Could not auto-detect public IP from EC2 metadata service."
    warn "Are you running this on the EC2 host? You can override with: PUBLIC_IP=x.x.x.x ./preflight.sh"
    PUBLIC_IP="${PUBLIC_IP_OVERRIDE:-<unavailable>}"
else
    info "EC2 public IP: $PUBLIC_IP"
fi

# ─── 1. Tooling ─────────────────────────────────────────────────────────────
section "Tooling"
for tool in docker curl ssh git awk; do
    if command -v "$tool" >/dev/null 2>&1; then
        pass "$tool — $(command -v $tool)"
    else
        fail "$tool not found" fatal
    fi
done

if docker compose version >/dev/null 2>&1; then
    pass "docker compose — $(docker compose version --short 2>/dev/null || echo 'present')"
else
    fail "docker compose plugin not found" fatal
fi

# ─── 2. Docker daemon ───────────────────────────────────────────────────────
section "Docker daemon"
if docker info >/dev/null 2>&1; then
    SERVER_VER="$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'unknown')"
    pass "Docker daemon reachable (server $SERVER_VER)"
else
    fail "Cannot talk to Docker daemon. Is the socket mounted for your user?"
    fail "  Try: sudo usermod -aG docker \$USER && newgrp docker"
    fail "  Or:  ls -l /var/run/docker.sock"
fi

# ─── 3. Deploy directory ────────────────────────────────────────────────────
section "Deploy directory"
DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu/deployments/devops-control-center}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-devops-control-center}"

if [ -d "$DEPLOY_DIR" ]; then
    pass "Deploy dir exists: $DEPLOY_DIR"
    if [ -w "$DEPLOY_DIR" ]; then
        pass "Deploy dir is writable"
    else
        fail "Deploy dir is NOT writable by $(whoami). Run: sudo chown -R \$(whoami) $DEPLOY_DIR"
    fi
else
    warn "Deploy dir does not exist yet: $DEPLOY_DIR"
    if mkdir -p "$DEPLOY_DIR" 2>/dev/null; then
        pass "Created deploy dir"
    else
        fail "Could not create deploy dir. Check permissions on /home/ubuntu/deployments/"
    fi
fi

# ─── 4. Network egress (GitHub + Docker Hub) ────────────────────────────────
section "Network egress"
GITHUB_REPO="${GITHUB_REPO:-senapati484/complete-devops-pipeline}"

if curl -fsS --max-time 10 -o /dev/null -w "%{http_code}" "https://github.com/$GITHUB_REPO" 2>/dev/null | grep -q '^200$'; then
    pass "GitHub repo reachable: https://github.com/$GITHUB_REPO"
else
    fail "GitHub repo NOT reachable. Pipeline checkout will fail."
    fail "  Test from this host: curl -I https://github.com/$GITHUB_REPO"
fi

if curl -fsS --max-time 10 -o /dev/null -w "%{http_code}" "https://hub.docker.com/" 2>/dev/null | grep -qE '^(200|301|302)$'; then
    pass "Docker Hub reachable"
else
    fail "Docker Hub NOT reachable. Pipeline push will fail."
fi

# ─── 5. Docker Hub credentials ──────────────────────────────────────────────
section "Docker Hub credentials"
DOCKERHUB_USER="${DOCKERHUB_USER:-}"
if [ -z "$DOCKERHUB_USER" ]; then
    printf "    Docker Hub username: "
    read -r DOCKERHUB_USER
fi
printf "    Docker Hub password (input hidden): "
read -rs DOCKERHUB_PASS
echo

if [ -z "$DOCKERHUB_USER" ] || [ -z "$DOCKERHUB_PASS" ]; then
    fail "Docker Hub credentials blank"
else
    if echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin >/dev/null 2>&1; then
        pass "Docker Hub login successful as $DOCKERHUB_USER"
        docker logout >/dev/null 2>&1
    else
        fail "Docker Hub login FAILED. Check username/password/token."
    fi
fi

# ─── 6. Jenkins up + credentials exist ──────────────────────────────────────
section "Jenkins"
JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"

if curl -fsS --max-time 5 -o /dev/null -w "%{http_code}" "$JENKINS_URL/login" 2>/dev/null | grep -qE '^(200|403)$'; then
    pass "Jenkins reachable at $JENKINS_URL"
else
    fail "Jenkins NOT reachable at $JENKINS_URL. Is the controller running?"
    JENKINS_URL=""
fi

if [ -n "$JENKINS_URL" ]; then
    printf "    Jenkins username: "
    read -r JENKINS_USER
    printf "    Jenkins API token (input hidden): "
    read -rs JENKINS_TOKEN
    echo

    if [ -z "$JENKINS_USER" ] || [ -z "$JENKINS_TOKEN" ]; then
        warn "Jenkins credentials blank — skipping credential existence checks"
    else
        CREDS=("github" "dockerhub" "DATABASE_URL" "JWT_SECRET" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "POSTGRES_PASSWORD")
        for cred_id in "${CREDS[@]}"; do
            http_code=$(curl -fsS --max-time 5 -u "$JENKINS_USER:$JENKINS_TOKEN" \
                -o /dev/null -w "%{http_code}" \
                "$JENKINS_URL/credentials/store/system/domain/_/credential/$cred_id/api/json" 2>/dev/null || echo "000")

            if [ "$http_code" = "200" ]; then
                pass "Jenkins credential present: $cred_id"
            elif [ "$http_code" = "404" ]; then
                fail "Jenkins credential MISSING: $cred_id"
            else
                warn "Could not verify credential $cred_id (HTTP $http_code — check user/token permissions)"
            fi
        done
    fi
fi

# ─── 7. Port 80 reachable ───────────────────────────────────────────────────
section "Port 80"
if ss -ltn 2>/dev/null | awk '$4 ~ /:80$/' | grep -q ':80'; then
    warn "Something is already listening on port 80 — may conflict with nginx container"
    ss -ltnp 2>/dev/null | awk '$4 ~ /:80$/{print "  " $0}'
else
    pass "Port 80 is free (nginx will claim it)"
fi

# ─── 8. Optional: existing containers from a previous run ───────────────────
section "Existing deployment (if any)"
if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qE "(${COMPOSE_PROJECT}-postgres|${COMPOSE_PROJECT}-app|${COMPOSE_PROJECT}-nginx|devops-postgres|devops-app|devops-nginx)"; then
    info "Found existing containers from a previous run. They will be replaced on the next deploy:"
    docker ps -a --format "  - {{.Names}} ({{.Status}})" | grep -E "(devops-postgres|devops-app|devops-nginx)" || true
else
    pass "No leftover containers from a previous run"
fi

# ─── Summary ────────────────────────────────────────────────────────────────
echo
echo "══════════════════════════════════════════════════════════════"
TOTAL=$((PASS_COUNT+FAIL_COUNT+WARN_COUNT))
printf "  ${GREEN}Passed${NC}: %d   ${RED}Failed${NC}: %d   ${YELLOW}Warnings${NC}: %d   Total: %d\n" \
    "$PASS_COUNT" "$FAIL_COUNT" "$WARN_COUNT" "$TOTAL"
echo "══════════════════════════════════════════════════════════════"
echo

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "${RED}✗ Pre-flight FAILED.${NC} Fix the issues above before running a Jenkins build."
    exit 1
fi

if [ "$WARN_COUNT" -gt 0 ]; then
    echo "${YELLOW}! Pre-flight passed with warnings.${NC} Build should succeed, but review warnings above."
    exit 0
fi

echo "${GREEN}✓ All pre-flight checks passed.${NC} You may run the Jenkins build now."
echo "  Live site will be: http://$PUBLIC_IP/"
exit 0
