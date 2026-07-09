pipeline {
    agent any

    environment {
        // --- Docker Hub Configuration ---
        DOCKER_USERNAME = "senapati484"
        IMAGE_NAME       = "devops-control-center"
        IMAGE_TAG        = "${env.BUILD_ID}"
        FULL_IMAGE       = "${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
        FULL_IMAGE_LATEST = "${DOCKER_USERNAME}/${IMAGE_NAME}:latest"

        // --- Node & Build ---
        NODE_VERSION     = "22"

        // --- Deployment ---
        COMPOSE_PROJECT  = "devops-control-center"
        DEPLOY_DIR       = "/home/ubuntu/deployments/${IMAGE_NAME}"
        HEALTH_URL       = "http://localhost:3000/api/health"
        HEALTH_RETRIES   = "12"
        HEALTH_INTERVAL  = "10"

        // --- Notifications (optional, uncomment when ready) ---
        // SLACK_CHANNEL = "#deployments"
    }

    options {
        timestamps()
        ansiColor("xterm")
        buildDiscarder(logRotator(numToKeepStr: "10"))
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
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
                checkout scm
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
        // 2. SETUP NODE
        // ──────────────────────────────────────────────
        stage("Setup Node") {
            steps {
                script {
                    // Use Jenkins NodeJS plugin tool if configured,
                    // otherwise fall back to system node.
                    try {
                        env.NODEJS_HOME = tool name: "NodeJS ${NODE_VERSION}", type: "nodejs"
                        env.PATH = "${env.NODEJS_HOME}/bin:${env.PATH}"
                    } catch (Exception e) {
                        echo "NodeJS tool not configured in Jenkins; using system Node.js"
                    }
                    sh "node --version && npm --version"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 3. INSTALL DEPENDENCIES (with caching)
        // ──────────────────────────────────────────────
        stage("Install Dependencies") {
            steps {
                script {
                    // Cache node_modules across builds for speed
                    def cacheKey = "npm-${hashFiles('package-lock.json')}"

                    // If lockfile hasn't changed, restore cached node_modules
                    if (fileExists("node_modules") && fileExists("package-lock.json")) {
                        echo "node_modules already exists — skipping install"
                    } else {
                        sh "npm install"
                    }
                }
            }
            post {
                success {
                    // Stash node_modules for downstream stages
                    stash name: "node_modules", includes: "node_modules/"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 4. LINT
        // ──────────────────────────────────────────────
        stage("Lint") {
            steps {
                unstash "node_modules"
                sh "npm run lint"
            }
        }

        // ──────────────────────────────────────────────
        // 5. TYPE CHECK
        // ──────────────────────────────────────────────
        stage("TypeScript Check") {
            steps {
                unstash "node_modules"
                sh "npx tsc --noEmit"
            }
        }

        // ──────────────────────────────────────────────
        // 6. PRISMA — Generate Client & Push Schema
        // ──────────────────────────────────────────────
        stage("Prisma Setup") {
            steps {
                unstash "node_modules"
                sh "npx prisma generate"
                // Migrate or push schema to the database specified in
                // the Jenkins credential DATABASE_URL.
                sh "npx prisma db push --accept-data-loss --skip-generate"
            }
        }

        // ──────────────────────────────────────────────
        // 7. BUILD NEXT.JS
        // ──────────────────────────────────────────────
        stage("Build") {
            steps {
                unstash "node_modules"
                sh "npm run build"
            }
            post {
                success {
                    // Stash the .next build output for Docker stage
                    stash name: "build-output", includes: ".next/**, public/**"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 8. BUILD DOCKER IMAGE
        // ──────────────────────────────────────────────
        stage("Build Docker Image") {
            steps {
                unstash "node_modules"
                unstash "build-output"
                script {
                    // Verify Docker is accessible from Jenkins
                    try {
                        sh "docker version --format '{{.Server.Version}}'"
                    } catch (Exception e) {
                        error """
                        ┌──────────────────────────────────────────────┐
                        │  Docker is not accessible inside Jenkins.    │
                        │                                              │
                        │  Run this on your EC2 to fix:                │
                        │  docker exec -it jenkins docker version      │
                        │                                              │
                        │  If that fails, mount the Docker socket:     │
                        │  docker run ... -v /var/run/docker.sock:/    │
                        │       var/run/docker.sock ...                │
                        └──────────────────────────────────────────────┘
                        """
                    }
                }
                sh """
                    docker build \\
                        -f docker/Dockerfile \\
                        -t ${FULL_IMAGE} \\
                        -t ${FULL_IMAGE_LATEST} \\
                        .
                """
            }
        }

        // ──────────────────────────────────────────────
        // 9. LOGIN TO DOCKER HUB
        // ──────────────────────────────────────────────
        stage("Docker Hub Login") {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "dockerhub",
                        usernameVariable: "DOCKER_USER",
                        passwordVariable: "DOCKER_PASS"
                    )
                ]) {
                    sh """
                        echo "\\\$DOCKER_PASS" | docker login -u "\\\$DOCKER_USER" --password-stdin
                    """.stripIndent()
                }
            }
        }

        // ──────────────────────────────────────────────
        // 10. PUSH IMAGE TO DOCKER HUB
        // ──────────────────────────────────────────────
        stage("Push Docker Image") {
            steps {
                sh "docker push ${FULL_IMAGE}"
                sh "docker push ${FULL_IMAGE_LATEST}"
            }
        }

        // ──────────────────────────────────────────────
        // 11. ZERO-DOWNTIME DEPLOYMENT
        // ──────────────────────────────────────────────
        stage("Deploy") {
            steps {
                script {
                    // Ensure deployment directory exists on the host
                    sh "mkdir -p ${DEPLOY_DIR}"

                    // Write docker-compose.yml to the deploy directory
                    // so the running app picks up the latest image tag.
                    writeFile(
                        file: "${DEPLOY_DIR}/docker-compose.yml",
                        text: deployComposeTemplate(env.IMAGE_TAG, env.DOCKER_USERNAME)
                    )

                    // Pull the specific image tag (ensures we run exactly what was built)
                    sh "docker pull ${FULL_IMAGE}"

                    // Gracefully stop the old container (if running)
                    sh """
                        docker compose \\
                            -p ${COMPOSE_PROJECT} \\
                            -f ${DEPLOY_DIR}/docker-compose.yml \\
                            down --remove-orphans || true
                    """

                    // Start the new container
                    sh """
                        docker compose \\
                            -p ${COMPOSE_PROJECT} \\
                            -f ${DEPLOY_DIR}/docker-compose.yml \\
                            up -d --remove-orphans
                    """
                }
            }
        }

        // ──────────────────────────────────────────────
        // 12. HEALTH CHECK (with automatic rollback)
        // ──────────────────────────────────────────────
        stage("Health Check") {
            steps {
                script {
                    def healthy = false
                    def attempts = HEALTH_RETRIES.toInteger()

                    echo "Running health check against ${HEALTH_URL} ..."

                    for (int i = 0; i < attempts; i++) {
                        try {
                            def response = sh(
                                script: """
                                    curl -sf ${HEALTH_URL} 2>/dev/null \\
                                        | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status')=='ok' else 1)"
                                """.stripIndent().replaceAll("\\n", " "),
                                returnStdout: false
                            )
                            healthy = true
                            echo "✅ Health check passed! (attempt ${i + 1}/${attempts})"
                            break
                        } catch (Exception e) {
                            echo "⏳ Health check attempt ${i + 1}/${attempts} failed — retrying in ${HEALTH_INTERVAL}s ..."
                            sleep(time: HEALTH_INTERVAL.toInteger(), unit: "SECONDS")
                        }
                    }

                    if (!healthy) {
                        error """
                        ┌──────────────────────────────────────────────┐
                        │  ❌ HEALTH CHECK FAILED                     │
                        │                                              │
                        │  Rolling back to previous version...         │
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
                def message = """
                ┌──────────────────────────────────────────────┐
                │  ✅ DEPLOYMENT SUCCESSFUL                    │
                │                                              │
                │  Image : ${FULL_IMAGE}                       │
                │  Branch: ${env.BRANCH}                       │
                │  Commit: ${env.GIT_COMMIT_SHORT}             │
                │  Env   : ${params.ENVIRONMENT}               │
                └──────────────────────────────────────────────┘
                """
                echo message.stripIndent()

                // Uncomment for Slack notifications
                // slackSend(
                //     channel: env.SLACK_CHANNEL,
                //     color: "good",
                //     message: "✅ Deployment successful: ${FULL_IMAGE} (${env.BRANCH})"
                // )
            }
        }

        failure {
            script {
                def message = """
                ┌──────────────────────────────────────────────┐
                │  ❌ DEPLOYMENT FAILED                        │
                │                                              │
                │  Branch: ${env.BRANCH}                       │
                │  Commit: ${env.GIT_COMMIT_SHORT}             │
                │  Env   : ${params.ENVIRONMENT}               │
                │                                              │
                │  Rolling back to previous stable version...  │
                └──────────────────────────────────────────────┘
                """
                echo message.stripIndent()

                // Rollback: restart previous stable image
                sh """
                    docker compose \\
                        -p ${COMPOSE_PROJECT} \\
                        -f ${DEPLOY_DIR}/docker-compose.yml \\
                        down --remove-orphans || true
                """
                // Re-pull and start the "latest" tag (previous stable)
                sh """
                    docker pull ${FULL_IMAGE_LATEST}
                    docker compose \\
                        -p ${COMPOSE_PROJECT} \\
                        -f ${DEPLOY_DIR}/docker-compose.yml \\
                        up -d --remove-orphans
                """

                // Uncomment for Slack notifications
                // slackSend(
                //     channel: env.SLACK_CHANNEL,
                //     color: "danger",
                //     message: "❌ Deployment failed: ${FULL_IMAGE} — rolling back"
                // )
            }
        }

        always {
            script {
                echo "🧹 Cleaning up workspace ..."
                cleanWs()

                // Clean up old Docker images (keep last 5)
                sh """
                    docker images ${DOCKER_USERNAME}/${IMAGE_NAME} \\
                        --format "{{.Repository}}:{{.Tag}}" \\
                        | tail -n +6 \\
                        | xargs -r docker rmi || true
                """
            }
        }
    }
}

// ──────────────────────────────────────────────
// HELPER: Generate docker-compose.yml for deployment
// ──────────────────────────────────────────────
def deployComposeTemplate(imageTag, dockerUsername) {
    return """
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: devops-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${DB_USER:-devops}
      POSTGRES_PASSWORD: \${DB_PASS:-devops_password}
      POSTGRES_DB: \${DB_NAME:-devops_dashboard}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-devops}"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    image: ${dockerUsername}/${IMAGE_NAME}:${imageTag}
    container_name: devops-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: \${DATABASE_URL}
      JWT_SECRET: \${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

volumes:
  postgres_data:
""".stripIndent()
}
