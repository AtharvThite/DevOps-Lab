pipeline {
    agent any

    environment {
        // Use the workspace directory where Jenkins clones the code from GitHub
        REPO_ROOT = "${WORKSPACE}"
        LXD_GROUP_REEXEC = "1"
        DEPLOY_SOURCE_URL = "https://github.com/AtharvThite/DevOps-Lab.git"
        
        // Ensure this ID matches exactly what you named the credential in Jenkins
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')
        IMAGE_NAME = "docker.io/atharvthite05/devops-lab:latest"
    }

    stages {
        // 1. MUST BE FIRST: Pull the latest code before trying to run any scripts!
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        // 2. Run Tests and Infrastructure scripts
        stage('Code Quality (SonarQube)') {
            steps {
                dir('backend') {
                    sh 'bash ./infra/scripts/run_sonar.sh'
                }
            }
        }
        
        stage('Infrastructure (Terraform Init)') {
            steps {
                dir('backend') {
                    sh 'cp /app/infra/terraform/terraform.tfstate ./infra/terraform/terraform.tfstate || true'
                    sh 'bash ./infra/scripts/run_terraform.sh init'
                }
            }
        }
        
        stage('Infrastructure (Terraform Apply)') {
            steps {
                dir('backend') {
                    sh 'bash ./infra/scripts/run_terraform.sh apply'
                    sh 'cp ./infra/terraform/terraform.tfstate /app/infra/terraform/terraform.tfstate || true'
                }
            }
        }
        
        stage('Configuration (Ansible)') {
            steps {
                dir('backend') {
                    sh 'bash ./infra/scripts/run_ansible.sh'
                }
            }
        }
        
        stage('Deployment (LXD)') {
            steps {
                dir('backend') {
                    // The deploy script requires backend/node_modules to exist as a sanity check
                    sh 'npm install --omit=dev'
                    sh 'bash ./infra/scripts/deploy_lxd.sh'
                }
            }
        }

        // 3. Build and Push the Unified Application Image
        stage('Build Image') {
            steps {
                echo "🚀 Building the unified Docker image using Podman..."
                
                // Wipe old storage to avoid graph driver mismatch, then recreate
                sh 'rm -rf /var/lib/containers/storage /run/containers/storage'
                sh 'mkdir -p /var/lib/containers/storage /run/containers/storage'
                
                // Pass storage paths directly on CLI to bypass any config file issues
                sh '''BUILDAH_ISOLATION=chroot podman \
                      --root /var/lib/containers/storage \
                      --runroot /run/containers/storage \
                      --storage-driver vfs \
                      build --format docker -t $IMAGE_NAME .'''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "☁️ Authenticating and pushing to Docker Hub..."
                sh '''podman --root /var/lib/containers/storage \
                      --runroot /run/containers/storage \
                      --storage-driver vfs \
                      login docker.io -u $DOCKERHUB_CREDS_USR -p $DOCKERHUB_CREDS_PSW'''
                sh '''podman --root /var/lib/containers/storage \
                      --runroot /run/containers/storage \
                      --storage-driver vfs \
                      push $IMAGE_NAME'''
            }
            post {
                always {
                    sh '''podman --root /var/lib/containers/storage \
                          --runroot /run/containers/storage \
                          --storage-driver vfs \
                          logout docker.io || true'''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully! Infrastructure updated and image pushed."
        }
        failure {
            echo "❌ Pipeline failed. Please check the console output for details."
        }
    }
}