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
                
                // Write a fresh storage config to ALL locations Podman might read from.
                // The env var handles the outer command, the system files handle internal RUN steps.
                sh '''
                    rm -rf /tmp/podman-graph /tmp/podman-run
                    mkdir -p /tmp/podman-graph /tmp/podman-run

                    cat > /tmp/podman-storage.conf << 'STORAGECONF'
[storage]
driver = "vfs"
runroot = "/tmp/podman-run"
graphroot = "/tmp/podman-graph"

[storage.options.vfs]
ignore_chown_errors = "true"
STORAGECONF

                    cp /tmp/podman-storage.conf /etc/containers/storage.conf
                    cp /tmp/podman-storage.conf /usr/share/containers/storage.conf 2>/dev/null || true

                    CONTAINERS_STORAGE_CONF=/tmp/podman-storage.conf \
                    BUILDAH_ISOLATION=chroot \
                    podman build --userns=host --format docker -t $IMAGE_NAME .
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "☁️ Authenticating and pushing to Docker Hub..."
                sh '''
                    CONTAINERS_STORAGE_CONF=/tmp/podman-storage.conf \
                    podman login docker.io -u $DOCKERHUB_CREDS_USR -p $DOCKERHUB_CREDS_PSW
                '''
                sh '''
                    CONTAINERS_STORAGE_CONF=/tmp/podman-storage.conf \
                    podman push --format v2s2 $IMAGE_NAME || \
                    CONTAINERS_STORAGE_CONF=/tmp/podman-storage.conf \
                    podman push --format v2s2 $IMAGE_NAME
                '''
            }
            post {
                always {
                    sh '''
                        CONTAINERS_STORAGE_CONF=/tmp/podman-storage.conf \
                        podman logout docker.io || true
                    '''
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