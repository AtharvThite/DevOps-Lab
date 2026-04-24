# Automated Bug Detection and Deployment System

A full-stack DevOps automation app that simulates or executes a CI/CD workflow:

1. SonarQube code quality scan
2. Terraform infrastructure provisioning
3. Ansible server configuration
4. LXD deployment

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Project Structure

```txt
frontend/
backend/
  src/
    routes/
    controllers/
    services/
    models/
```

## Backend APIs

- `POST /pipeline/run` - create and queue a pipeline run (repo URL or ZIP upload)
- `GET /pipeline/status/:id` - stage-by-stage status
- `GET /pipeline/logs/:id` - logs per stage
- `GET /pipeline/history` - historical runs

## Installation and Setup

### Prerequisites

Install these tools on your Linux or Ubuntu machine:

- Node.js 18+ and npm
- MongoDB
- Java 17
- Git, curl, unzip, and build tools
- Terraform
- Ansible
- LXD
- Docker or Podman with Compose support
- SonarScanner CLI

### Ubuntu installation steps

```bash
sudo apt update
sudo apt install -y curl unzip git build-essential software-properties-common ca-certificates gnupg lsb-release

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Java 17
sudo apt install -y openjdk-17-jre

# MongoDB
# Install MongoDB from the official MongoDB repository or use an existing MongoDB instance.

# Ansible and LXD
sudo apt install -y ansible lxd

# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update
sudo apt install -y terraform

# SonarScanner CLI
curl -fsSL -o /tmp/sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610-linux-x64.zip
sudo unzip -o /tmp/sonar-scanner.zip -d /opt
sudo ln -sf /opt/sonar-scanner-6.2.1.4610-linux-x64/bin/sonar-scanner /usr/local/bin/sonar-scanner
```

### Linux installation notes

If you are on another Linux distribution, install the same tools using your package manager or the vendor installer for that tool. The required components are the same as Ubuntu: Node.js, MongoDB, Java 17, Terraform, Ansible, LXD, Docker/Podman Compose, and SonarScanner CLI.

### Initialize LXD

```bash
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
newgrp lxd
```

### Clone the repository

```bash
git clone <your-repo-url>
cd DevOps-Lab
```

## Run the Application

### 1) Start SonarQube

```bash
cd infrastructure/sonarqube
docker compose up -d
```

If you use Podman instead of Docker, run:

```bash
podman compose up -d
```

Then open `http://localhost:9000`, log in with `admin` / `admin`, create a project, and generate a token.

### 2) Configure the backend

```bash
cd backend
cp .env.example .env
npm install
```

Set the important values in `backend/.env`:

- `MONGO_URI` pointing to your MongoDB instance
- `SIMULATE_PIPELINE=true` for mocked execution, or `false` for real tools
- `SONAR_HOST_URL=http://localhost:9000`
- `SONAR_TOKEN=<your-token>`
- `DEPLOYMENT_TARGET=lxd` or `multipass`

If you want the backend to run the real tools, keep the script commands set to the scripts in `backend/infra/scripts`.

### 3) Configure the frontend

```bash
cd ../frontend
cp .env.example .env
npm install
```

### 4) Start the backend

```bash
cd ../backend
npm run dev
```

### 5) Start the frontend

```bash
cd ../frontend
npm run dev
```

Frontend default URL: `http://localhost:5173`

Backend default URL: `http://localhost:5000`

### 6) Run the pipeline from the app

Use the Pipeline page in the UI to trigger a run, then monitor progress on the Status and History pages.

## Real Tool Execution

Set these in `backend/.env` when not simulating:

- `SONAR_COMMAND`
- `TERRAFORM_INIT_COMMAND`
- `TERRAFORM_APPLY_COMMAND`
- `ANSIBLE_COMMAND`
- `DEPLOYMENT_TARGET` (`multipass` or `lxd`)
- `MULTIPASS_COMMAND`
- `LXD_COMMAND`

## End-to-End Stage Commands

These scripts are wired under `backend/infra/scripts`:

```bash
cd backend
bash ./infra/scripts/run_sonar.sh
bash ./infra/scripts/run_terraform.sh init
bash ./infra/scripts/run_terraform.sh apply
bash ./infra/scripts/run_ansible.sh
bash ./infra/scripts/deploy_lxd.sh
```

## Features Implemented

- Non-blocking pipeline job creation with background queue worker
- Stage-wise status tracking (`pending`, `running`, `success`, `failed`, `skipped`)
- Dynamic logs display with polling on the status page
- Dashboard pages: Home, Pipeline Trigger, Live Status, History
- Color-coded statuses and progress indicators
- Error handling in API and UI
