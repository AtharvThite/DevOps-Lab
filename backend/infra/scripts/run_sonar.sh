#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_ROOT="$(cd "${BACKEND_DIR}/.." && pwd)"
SONAR_SETTINGS_FILE="${REPO_ROOT}/sonar-project.properties"

if ! command -v sonar-scanner >/dev/null 2>&1; then
  echo "sonar-scanner is not installed. Install SonarScanner CLI first."
  exit 1
fi

if [[ ! -f "${SONAR_SETTINGS_FILE}" ]]; then
  echo "Missing sonar settings file at ${SONAR_SETTINGS_FILE}"
  exit 1
fi

if [[ -z "${SONAR_HOST_URL:-}" ]]; then
  echo "SONAR_HOST_URL is not set. Example: http://localhost:9000"
  exit 1
fi

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  echo "SONAR_TOKEN is not set. Generate a token in SonarQube and export it in backend/.env"
  exit 1
fi

sonar-scanner \
  -Dproject.settings="${SONAR_SETTINGS_FILE}" \
  -Dsonar.projectBaseDir="${REPO_ROOT}"
