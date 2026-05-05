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
                
                // 1. Force Podman to reload the UID/GID mappings we added to the container
                sh 'podman system migrate || true'
                
                // 2. Build using chroot isolation and force the VFS driver to bypass nested permission errors
                sh 'BUILDAH_ISOLATION=chroot podman build --storage-driver=vfs --format docker -t $IMAGE_NAME .'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "☁️ Authenticating and pushing to Docker Hub..."
                // Log in securely using the credentials injected by Jenkins
                sh 'podman login docker.io -u $DOCKERHUB_CREDS_USR -p $DOCKERHUB_CREDS_PSW'
                
                // Push the image to your repository
                sh 'podman push $IMAGE_NAME'
            }
            post {
                always {
                    // ALWAYS run logout, even if the push fails, to secure your credentials
                    sh 'podman logout docker.io'
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