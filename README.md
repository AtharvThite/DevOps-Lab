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

## Features Implemented

- Non-blocking pipeline job creation with background queue worker
- Stage-wise status tracking (`pending`, `running`, `success`, `failed`, `skipped`)
- Dynamic logs display with polling on the status page
- Dashboard pages: Home, Pipeline Trigger, Live Status, History
- Color-coded statuses and progress indicators
- Error handling in API and UI
