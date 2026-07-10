pipeline {
    agent any

    environment {
        // --- Docker Hub Configuration ---
        DOCKER_USERNAME   = "senapati484"
        IMAGE_NAME        = "devops-control-center"
        IMAGE_TAG         = "${env.BUILD_ID}"
        FULL_IMAGE        = "${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
        FULL_IMAGE_LATEST = "${DOCKER_USERNAME}/${IMAGE_NAME}:latest"

        // --- Node & Build ---
        NODE_VERSION      = "22"
        // Cap V8 heap on host-side stages. t2.micro has 1 GB total and Jenkins
        // already uses ~430 MB, so we have ~150 MB to run npm/tsc. Setting
        // --max-old-space-size forces V8 to swap to disk instead of being OOM-killed
        // by the kernel when a single stage briefly exceeds the limit.
        NODE_OPTIONS      = "--max-old-space-size=512"

        // --- Deployment ---
        COMPOSE_PROJECT   = "devops-control-center"
        DEPLOY_DIR        = "/var/jenkins_home/deployments/${IMAGE_NAME}"
        HEALTH_URL        = "http://localhost/api/health"
        HEALTH_RETRIES    = "12"
        HEALTH_INTERVAL   = "10"

        // --- Credential IDs (configure in Jenkins → Manage Credentials) ---
        GITHUB_CRED           = "github"
        DOCKER_HUB_CRED       = "dockerhub"
        DB_URL_CRED           = "DATABASE_URL"
        JWT_SECRET_CRED       = "JWT_SECRET"
        NEXTAUTH_SECRET_CRED  = "NEXTAUTH_SECRET"
        NEXTAUTH_URL_CRED     = "NEXTAUTH_URL"
        POSTGRES_PASSWORD_CRED = "POSTGRES_PASSWORD"
    }

    options {
        timestamps()
        ansiColor("xterm")
        buildDiscarder(logRotator(numToKeepStr: "10"))
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timeout(time: 30, unit: "MINUTES")
    }

    parameters {
        choice(
            name: "ENVIRONMENT",
            choices: ["staging", "production"],
            description: "Target deployment environment"
        )
        string(
            name: "BRANCH",
            defaultValue: "main",
            description: "Git branch to deploy"
        )
    }

    stages {
        // ──────────────────────────────────────────────
        // 1. CHECKOUT
        // ──────────────────────────────────────────────
        stage("Checkout") {
            steps {
                checkout([
                    $class: "GitSCM",
                    branches: [[name: "*/${params.BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "https://github.com/senapati484/complete-devops-pipeline.git",
                        credentialsId: "${GITHUB_CRED}"
                    ]]
                ])
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
            post {
                success {
                    echo "Checked out: ${env.BRANCH} @ ${env.GIT_COMMIT_SHORT}"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 2. BUILD INFO
        //     Sets human-readable build display name.
        // ──────────────────────────────────────────────
        stage("Build Info") {
            steps {
                script {
                    currentBuild.displayName = "#${env.BUILD_NUMBER} - ${params.BRANCH}"
                    currentBuild.description = "${env.GIT_COMMIT_SHORT}"
                    echo "Build: ${currentBuild.displayName}"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 3. SETUP NODE
        //     Runs before Pre-flight Checks so node/npm
        //     are in PATH when we verify them.
        // ──────────────────────────────────────────────
        stage("Setup Node") {
            steps {
                script {
                    // Try the Jenkins-managed NodeJS tool first (configure one in
                    // Manage Jenkins → Tools if you want a specific version).
                    // Fall back to a system node, and if neither exists, install
                    // nodejs via apt so the build is self-healing on a fresh
                    // jenkins/jenkins image.
                    try {
                        env.NODEJS_HOME = tool name: "NodeJS ${NODE_VERSION}", type: "nodejs"
                        env.PATH = "${env.NODEJS_HOME}/bin:${env.PATH}"
                    } catch (Exception e) {
                        echo "NodeJS tool not configured in Jenkins; checking for system node ..."
                    }

                    if (!fileExists("/usr/bin/node") && !sh(script: "command -v node", returnStatus: true).equals(0)) {
                        echo "node not found; installing via apt (Debian/Ubuntu jenkins image) ..."
                        sh """
                            if command -v apt-get >/dev/null 2>&1; then
                                apt-get update -qq
                                apt-get install -y -qq --no-install-recommends nodejs npm
                                rm -rf /var/lib/apt/lists/*
                            elif command -v yum >/dev/null 2>&1; then
                                yum install -y -q nodejs npm
                            elif command -v dnf >/dev/null 2>&1; then
                                dnf install -y -q nodejs npm
                            else
                                echo "No supported package manager found; cannot install node"
                                exit 1
                            fi
                        """
                    }

                    sh "node --version"
                    sh "npm --version"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 3. PRE-FLIGHT CHECKS
        //     Fail fast if required tooling is missing.
        // ──────────────────────────────────────────────
        stage("Pre-flight Checks") {
            steps {
                sh """
                    echo "=== Tool Versions ==="
                    docker --version
                    docker compose version
                    git --version
                    node --version
                    npm --version
                    echo "=== All tools available ==="

                    # Fail fast with a clear error if Jenkins can't drive the host's Docker daemon.
                    # This is the most common first-build failure on EC2: the socket is bind-mounted
                    # but the jenkins user lacks the host's docker group membership.
                    if ! docker info >/dev/null 2>&1; then
                        echo ""
                        echo "┌──────────────────────────────────────────────────────────────┐"
                        echo "│  DOCKER SOCKET UNREACHABLE FROM JENKINS                      │"
                        echo "│                                                              │"
                        echo "│  Jenkins is running in a container but cannot drive the host │"
                        echo "│  Docker daemon. The socket is mounted but the jenkins user   │"
                        echo "│  lacks the host's docker group membership.                   │"
                        echo "│                                                              │"
                        echo "│  Fix on the EC2 host:                                        │"
                        echo "│    HOST_DOCKER_GID=\$(stat -c %g /var/run/docker.sock)       │"
                        echo "│    docker stop jenkins                                       │"
                        echo "│    docker run -d --name jenkins \\                           │"
                        echo "│      --group-add \$HOST_DOCKER_GID \\                        │"
                        echo "│      -v /var/run/docker.sock:/var/run/docker.sock \\         │"
                        echo "│      -v /usr/bin/docker:/usr/bin/docker \\                   │"
                        echo "│      -p 8080:8080 -p 50000:50000 \\                          │"
                        echo "│      --restart unless-stopped \\                             │"
                        echo "│      jenkins/jenkins:lts-jdk21                               │"
                        echo "└──────────────────────────────────────────────────────────────┘"
                        exit 1
                    fi
                """
            }
        }

        // ──────────────────────────────────────────────
        // 4. INSTALL DEPENDENCIES
        //     Single host-side npm ci. The host stages that follow
        //     (lint, tsc) only need this. next build and prisma generate
        //     run inside the Docker builder, so we skip them on the
        //     host to stay within t2.micro's 1 GB memory budget.
        // ──────────────────────────────────────────────
        stage("Install Dependencies") {
            steps {
                sh """
                    # --prefer-offline + --no-audit + --no-fund keep peak RSS of the
                    # npm subprocess well under 200 MB on a 1 GB host.
                    npm ci --prefer-offline --no-audit --no-fund
                """
            }
        }

        // ──────────────────────────────────────────────
        // 5. LINT
        // ──────────────────────────────────────────────
        stage("Lint") {
            steps {
                sh "npm run lint"
            }
        }

        // ──────────────────────────────────────────────
        // 6. TYPE CHECK
        //     Prisma Generate + next build deliberately moved INTO the
        //     Docker builder stage. They were duplicating work and their
        //     host-side memory peaks (1.2 GB for next build) OOM-killed
        //     Jenkins on the t2.micro instance.
        // ──────────────────────────────────────────────
        stage("TypeScript Check") {
            steps {
                sh "npx tsc --noEmit"
            }
        }

        // ──────────────────────────────────────────────
        // 9. BUILD DOCKER IMAGE
        //     The Dockerfile handles its own npm install,
        //     prisma generate, and next build inside the
        //     builder stage — no stashes needed here.
        // ──────────────────────────────────────────────
        stage("Build Docker Image") {
            steps {
                script {
                    try {
                        sh "docker version --format '{{.Server.Version}}'"
                    } catch (Exception e) {
                        error """
                        ┌──────────────────────────────────────────────┐
                        │  Docker is not accessible inside Jenkins.    │
                        │                                              │
                        │  On EC2, run:                                │
                        │    docker exec -it jenkins docker version    │
                        │                                              │
                        │  If it fails, mount the Docker socket:       │
                        │    docker run ... -v /var/run/docker.sock:/  │
                        │         var/run/docker.sock ...              │
                        └──────────────────────────────────────────────┘
                        """
                    }
                }
                sh """
                    # BUILDKIT_PROGRESS=plain keeps BuildKit from buffering
                    # interactive progress state in memory on the daemon.
                    # --memory / --memory-swap cap the build container so it
                    # can't OOM-kill the whole 1 GB host.
                    DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain \
                    docker build \
                        --pull \
                        --memory=768m \
                        --memory-swap=1536m \
                        -f docker/Dockerfile \
                        -t ${FULL_IMAGE} \
                        -t ${FULL_IMAGE_LATEST} \
                        .
                """
            }
        }

        // ──────────────────────────────────────────────
        // 10. LOGIN TO DOCKER HUB
        // ──────────────────────────────────────────────
        stage("Docker Hub Login") {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${DOCKER_HUB_CRED}",
                        usernameVariable: "DOCKER_USER",
                        passwordVariable: "DOCKER_PASS"
                    )
                ]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker info"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 11. PUSH IMAGE TO DOCKER HUB
        // ──────────────────────────────────────────────
        stage("Push Docker Image") {
            steps {
                sh "docker push ${FULL_IMAGE}"
                sh "docker push ${FULL_IMAGE_LATEST}"
            }
        }

        // ──────────────────────────────────────────────
        // 12. DEPLOY WITH DOCKER COMPOSE
        //     Pulls the new image, then recreates only
        //     changed containers. PostgreSQL starts first
        //     (Docker Compose health check ensures it's ready
        //     before the app starts). Prisma migrations run
        //     via docker-entrypoint.sh on app container start.
        // ──────────────────────────────────────────────
        stage("Deploy") {
            steps {
                withCredentials([
                    string(credentialsId: "${DB_URL_CRED}", variable: "DATABASE_URL"),
                    string(credentialsId: "${JWT_SECRET_CRED}", variable: "JWT_SECRET"),
                    string(credentialsId: "${NEXTAUTH_SECRET_CRED}", variable: "NEXTAUTH_SECRET"),
                    string(credentialsId: "${NEXTAUTH_URL_CRED}", variable: "NEXTAUTH_URL"),
                    string(credentialsId: "${POSTGRES_PASSWORD_CRED}", variable: "POSTGRES_PASSWORD")
                ]) {
                    script {
                        // Wipe the deploy dir on every run so stale files
                        // (especially the nginx.conf directory bug from
                        // earlier builds) can't poison the next deploy.
                        sh "rm -rf ${DEPLOY_DIR} && mkdir -p ${DEPLOY_DIR}"

                        writeFile(
                            file: "${DEPLOY_DIR}/docker-compose.yml",
                            text: deployComposeTemplate(
                                env.IMAGE_TAG,
                                env.DOCKER_USERNAME,
                                env.IMAGE_NAME
                            )
                        )

                        writeFile(
                            file: "${DEPLOY_DIR}/.env",
                            text: """
                                DATABASE_URL=${DATABASE_URL}
                                JWT_SECRET=${JWT_SECRET}
                                NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
                                NEXTAUTH_URL=${NEXTAUTH_URL}
                                POSTGRES_USER=postgres
                                POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
                                POSTGRES_DB=devops_dashboard
                                NODE_ENV=production
                            """.stripIndent()
                        )

                        // Write nginx config alongside the compose file
                        // (using writeFile + readFile instead of `cp` to avoid
                        // any working-directory surprises in the workspace)
                        writeFile(
                            file: "${DEPLOY_DIR}/nginx.conf",
                            text: readFile("nginx/nginx.conf")
                        )

                        sh "docker pull ${FULL_IMAGE}"
                        sh "docker compose --project-name ${COMPOSE_PROJECT} -f ${DEPLOY_DIR}/docker-compose.yml pull"
                        sh "docker compose --project-name ${COMPOSE_PROJECT} -f ${DEPLOY_DIR}/docker-compose.yml up -d --remove-orphans"
                    }
                }
            }
        }

        // ──────────────────────────────────────────────
        // 13. HEALTH CHECK (with automatic rollback)
        // ──────────────────────────────────────────────
        stage("Health Check") {
            steps {
                script {
                    def healthy = false
                    def attempts = HEALTH_RETRIES.toInteger()

                    echo "Running health check against ${HEALTH_URL} ..."

                    for (int i = 0; i < attempts; i++) {
                        try {
                            sh """
                                curl -sf ${HEALTH_URL} 2>/dev/null \\
                                    | python3 -c \\
                                        "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status')=='ok' else 1)"
                            """.stripIndent().replaceAll("\\n", " ")
                            healthy = true
                            echo "Health check passed! (attempt ${i + 1}/${attempts})"
                            break
                        } catch (Exception e) {
                            echo "Health check attempt ${i + 1}/${attempts} failed -- retrying in ${HEALTH_INTERVAL}s ..."
                            sleep(time: HEALTH_INTERVAL.toInteger(), unit: "SECONDS")
                        }
                    }

                    if (!healthy) {
                        error """
                        ┌──────────────────────────────────────────────┐
                        │  HEALTH CHECK FAILED                        │
                        │  Rolling back to previous stable version... │
                        └──────────────────────────────────────────────┘
                        """
                    }
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    // POST-BUILD ACTIONS
    // ──────────────────────────────────────────────
    post {
        success {
            script {
                echo """
                ┌──────────────────────────────────────────────┐
                │  DEPLOYMENT SUCCESSFUL                       │
                │  Image : ${FULL_IMAGE}                       │
                │  Branch: ${env.BRANCH}                       │
                │  Commit: ${env.GIT_COMMIT_SHORT}             │
                │  Env   : ${params.ENVIRONMENT}               │
                └──────────────────────────────────────────────┘
                """.stripIndent()
            }
        }

        failure {
            script {
                echo """
                ┌──────────────────────────────────────────────┐
                │  DEPLOYMENT FAILED                           │
                │  Branch: ${env.BRANCH}                       │
                │  Commit: ${env.GIT_COMMIT_SHORT}             │
                │  Rolling back to previous stable version...  │
                └──────────────────────────────────────────────┘
                """.stripIndent()

                sh """
                    docker compose \\
                        --project-name ${COMPOSE_PROJECT} \\
                        -f ${DEPLOY_DIR}/docker-compose.yml \\
                        down --remove-orphans || true
                """
                sh """
                    docker pull ${FULL_IMAGE_LATEST}
                    docker compose \\
                        --project-name ${COMPOSE_PROJECT} \\
                        -f ${DEPLOY_DIR}/docker-compose.yml \\
                        up -d --remove-orphans
                """
            }
        }

        always {
            script {
                echo "Cleaning up workspace ..."
                cleanWs()

                sh "docker logout || true"

                sh """
                    docker images ${DOCKER_USERNAME}/${IMAGE_NAME} \\
                        --format "{{.CreatedAt}}\\t{{.Repository}}:{{.Tag}}" \\
                        | sort -r \\
                        | tail -n +6 \\
                        | cut -f2 \\
                        | xargs -r docker rmi || true
                """
            }
        }
    }
}

// ──────────────────────────────────────────────
// HELPER: Generate docker-compose.yml for deployment
//     PostgreSQL runs inside Docker alongside the app.
//     Nginx proxies public port 80 to the app.
// ──────────────────────────────────────────────
def deployComposeTemplate(imageTag, dockerUsername, imageName) {
    return """
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: devops-postgres
    restart: unless-stopped
    env_file:
      - .env
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB:-devops_dashboard}
    expose:
      - "5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  app:
    image: ${dockerUsername}/${imageName}:${imageTag}
    container_name: devops-app
    restart: unless-stopped
    expose:
      - "3000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: devops-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
""".stripIndent()
}
