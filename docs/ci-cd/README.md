# CI/CD Pipeline Documentation

## Overview

This document provides complete, production-ready CI/CD pipeline implementations for the OCRS project using both **GitHub Actions** and **Jenkins**.

---

## Table of Contents

1. [Pipeline Comparison](#pipeline-comparison)
2. [GitHub Actions Implementation](#github-actions-implementation)
3. [Jenkins Implementation](#jenkins-implementation)
4. [Best Practices](#best-practices)
5. [Migration Guide](#migration-guide)

---

## Pipeline Comparison

| Feature | GitHub Actions | Jenkins |
|---------|---------------|---------|
| **Hosting** | Cloud (GitHub) | Self-hosted |
| **Cost** | Free for public repos | Infrastructure cost |
| **Configuration** | YAML files in repo | Jenkinsfile or UI |
| **Scalability** | Auto-scaling runners | Manual agent setup |
| **Secrets Management** | GitHub Secrets | Jenkins Credentials |
| **Docker Integration** | Excellent | Excellent |
| **Learning Curve** | Low | Medium |
| **Customization** | Moderate | High |

### Recommendation

- **GitHub Actions**: Best for teams already on GitHub, simpler setup
- **Jenkins**: Best for enterprise environments requiring fine-grained control

---

## GitHub Actions Implementation

### Directory Structure

```
.github/
└── workflows/
    ├── ci.yml           # Continuous Integration
    ├── cd.yml           # Continuous Deployment
    ├── security.yml     # Security scanning
    └── release.yml      # Release management
```

### CI Workflow (ci.yml)

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  JAVA_VERSION: '21'
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  # ============================================
  # Code Quality & Linting
  # ============================================
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Lint Frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run lint || true

  # ============================================
  # Build & Test - Auth Service
  # ============================================
  build-auth-service:
    name: Build Auth Service
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}
          cache: maven
      
      - name: Build & Test
        working-directory: ./auth-service
        run: |
          mvn clean verify -B
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: auth-service-test-results
          path: auth-service/target/surefire-reports/
      
      - name: Upload JAR
        uses: actions/upload-artifact@v4
        with:
          name: auth-service-jar
          path: auth-service/target/*.jar

  # ============================================
  # Build & Test - Backend Monolith
  # ============================================
  build-backend-service:
    name: Build Backend Service
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}
          cache: maven
      
      - name: Build & Test
        working-directory: ./backend-monolith
        run: |
          mvn clean verify -B
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: backend-service-test-results
          path: backend-monolith/target/surefire-reports/

  # ============================================
  # Build & Test - API Gateway
  # ============================================
  build-api-gateway:
    name: Build API Gateway
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}
          cache: maven
      
      - name: Build & Test
        working-directory: ./api-gateway
        run: |
          mvn clean verify -B

  # ============================================
  # Build & Test - Frontend
  # ============================================
  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install & Build
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
      
      - name: Upload Build
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/

  # ============================================
  # Build Docker Images
  # ============================================
  build-docker-images:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: 
      - build-auth-service
      - build-backend-service
      - build-api-gateway
      - build-frontend
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build Auth Service Image
        uses: docker/build-push-action@v5
        with:
          context: ./auth-service
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/auth-service:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/auth-service:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build Backend Service Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend-monolith
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend-service:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend-service:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build API Gateway Image
        uses: docker/build-push-action@v5
        with:
          context: ./api-gateway
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build Frontend Image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:latest
          build-args: |
            VITE_API_GATEWAY_URL=${{ secrets.FRONTEND_API_URL }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### CD Workflow (cd.yml)

```yaml
name: CD Pipeline

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'production'
        type: choice
        options:
          - staging
          - production

env:
  DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
  DEPLOY_USER: ${{ secrets.DEPLOY_USER }}

jobs:
  # ============================================
  # Deploy to Production
  # ============================================
  deploy:
    name: Deploy to ${{ github.event.inputs.environment || 'production' }}
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'production' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H ${{ env.DEPLOY_HOST }} >> ~/.ssh/known_hosts
      
      - name: Deploy Application
        run: |
          ssh ${{ env.DEPLOY_USER }}@${{ env.DEPLOY_HOST }} << 'ENDSSH'
            cd /opt/ocrs-project
            
            # Pull latest code
            git pull origin main
            
            # Update environment file
            # (secrets should be pre-configured on server)
            
            # Pull and deploy containers
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            
            # Wait for services to start
            sleep 30
            
            # Run health checks
            ./deploy/health-check.sh
          ENDSSH
      
      - name: Verify Deployment
        run: |
          # Check if application is responding
          curl -sf https://${{ secrets.DOMAIN }}/actuator/health || exit 1
          echo "Deployment successful!"
      
      - name: Notify on Success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ OCRS deployed successfully to ${{ github.event.inputs.environment || 'production' }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Successful*\nCommit: ${{ github.sha }}\nBranch: ${{ github.ref_name }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Notify on Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ OCRS deployment failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Failed*\nCommit: ${{ github.sha }}\nCheck logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # ============================================
  # Rollback Job (Manual Trigger)
  # ============================================
  rollback:
    name: Rollback Deployment
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch' && failure()
    needs: deploy
    
    steps:
      - name: Rollback to Previous Version
        run: |
          ssh ${{ env.DEPLOY_USER }}@${{ env.DEPLOY_HOST }} << 'ENDSSH'
            cd /opt/ocrs-project
            
            # Revert to previous commit
            git reset --hard HEAD~1
            
            # Redeploy
            docker compose -f docker-compose.prod.yml up -d --build
            
            echo "Rollback completed"
          ENDSSH
```

### Security Scanning Workflow (security.yml)

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  # ============================================
  # Dependency Vulnerability Scan
  # ============================================
  dependency-scan:
    name: Dependency Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # ============================================
  # Container Image Scan
  # ============================================
  container-scan:
    name: Container Scan
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, backend-monolith, api-gateway, frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Image
        run: |
          docker build -t ${{ matrix.service }}:scan ./${{ matrix.service }}
      
      - name: Run Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ matrix.service }}:scan'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'

  # ============================================
  # Secret Scanning
  # ============================================
  secret-scan:
    name: Secret Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

### Required GitHub Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_PRIVATE_KEY` | SSH key for deployment server | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DEPLOY_HOST` | Deployment server hostname | `123.45.67.89` |
| `DEPLOY_USER` | SSH username | `root` |
| `DOMAIN` | Application domain | `ocrs.ghagevaibhav.xyz` |
| `FRONTEND_API_URL` | Frontend API URL | `https://ocrs.ghagevaibhav.xyz` |
| `SLACK_WEBHOOK_URL` | Slack notifications | `https://hooks.slack.com/...` |

---

## Jenkins Implementation

### Jenkinsfile

```groovy
pipeline {
    agent any
    
    environment {
        JAVA_HOME = tool 'JDK21'
        MAVEN_HOME = tool 'Maven3'
        DOCKER_REGISTRY = 'ghcr.io'
        IMAGE_PREFIX = 'ghagevaibhav/ocrs-project'
        DEPLOY_HOST = credentials('deploy-host')
        DEPLOY_USER = credentials('deploy-user')
        SSH_KEY = credentials('ssh-private-key')
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }
    
    stages {
        // ============================================
        // Stage 1: Checkout
        // ============================================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        // ============================================
        // Stage 2: Build & Test (Parallel)
        // ============================================
        stage('Build & Test') {
            parallel {
                stage('Auth Service') {
                    steps {
                        dir('auth-service') {
                            sh '''
                                ${MAVEN_HOME}/bin/mvn clean verify -B \
                                    -Dmaven.test.failure.ignore=false
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'auth-service/target/surefire-reports/*.xml'
                            jacoco(
                                execPattern: 'auth-service/target/jacoco.exec',
                                classPattern: 'auth-service/target/classes',
                                sourcePattern: 'auth-service/src/main/java'
                            )
                        }
                    }
                }
                
                stage('Backend Service') {
                    steps {
                        dir('backend-monolith') {
                            sh '''
                                ${MAVEN_HOME}/bin/mvn clean verify -B \
                                    -Dmaven.test.failure.ignore=false
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend-monolith/target/surefire-reports/*.xml'
                        }
                    }
                }
                
                stage('API Gateway') {
                    steps {
                        dir('api-gateway') {
                            sh '''
                                ${MAVEN_HOME}/bin/mvn clean verify -B \
                                    -Dmaven.test.failure.ignore=false
                            '''
                        }
                    }
                }
                
                stage('Frontend') {
                    agent {
                        docker {
                            image 'node:18-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh '''
                                npm ci
                                npm run lint || true
                                npm run build
                            '''
                        }
                    }
                }
            }
        }
        
        // ============================================
        // Stage 3: Code Quality
        // ============================================
        stage('Code Quality') {
            when {
                branch 'main'
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        ${MAVEN_HOME}/bin/mvn sonar:sonar \
                            -Dsonar.projectKey=ocrs-project \
                            -Dsonar.projectName="OCRS Project" \
                            -f auth-service/pom.xml
                    '''
                }
            }
        }
        
        // ============================================
        // Stage 4: Build Docker Images
        // ============================================
        stage('Build Docker Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def services = ['auth-service', 'backend-monolith', 'api-gateway', 'eureka-server', 'frontend']
                    
                    services.each { service ->
                        docker.build("${IMAGE_PREFIX}/${service}:${BUILD_TAG}", "./${service}")
                    }
                }
            }
        }
        
        // ============================================
        // Stage 5: Push Docker Images
        // ============================================
        stage('Push Docker Images') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        def services = ['auth-service', 'backend-monolith', 'api-gateway', 'eureka-server', 'frontend']
                        
                        services.each { service ->
                            def image = docker.image("${IMAGE_PREFIX}/${service}:${BUILD_TAG}")
                            image.push()
                            image.push('latest')
                        }
                    }
                }
            }
        }
        
        // ============================================
        // Stage 6: Deploy to Staging
        // ============================================
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    deployToEnvironment('staging')
                }
            }
        }
        
        // ============================================
        // Stage 7: Deploy to Production
        // ============================================
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to production?"
                ok "Deploy"
                parameters {
                    choice(name: 'CONFIRM', choices: ['Yes', 'No'], description: 'Confirm deployment')
                }
            }
            steps {
                script {
                    if (params.CONFIRM == 'Yes') {
                        deployToEnvironment('production')
                    } else {
                        echo 'Deployment cancelled'
                    }
                }
            }
        }
        
        // ============================================
        // Stage 8: Health Check
        // ============================================
        stage('Health Check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def domain = (env.BRANCH_NAME == 'main') ? 
                        'ocrs.ghagevaibhav.xyz' : 'staging.ocrs.ghagevaibhav.xyz'
                    
                    timeout(time: 5, unit: 'MINUTES') {
                        waitUntil {
                            def response = sh(
                                script: "curl -sf https://${domain}/actuator/health || exit 1",
                                returnStatus: true
                            )
                            return response == 0
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                color: 'good',
                message: "✅ Build Successful: ${env.JOB_NAME} #${env.BUILD_NUMBER} (${env.GIT_COMMIT_SHORT})"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
    }
}

// ============================================
// Helper Functions
// ============================================
def deployToEnvironment(String environment) {
    sshagent(['ssh-private-key']) {
        sh """
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
                cd /opt/ocrs-project
                git pull origin ${env.BRANCH_NAME}
                docker compose -f docker-compose.prod.yml pull
                docker compose -f docker-compose.prod.yml up -d --remove-orphans
                sleep 30
                ./deploy/health-check.sh
            ENDSSH
        """
    }
}
```

### Jenkins Setup Requirements

1. **Required Plugins**:
   - Pipeline
   - Docker Pipeline
   - SSH Agent
   - Slack Notification
   - JaCoCo
   - SonarQube Scanner

2. **Global Tool Configuration**:
   - JDK 21 (name: `JDK21`)
   - Maven 3.9+ (name: `Maven3`)
   - Node.js 18 (name: `NodeJS18`)

3. **Credentials**:
   | ID | Type | Description |
   |----|------|-------------|
   | `deploy-host` | Secret text | Deployment server IP |
   | `deploy-user` | Secret text | SSH username |
   | `ssh-private-key` | SSH Private Key | Server access key |
   | `docker-registry-credentials` | Username/Password | Container registry |

---

## Best Practices

### 1. Branch Protection

```yaml
# .github/settings.yml (if using settings app)
branches:
  - name: main
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "Build Auth Service"
          - "Build Backend Service"
          - "Build API Gateway"
          - "Build Frontend"
      required_pull_request_reviews:
        required_approving_review_count: 1
      enforce_admins: true
```

### 2. Semantic Versioning

```yaml
# Release workflow triggered on tags
on:
  push:
    tags:
      - 'v*.*.*'
```

### 3. Environment Promotion

```
develop → staging → production
   ↓         ↓          ↓
  Auto     Auto     Manual Approval
```

### 4. Rollback Strategy

```bash
# Keep last 3 image versions
docker image ls --filter "reference=ocrs/*" --format "{{.Repository}}:{{.Tag}}" | \
    sort -rV | tail -n +4 | xargs -r docker rmi
```

---

## Migration Guide

### From GitHub Actions to Jenkins

1. Export GitHub Secrets to Jenkins Credentials
2. Convert YAML to Groovy Jenkinsfile
3. Configure webhook in GitHub → Jenkins
4. Test pipeline on develop branch first

### From Jenkins to GitHub Actions

1. Export Jenkins Credentials to GitHub Secrets
2. Convert Jenkinsfile stages to GitHub Actions jobs
3. Replace Jenkins-specific plugins with Actions equivalents
4. Update repository settings for Actions

---

*Documentation for OCRS CI/CD Pipelines*
