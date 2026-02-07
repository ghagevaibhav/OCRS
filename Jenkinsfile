/**
 * OCRS Project - Jenkins CI/CD Pipeline
 * 
 * This pipeline provides comprehensive CI/CD for the OCRS microservices application.
 * It builds, tests, and deploys all services to the production environment.
 */

pipeline {
    agent any
    
    environment {
        // Tool configurations
        JAVA_HOME = tool 'JDK21'
        MAVEN_HOME = tool 'Maven3'
        PATH = "${JAVA_HOME}/bin:${MAVEN_HOME}/bin:${env.PATH}"
        
        // Docker configuration
        DOCKER_REGISTRY = 'ghcr.io'
        IMAGE_PREFIX = 'ghagevaibhav/ocrs'
        
        // Deployment configuration
        DEPLOY_HOST = credentials('ocrs-deploy-host')
        DEPLOY_USER = credentials('ocrs-deploy-user')
        
        // Application configuration
        DOMAIN = 'ocrs.ghagevaibhav.xyz'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }
    
    triggers {
        // Poll SCM every 5 minutes
        pollSCM('H/5 * * * *')
    }
    
    stages {
        // ============================================
        // Stage: Checkout
        // ============================================
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
                
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    
                    env.GIT_COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                    
                    env.BUILD_TAG = "${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
                    
                    echo "Building commit: ${GIT_COMMIT_SHORT}"
                    echo "Message: ${GIT_COMMIT_MSG}"
                }
            }
        }
        
        // ============================================
        // Stage: Build & Test (Parallel)
        // ============================================
        stage('Build & Test') {
            parallel {
                stage('Auth Service') {
                    steps {
                        dir('auth-service') {
                            sh '''
                                mvn clean verify -B \
                                    -Dmaven.test.failure.ignore=false \
                                    -Dspring.profiles.active=test
                            '''
                        }
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, 
                                  testResults: 'auth-service/target/surefire-reports/*.xml'
                        }
                    }
                }
                
                stage('Backend Service') {
                    steps {
                        dir('backend-monolith') {
                            sh '''
                                mvn clean verify -B \
                                    -Dmaven.test.failure.ignore=false \
                                    -Dspring.profiles.active=test
                            '''
                        }
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, 
                                  testResults: 'backend-monolith/target/surefire-reports/*.xml'
                        }
                    }
                }
                
                stage('API Gateway') {
                    steps {
                        dir('api-gateway') {
                            sh '''
                                mvn clean verify -B \
                                    -Dmaven.test.failure.ignore=false
                            '''
                        }
                    }
                }
                
                stage('Eureka Server') {
                    steps {
                        dir('eureka-server') {
                            sh '''
                                mvn clean package -B -DskipTests
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
                                npm ci --prefer-offline
                                npm run lint || true
                                npm run build
                            '''
                        }
                    }
                }
            }
        }
        
        // ============================================
        // Stage: Code Quality Analysis
        // ============================================
        stage('Code Quality') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    // Run SonarQube analysis if configured
                    if (fileExists('sonar-project.properties')) {
                        withSonarQubeEnv('SonarQube') {
                            sh '''
                                mvn sonar:sonar \
                                    -Dsonar.projectKey=ocrs-project \
                                    -Dsonar.projectName="OCRS Project" \
                                    -f auth-service/pom.xml
                            '''
                        }
                    } else {
                        echo 'SonarQube not configured - skipping'
                    }
                }
            }
        }
        
        // ============================================
        // Stage: Build Docker Images
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
                    def services = [
                        'auth-service',
                        'backend-monolith',
                        'api-gateway', 
                        'eureka-server',
                        'email-service',
                        'logging-service',
                        'frontend'
                    ]
                    
                    services.each { service ->
                        echo "Building Docker image for ${service}..."
                        
                        def imageName = "${IMAGE_PREFIX}/${service}:${BUILD_TAG}"
                        def latestTag = "${IMAGE_PREFIX}/${service}:latest"
                        
                        sh """
                            docker build -t ${imageName} -t ${latestTag} ./${service}
                        """
                    }
                }
            }
        }
        
        // ============================================
        // Stage: Push Docker Images
        // ============================================
        stage('Push Docker Images') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        def services = [
                            'auth-service',
                            'backend-monolith',
                            'api-gateway',
                            'eureka-server',
                            'email-service',
                            'logging-service',
                            'frontend'
                        ]
                        
                        services.each { service ->
                            echo "Pushing ${service} to registry..."
                            
                            def image = docker.image("${IMAGE_PREFIX}/${service}:${BUILD_TAG}")
                            image.push()
                            image.push('latest')
                        }
                    }
                }
            }
        }
        
        // ============================================
        // Stage: Deploy to Staging
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
        // Stage: Deploy to Production
        // ============================================
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            options {
                timeout(time: 30, unit: 'MINUTES')
            }
            input {
                message "Deploy to production?"
                ok "Yes, deploy now"
                submitter "admin,deployer"
                parameters {
                    choice(
                        name: 'CONFIRM_DEPLOY',
                        choices: ['Yes', 'No'],
                        description: 'Confirm deployment to production'
                    )
                }
            }
            steps {
                script {
                    if (params.CONFIRM_DEPLOY == 'Yes') {
                        deployToEnvironment('production')
                    } else {
                        echo 'Production deployment cancelled by user'
                        currentBuild.result = 'ABORTED'
                    }
                }
            }
        }
        
        // ============================================
        // Stage: Post-Deployment Verification
        // ============================================
        stage('Verify Deployment') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def targetDomain = (env.BRANCH_NAME == 'main') ? 
                        DOMAIN : "staging.${DOMAIN}"
                    
                    echo "Verifying deployment at ${targetDomain}..."
                    
                    // Wait for services to be healthy
                    timeout(time: 5, unit: 'MINUTES') {
                        waitUntil(initialRecurrencePeriod: 15000) {
                            def status = sh(
                                script: """
                                    curl -sf https://${targetDomain}/actuator/health \
                                        --connect-timeout 10 \
                                        --max-time 30 || exit 1
                                """,
                                returnStatus: true
                            )
                            return status == 0
                        }
                    }
                    
                    echo "✅ Deployment verified successfully!"
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images
            sh 'docker image prune -f || true'
            
            // Archive test results
            archiveArtifacts artifacts: '**/target/surefire-reports/**', 
                             allowEmptyArchive: true
        }
        
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    slackSend(
                        color: 'good',
                        message: """
                            ✅ *OCRS Production Deployment Successful*
                            • Build: #${BUILD_NUMBER}
                            • Commit: ${GIT_COMMIT_SHORT}
                            • Domain: https://${DOMAIN}
                        """.stripIndent()
                    )
                }
            }
        }
        
        failure {
            slackSend(
                color: 'danger',
                message: """
                    ❌ *OCRS Build Failed*
                    • Build: #${BUILD_NUMBER}
                    • Branch: ${env.BRANCH_NAME}
                    • Commit: ${GIT_COMMIT_SHORT}
                    • Console: ${BUILD_URL}console
                """.stripIndent()
            )
        }
        
        unstable {
            slackSend(
                color: 'warning',
                message: """
                    ⚠️ *OCRS Build Unstable*
                    • Build: #${BUILD_NUMBER}
                    • Some tests may have failed
                    • Console: ${BUILD_URL}console
                """.stripIndent()
            )
        }
    }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Deploy to the specified environment
 */
