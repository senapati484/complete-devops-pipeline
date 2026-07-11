# AWS EC2 Pipeline & Application Setup Guide

This guide walks you through setting up the complete DevOps CI/CD pipeline and dashboard application on a fresh AWS EC2 Instance running **Ubuntu 24.04 LTS** or **Ubuntu 26.04 LTS**.

---

## Prerequisites
* An AWS EC2 Instance (t3.micro or t3.small recommended - 2GB RAM is better for builds)
* Security Group Rules allowing:
  * **22** (SSH)
  * **80** (HTTP)
  * **8080** (Jenkins Web UI)

---

## Step 1: Install Docker & Docker Compose

Run the following commands on the fresh EC2 instance to install Docker:

```bash
# Update package database
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add ubuntu user to docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER
newgrp docker
```

---

## Step 2: Run Jenkins in Docker

We run Jenkins containerized, sharing the host's Docker daemon so Jenkins can run Docker-in-Docker commands (build, pull, push, run compose).

### 1. Create Directories and Set Permissions
```bash
# Create Jenkins directory on host
mkdir -p ~/jenkins_home

# Create Deployment directory for Next.js app on host
mkdir -p ~/deployments/devops-control-center

# Grant Jenkins user (uid 1000) write permissions to these directories
sudo chown -R 1000:1000 ~/jenkins_home
sudo chown -R 1000:1000 ~/deployments
```

### 2. Startup Jenkins Container
```bash
docker run -d \
  --name jenkins \
  --restart always \
  -p 8080:8080 \
  -p 50000:50000 \
  -v ~/jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  -v /usr/libexec/docker/cli-plugins/docker-compose:/usr/libexec/docker/cli-plugins/docker-compose \
  jenkins/jenkins:lts-jdk21
```

### 3. Change Permissions of Docker Socket
For Jenkins to communicate with the host's Docker socket, make it readable:
```bash
sudo chmod 666 /var/run/docker.sock
```
*(Note: You will need to run this command again if the EC2 host restarts).*

### 4. Fetch the Jenkins Initial Admin Password
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Go to `http://<EC2_PUBLIC_IP>:8080` in your browser and enter the password to unlock Jenkins. Select **Install Suggested Plugins**.

---

## Step 3: Configure Jenkins Credentials

Go to **Manage Jenkins** ➜ **Credentials** ➜ **System** ➜ **Global credentials** and add the following:

| Name (ID) | Type | Description / Value |
|---|---|---|
| `github` | Username with password | GitHub Username + Personal Access Token (PAT) with repo access |
| `dockerhub` | Username with password | Docker Hub Username + Personal Access Token (PAT) with write access |
| `DATABASE_URL` | Secret text | `postgresql://postgres:<PASSWORD>@postgres:5432/devops_dashboard` |
| `POSTGRES_PASSWORD` | Secret text | Secure password for PostgreSQL |
| `JWT_SECRET` | Secret text | Any random long secure string |
| `NEXTAUTH_SECRET` | Secret text | Any random long secure string |
| `NEXTAUTH_URL` | Secret text | `http://<EC2_PUBLIC_IP>` |

---

## Step 4: Create the CI/CD Pipeline Job

1. In Jenkins dashboard, click **New Item**.
2. Enter name `Complete-DevOps-Pipeline` and select **Pipeline**. Click **OK**.
3. Under **Pipeline**, change **Definition** to **Pipeline script from SCM**.
4. Set **SCM** to **Git**.
5. Set **Repository URL** to `https://github.com/<your-username>/complete-devops-pipeline.git`.
6. Set **Credentials** to the `github` credential we created.
7. Set **Branch Specifier** to `*/main`.
8. Click **Save**.

---

## Step 5: Run the First Build
1. Click **Build with Parameters** (or **Build Now** if parameters haven't loaded yet).
2. Once the build completes:
   * The app is live at `http://<EC2_PUBLIC_IP>/`.
   * Initialize dummy statistics by visiting `http://<EC2_PUBLIC_IP>/api/seed` in your browser or executing:
     ```bash
     curl "http://localhost/api/seed"
     ```
