pipeline {
    agent any

    environment {
        // Docker Hub settings
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDS_ID = 'docker-hub-credentials'
        DOCKER_IMAGE    = 'aradhyabhardwaj/study-hive'
        
        // Deployment paths
        K8S_MANIFEST_DIR = 'k8s'
        APP_PORT        = '80'
        KUBECONFIG      = '/var/lib/jenkins/.kube/config'
    }

    stages {
        stage('Source Checkout') {
            steps {
                echo 'Checking out source code from GitHub...'
                checkout scm
            }
        }

        stage('NPM Security Audit') {
            steps {
                echo 'Auditing Node dependencies for security vulnerabilities...'
                // If package-lock.json is present, check dependencies. '|| true' ensures pipeline won't halt on low/medium dev warnings.
                sh 'npm audit || true'
            }
        }

        stage('Docker Image Build') {
            steps {
                echo "Building Docker image: ${DOCKER_IMAGE}:${BUILD_NUMBER}..."
                sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest"
            }
        }

        stage('Trivy Security Scan') {
            steps {
                echo 'Scanning Docker image with Trivy...'
                // Scan the built local image. Exit code 0 means warnings won't stop execution unless desired.
                sh "trivy image --exit-code 0 --severity HIGH,CRITICAL ${DOCKER_IMAGE}:${BUILD_NUMBER}"
            }
        }

        stage('Push Image to Docker Hub') {
            steps {
                echo 'Logging in and pushing image to Docker Hub registry...'
                script {
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin ${DOCKER_REGISTRY}"
                        sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Update & Deploy Manifests') {
            steps {
                echo 'Injecting build number tag into Kubernetes manifest and deploying...'
                script {
                    // Update deployment manifest dynamically using sed
                    sh "sed -i 's|image: .*study-hive:.*|image: ${DOCKER_IMAGE}:${BUILD_NUMBER}|g' ${K8S_MANIFEST_DIR}/deployment.yaml"
                    
                    // Apply manifests via kubectl
                    sh "kubectl apply -f ${K8S_MANIFEST_DIR}/deployment.yaml"
                    sh "kubectl apply -f ${K8S_MANIFEST_DIR}/service.yaml"
                }
            }
        }

        stage('Rollout Status & Health Verification') {
            steps {
                echo 'Waiting for rollout to finish and executing health checks...'
                script {
                    // Wait for deployment rollout to successfully terminate
                    sh "kubectl rollout status deployment/study-hive-deployment --timeout=120s"
                    
                    // Dynamic retry loop to wait for Klipper ServiceLB to bind the port and confirm HTTP status 200
                    sh """
                    for i in {1..10}; do
                      httpStatus=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${APP_PORT} || true)
                      if [ "\$httpStatus" = "200" ]; then
                        echo "Health Check Success! Received HTTP status: \$httpStatus"
                        exit 0
                      fi
                      echo "Waiting for Klipper port binding... (attempt \$i/10, current status: \$httpStatus)"
                      sleep 3
                    done
                    echo "Health Check Failed! Unable to establish port 80 routing."
                    exit 1
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                echo '======== POST ACTIONS: Cleaning up Workspace and Host Storage ========'
                
                // 1. Delete the checked-out repository to save space on the host
                cleanWs()
                
                // 2. Remove the specific built tag image from local docker daemon storage
                sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
                sh "docker rmi ${DOCKER_IMAGE}:latest || true"
                
                // 3. Prune dangling build layers and unused builders to prevent disk creep
                sh "docker image prune -f"
                sh "docker builder prune -f"
                
                echo '======== Cleanup completed successfully! ========'
            }
        }
        success {
            echo 'Deployment Pipeline finished with SUCCESS!'
        }
        failure {
            echo 'Deployment Pipeline finished with FAILURE. Check stage details above.'
        }
    }
}
