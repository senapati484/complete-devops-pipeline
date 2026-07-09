pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "devops-dashboard"
        DOCKER_TAG = "${env.BUILD_ID}"
        REGISTRY_URL = "${env.DOCKER_REGISTRY_URL ?: 'localhost:5000'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('TypeScript Check') {
            steps {
                sh 'npx tsc --noEmit'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build \\
                        -f docker/Dockerfile \\
                        -t ${DOCKER_IMAGE}:${DOCKER_TAG} \\
                        -t ${DOCKER_IMAGE}:latest \\
                        .
                """
            }
        }

        stage('Push Docker Image') {
            when {
                expression { env.DOCKER_REGISTRY_URL != '' }
            }
            steps {
                sh """
                    docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${REGISTRY_URL}/${DOCKER_IMAGE}:${DOCKER_TAG}
                    docker tag ${DOCKER_IMAGE}:latest ${REGISTRY_URL}/${DOCKER_IMAGE}:latest
                    docker push ${REGISTRY_URL}/${DOCKER_IMAGE}:${DOCKER_TAG}
                    docker push ${REGISTRY_URL}/${DOCKER_IMAGE}:latest
                """
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    docker compose -f docker/docker-compose.yml down || true
                    docker compose -f docker/docker-compose.yml up -d
                """
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def healthUrl = "http://localhost:3000/api/health"
                    def retries = 12
                    def healthy = false
                    
                    for (int i = 0; i < retries; i++) {
                        try {
                            sh "wget --no-verbose --tries=1 --spider ${healthUrl} || curl -sf ${healthUrl} > /dev/null"
                            healthy = true
                            break
                        } catch (Exception e) {
                            echo "Health check attempt ${i + 1}/${retries} failed. Retrying..."
                            sleep(10)
                        }
                    }
                    
                    if (!healthy) {
                        error "Health check failed after ${retries} attempts"
                    }
                    echo "Health check passed!"
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed!'
        }
        always {
            cleanWs()
        }
    }
}
