pipeline {
    agent any

    environment {
        // Use the workspace directory where Jenkins clones the code from GitHub
        REPO_ROOT = "${WORKSPACE}"
        LXD_GROUP_REEXEC = "1"
        DEPLOY_SOURCE_URL = "https://github.com/AtharvThite/DevOps-Lab.git"
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')
        IMAGE_NAME = "docker.io/atharvthite05/devops-lab:latest"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Pulls the latest code from your Git repository
                checkout scm
            }
        }
        
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

        stage('Build Image') {
            steps {
                echo "🚀 Building the unified Docker image..."
                // Build using Podman, forcing the docker format for compatibility
                sh 'podman build --format docker -t $IMAGE_NAME .'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "☁️ Pushing to Docker Hub..."
                // Log in using the injected Jenkins credentials
                sh 'podman login docker.io -u $DOCKERHUB_CREDS_USR -p $DOCKERHUB_CREDS_PSW'
                
                // Push the image
                sh 'podman push $IMAGE_NAME'
                
                // Clean up by logging out
                sh 'podman logout docker.io'
            }
        }
    }
}
