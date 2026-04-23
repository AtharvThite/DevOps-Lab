# Automated Bug Detection and Deployment System

A full-stack DevOps automation app that simulates or executes a CI/CD workflow:

1. SonarQube code quality scan
2. Terraform infrastructure provisioning
3. Ansible server configuration
4. Multipass/LXD deployment

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

## Run Locally

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Notes:
- Make sure MongoDB is running locally or set `MONGO_URI` to a reachable instance.
- `SIMULATE_PIPELINE=true` uses mocked stage execution.
- Set `SIMULATE_PIPELINE=false` to execute real CLI tools.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`
Backend default URL: `http://localhost:5000`

## Real Tool Execution

Set these in `backend/.env` when not simulating:

- `SONAR_COMMAND`
- `TERRAFORM_INIT_COMMAND`
- `TERRAFORM_APPLY_COMMAND`
- `ANSIBLE_COMMAND`
- `DEPLOYMENT_TARGET` (`multipass` or `lxd`)
- `MULTIPASS_COMMAND`
- `LXD_COMMAND`

## End-to-End Setup (SonarQube + Terraform + Ansible + LXD)

The project now includes ready-to-run assets under:

- `backend/infra/terraform`
- `backend/infra/ansible`
- `backend/infra/scripts`
- `infrastructure/sonarqube/docker-compose.yml`
- `sonar-project.properties`

### 1) Install required tools on Linux

```bash
sudo apt-get update
sudo apt-get install -y openjdk-17-jre ansible lxd

# Terraform (official HashiCorp repo package)
wget -O- https://apt.releases.hashicorp.com/gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install -y terraform

# SonarScanner CLI
sudo apt-get install -y unzip curl
curl -fsSL -o /tmp/sonar-scanner.zip \
  https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610-linux-x64.zip
sudo unzip -o /tmp/sonar-scanner.zip -d /opt
sudo ln -sf /opt/sonar-scanner-6.2.1.4610-linux-x64/bin/sonar-scanner /usr/local/bin/sonar-scanner
```

### 2) Initialize LXD

```bash
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
newgrp lxd
```

### 3) Start SonarQube locally

```bash
cd infrastructure/sonarqube
docker compose up -d
```

Then open `http://localhost:9000`, login (`admin` / `admin`), create a project, and generate a token.

### 4) Configure backend environment

```bash
cd backend
cp .env.example .env
```

Update these values in `.env`:

- `SIMULATE_PIPELINE=false`
- `SONAR_HOST_URL=http://localhost:9000`
- `SONAR_TOKEN=<your-token>`

### 5) Run each stage manually once

```bash
cd backend
bash ./infra/scripts/run_sonar.sh
bash ./infra/scripts/run_terraform.sh init
bash ./infra/scripts/run_terraform.sh apply
bash ./infra/scripts/run_ansible.sh
bash ./infra/scripts/deploy_lxd.sh
```

### 6) Run through the app pipeline UI/API

After the manual verification above, start backend and frontend as usual and trigger a pipeline run. The backend will execute these same scripts via `.env` command values.

## Features Implemented

- Non-blocking pipeline job creation with background queue worker
- Stage-wise status tracking (`pending`, `running`, `success`, `failed`, `skipped`)
- Dynamic logs display with polling on the status page
- Dashboard pages: Home, Pipeline Trigger, Live Status, History
- Color-coded statuses and progress indicators
- Error handling in API and UI
