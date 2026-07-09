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

        // --- Deployment ---
        COMPOSE_PROJECT   = "devops-control-center"
        DEPLOY_DIR        = "/home/ubuntu/deployments/${IMAGE_NAME}"
        HEALTH_URL        = "http://localhost/api/health"
        HEALTH_RETRIES    = "12"
        HEALTH_INTERVAL   = "10"

        // --- Credential IDs (configure in Jenkins → Manage Credentials) ---
        DOCKER_HUB_CRED   = "dockerhub"
        DB_URL_CRED       = "DATABASE_URL"
        JWT_SECRET_CRED   = "JWT_SECRET"
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
        //     Runs before Pre-flight Checks so node/npm
        //     are in PATH when we verify them.
        // ──────────────────────────────────────────────
        stage("Setup Node") {
            steps {
                script {
                    try {
                        env.NODEJS_HOME = tool name: "NodeJS ${NODE_VERSION}", type: "nodejs"
                        env.PATH = "${env.NODEJS_HOME}/bin:${env.PATH}"
                    } catch (Exception e) {
                        echo "NodeJS tool not configured in Jenkins; using system Node.js"
                    }
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
                """
            }
        }

        // ──────────────────────────────────────────────
        // 4. INSTALL DEPENDENCIES
        // ──────────────────────────────────────────────
        stage("Install Dependencies") {
            steps {
                sh "npm install"
            }
            post {
                success {
                    stash name: "node_modules", includes: "node_modules/"
                }
            }
        }

        // ──────────────────────────────────────────────
        // 5. LINT
        // ──────────────────────────────────────────────
        stage("Lint") {
            steps {
                unstash "node_modules"
                sh "npm run lint"
            }
        }

        // ──────────────────────────────────────────────
        // 6. TYPE CHECK
        // ──────────────────────────────────────────────
        stage("TypeScript Check") {
            steps {
                unstash "node_modules"
                sh "npx tsc --noEmit"
            }
        }

        // ──────────────────────────────────────────────
        // 7. PRISMA GENERATE (client only — no DB needed)
        // ──────────────────────────────────────────────
        stage("Prisma Generate") {
            steps {
                unstash "node_modules"
                sh "npx prisma generate"
            }
        }

        // ──────────────────────────────────────────────
        // 8. BUILD NEXT.JS
        // ──────────────────────────────────────────────
        stage("Build") {
            steps {
                unstash "node_modules"
                sh "npm run build"
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
                        │    docker exec -it jenkins docker version     │
                        │                                              │
                        │  If it fails, mount the Docker socket:        │
                        │    docker run ... -v /var/run/docker.sock:/   │
                        │         var/run/docker.sock ...               │
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
        //     changed containers — PostgreSQL stays up.
        //     Prisma migrations run via docker-entrypoint.sh
        //     inside the app container on start.
        // ──────────────────────────────────────────────
        stage("Deploy") {
            steps {
                withCredentials([
                    string(credentialsId: "${DB_URL_CRED}", variable: "DATABASE_URL"),
                    string(credentialsId: "${JWT_SECRET_CRED}", variable: "JWT_SECRET")
                ]) {
                    script {
                        sh "mkdir -p ${DEPLOY_DIR}"

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
                            """.stripIndent()
                        )

                        // Copy nginx config alongside the compose file
                        sh "cp nginx/nginx.conf ${DEPLOY_DIR}/nginx.conf"

                        sh "docker pull ${FULL_IMAGE}"
                        sh "docker compose -p ${COMPOSE_PROJECT} -f ${DEPLOY_DIR}/docker-compose.yml up -d --remove-orphans"
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
                        -p ${COMPOSE_PROJECT} \\
                        -f ${DEPLOY_DIR}/docker-compose.yml \\
                        down --remove-orphans || true
                """
                sh """
                    docker pull ${FULL_IMAGE_LATEST}
                    docker compose \\
                        -p ${COMPOSE_PROJECT} \\
                        -f ${DEPLOY_DIR}/docker-compose.yml \\
                        up -d --remove-orphans
                """
            }
        }

        always {
            script {
                echo "Cleaning up workspace ..."
                cleanWs()

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
//     Includes Nginx reverse proxy, PostgreSQL, and
//     the Next.js app on an isolated network.
// ──────────────────────────────────────────────
def deployComposeTemplate(imageTag, dockerUsername, imageName) {
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
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://nginx/api/health"]
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
