# Running & Restarting the Application Stack

This guide explains how to start, stop, restart, and monitor the various components of the **DevOps Control Center** stack.

---

## 1. Quick Restarts (Most Common)

If you made environment variable changes or just need to restart a specific container on the EC2 host:

### Restart the Next.js App
```bash
docker compose -p devops-control-center restart app
```

### Restart Nginx (Web Server)
```bash
docker compose -p devops-control-center restart web
```

### Restart PostgreSQL (Database)
```bash
docker compose -p devops-control-center restart postgres
```

### Restart Everything
```bash
docker compose -p devops-control-center restart
```

---

## 2. Full Stop and Start

If you need to completely recreate the containers or apply new `.env` settings manually:

```bash
# Change to the deployments directory
cd ~/deployments/devops-control-center

# Stop the stack (does NOT lose database data because of the volume)
docker compose down

# Start the stack back up in the background
docker compose up -d
```

---

## 3. Monitoring & Logs

To check if everything is running correctly or debug errors:

### View Live Logs for the App
```bash
docker logs devops-app -f
```

### View Live Logs for Nginx
```bash
docker logs devops-nginx -f
```

### View Live Logs for Postgres
```bash
docker logs devops-postgres -f
```

### Check Container Status
```bash
docker ps -a
```

---

## 4. Resetting/Wiping the Database

If you want to clear all data and start from a clean slate:

```bash
cd ~/deployments/devops-control-center
docker compose down -v  # Wipes the postgres_data volume
docker compose up -d    # Starts clean database
```
*Note: The Next.js app will automatically run Prisma migrations and push the schema on startup.*

---

## 5. Seeding Demo Data

If the database was wiped or is empty, call the seed API to populate it:
```bash
curl "http://localhost/api/seed"
```
*(Or access `http://<EC2_PUBLIC_IP>/api/seed` in your browser).*
