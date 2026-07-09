#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# smoke-test.sh — verify a deployed instance actually serves real content.
#
# Runs on the EC2 host, hits the app on localhost (which Nginx listens on).
# This is what proves Jenkins saying "success" wasn't a lie.
#
# Usage:
#   chmod +x smoke-test.sh
#   ./smoke-test.sh
#
# Optional:
#   PUBLIC_IP   override the auto-detected public IP used in the report
# ─────────────────────────────────────────────────────────────────────────────
set -u

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

pass() { PASS=$((PASS+1)); printf "${GREEN}✓${NC} %s\n" "$1"; }
fail() { FAIL=$((FAIL+1)); printf "${RED}✗${NC} %s\n" "$1"; }
info() { printf "${BLUE}»${NC} %s\n" "$1"; }
section() { echo; printf "${BLUE}━━━ %s ━━━${NC}\n" "$1"; }

PUBLIC_IP="${PUBLIC_IP:-$(curl -fsS --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<unavailable>')}"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DevOps Control Center — Post-deploy Smoke Test             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo
info "Target: http://localhost/  (public: http://$PUBLIC_IP/)"

# ─── 1. Container health ────────────────────────────────────────────────────
section "Container status"
EXPECTED=("devops-postgres" "devops-app" "devops-nginx")
for c in "${EXPECTED[@]}"; do
    status=$(docker inspect --format '{{.State.Status}}' "$c" 2>/dev/null || echo "missing")
    health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$c" 2>/dev/null || echo "missing")
    case "$status:$health" in
        running:healthy)   pass "$c — running + healthy" ;;
        running:no-healthcheck) pass "$c — running" ;;
        running:starting)  info "$c — running but healthcheck still starting..." ;;
        *)                 fail "$c — status=$status health=$health" ;;
    esac
done

# ─── 2. HTTP endpoints ──────────────────────────────────────────────────────
section "HTTP endpoints"

check_endpoint() {
    local path="$1" expect_status="$2" expect_substring="$3"
    local body status code

    body=$(mktemp)
    code=$(curl -sS -o "$body" -w "%{http_code}" --max-time 10 "http://localhost$path" 2>/dev/null || echo "000")
    status="$code"

    if [ "$status" != "$expect_status" ]; then
        fail "$path — expected HTTP $expect_status, got $status"
        rm -f "$body"
        return 1
    fi

    if [ -n "$expect_substring" ] && ! grep -q "$expect_substring" "$body"; then
        fail "$path — HTTP $status but missing expected substring: $expect_substring"
        rm -f "$body"
        return 1
    fi

    pass "$path — HTTP $status${expect_substring:+ (contains '$expect_substring')}"
    rm -f "$body"
}

check_endpoint "/api/health" 200 '"status":"ok"'
check_endpoint "/"          200 ""
check_endpoint "/login"     200 ""

# ─── 3. Postgres reachability from inside the app network ─────────────────
section "Database connectivity"
if docker exec devops-postgres pg_isready -U postgres -d devops_dashboard >/dev/null 2>&1; then
    pass "Postgres ready for devops_dashboard"
else
    fail "Postgres NOT ready. Check: docker logs devops-postgres"
fi

# ─── 4. Network: container-to-container ─────────────────────────────────────
section "Container-to-container network"
if docker exec devops-app sh -c 'wget -qO- http://app:3000/api/health 2>/dev/null | grep -q "ok"' >/dev/null 2>&1; then
    pass "app container can reach itself on app:3000"
else
    fail "app container cannot reach itself. Network misconfigured?"
fi

if docker exec devops-nginx sh -c 'wget -qO- http://app:3000/api/health 2>/dev/null | grep -q "ok"' >/dev/null 2>&1; then
    pass "nginx upstream (app:3000) responding"
else
    fail "nginx cannot reach app:3000. Check depends_on ordering."
fi

# ─── Summary ────────────────────────────────────────────────────────────────
echo
echo "══════════════════════════════════════════════════════════════"
printf "  ${GREEN}Passed${NC}: %d   ${RED}Failed${NC}: %d\n" "$PASS" "$FAIL"
echo "══════════════════════════════════════════════════════════════"
echo

if [ "$FAIL" -gt 0 ]; then
    echo "${RED}✗ Smoke test FAILED.${NC} The deploy is not healthy."
    echo "  Diagnostic commands:"
    echo "    docker ps -a"
    echo "    docker logs devops-app --tail 50"
    echo "    docker logs devops-nginx --tail 50"
    echo "    docker logs devops-postgres --tail 50"
    exit 1
fi

echo "${GREEN}✓ All smoke tests passed.${NC} The deployment is live and serving real traffic."
echo "  Open: http://$PUBLIC_IP/"
exit 0
