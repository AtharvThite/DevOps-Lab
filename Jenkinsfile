pipeline {
    agent any

    environment {
        // Use the workspace directory where Jenkins clones the code from GitHub
        REPO_ROOT = "${WORKSPACE}"
        LXD_GROUP_REEXEC = "1"
        DEPLOY_SOURCE_PATH = "${WORKSPACE}"
    }

    stages {
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
    }
}