def deployToEnvironment(String environment) {
    echo "Deploying to ${environment}..."
    
    sshagent(['ocrs-ssh-key']) {
        sh """
            ssh -o StrictHostKeyChecking=no \
                -o UserKnownHostsFile=/dev/null \
                ${DEPLOY_USER}@${DEPLOY_HOST} << 'DEPLOY_SCRIPT'
                
                set -e
                
                echo "=== Starting ${environment} deployment ==="
                cd /opt/ocrs-project
                
                echo "=== Pulling latest code ==="
                git fetch origin
                git reset --hard origin/${env.BRANCH_NAME}
                
                echo "=== Pulling Docker images ==="
                docker compose -f docker-compose.prod.yml pull
                
                echo "=== Deploying services ==="
                docker compose -f docker-compose.prod.yml up -d --remove-orphans
                
                echo "=== Waiting for services to start ==="
                sleep 30
                
                echo "=== Running health checks ==="
                ./deploy/health-check.sh
                
                echo "=== Cleaning up old images ==="
                docker image prune -f
                
                echo "=== Deployment complete ==="
                
            DEPLOY_SCRIPT
        """
    }
    
    echo "${environment} deployment completed successfully!"
}

/**
 * Rollback to previous version
 */
def rollback() {
    echo "Rolling back deployment..."
    
    sshagent(['ocrs-ssh-key']) {
        sh """
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'ROLLBACK_SCRIPT'
                
                cd /opt/ocrs-project
                
                echo "Reverting to previous commit..."
                git reset --hard HEAD~1
                
                echo "Redeploying previous version..."
                docker compose -f docker-compose.prod.yml up -d --build
                
                echo "Rollback complete"
                
            ROLLBACK_SCRIPT
        """
    }
}
