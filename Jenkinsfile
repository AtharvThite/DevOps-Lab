pipeline {
    agent any

    environment {
        // Project Metadata
        REPO_ROOT = "${WORKSPACE}"
        LXD_GROUP_REEXEC = "1"
        DEPLOY_SOURCE_URL = "https://github.com/AtharvThite/DevOps-Lab.git"
        
        // Docker Hub Credentials (Ensure ID matches Jenkins Global Credentials)
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')
        IMAGE_NAME = "docker.io/atharvthite05/devops-lab:latest"

        // Isolated Podman Storage (Avoids database driver mismatch errors)
        P_ROOT = "${WORKSPACE}/.podman-root"
        P_RUN = "${WORKSPACE}/.podman-runroot"
    }

    stages {
        // 1. Setup Phase
        stage('Checkout Code') {
            steps {
                checkout scm[cite: 1]
            }
        }

        // 2. Testing & Infrastructure Phase
        stage('Code Quality (SonarQube)') {
            steps {
                dir('backend') {
                    sh 'bash ./infra/scripts/run_sonar.sh'[cite: 1]
                }
            }
        }
        
        stage('Infrastructure (Terraform Init)') {
            steps {
                dir('backend') {
                    sh 'cp /app/infra/terraform/terraform.tfstate ./infra/terraform/terraform.tfstate || true'[cite: 1]
                    sh 'bash ./infra/scripts/run_terraform.sh init'[cite: 1]
                }
            }
        }
        
        stage('Infrastructure (Terraform Apply)') {
            steps {
                dir('backend') {
                    sh 'bash ./infra/scripts/run_terraform.sh apply'[cite: 1]
                    sh 'cp ./infra/terraform/terraform.tfstate /app/infra/terraform/terraform.tfstate || true'[cite: 1]
                }
            }
        }
        
        stage('Configuration (Ansible)') {
            steps {
                dir('backend') {
                    sh 'bash ./infra/scripts/run_ansible.sh'[cite: 1]
                }
            }
        }
        
        stage('Deployment (LXD)') {
            steps {
                dir('backend') {
                    sh 'npm install --omit=dev'[cite: 1]
                    sh 'bash ./infra/scripts/deploy_lxd.sh'[cite: 1]
                }
            }
        }

        // 3. Artifact Packaging Phase
        stage('Build Unified Image') {
            steps {
                echo "🚀 Resetting storage and building image in isolated root..."
                // Clean any previous build artifacts
                sh "rm -rf ${P_ROOT} ${P_RUN} && mkdir -p ${P_ROOT} ${P_RUN}"[cite: 1]
                
                // Build using VFS driver and Chroot isolation to bypass nested container restrictions
                sh """
                    BUILDAH_ISOLATION=chroot podman \
                    --root ${P_ROOT} \
                    --runroot ${P_RUN} \
                    --storage-driver vfs \
                    build --format docker -t $IMAGE_NAME .
                """[cite: 1]
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "☁️ Authenticating and pushing to Docker Hub..."
                // Use the same isolated root so Podman can find the image we just built
                sh """
                    podman --root ${P_ROOT} --runroot ${P_RUN} \
                    login docker.io -u $DOCKERHUB_CREDS_USR -p $DOCKERHUB_CREDS_PSW
                """[cite: 1]
                
                sh "podman --root ${P_ROOT} --runroot ${P_RUN} push $IMAGE_NAME"[cite: 1]
            }
            post {
                always {
                    // Cleanup credentials and temporary storage
                    sh "podman --root ${P_ROOT} logout docker.io || true"[cite: 1]
                    sh "rm -rf ${P_ROOT} ${P_RUN}"[cite: 1]
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline Success: Infrastructure deployed and Unified Image pushed to Docker Hub."[cite: 1]
        }
        failure {
            echo "❌ Pipeline Failure: Check console output for specific error logs."[cite: 1]
        }
    }
}