#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_ROOT="${REPO_ROOT:-$(cd "${BACKEND_DIR}/.." && pwd)}"
SONAR_SETTINGS_FILE="${REPO_ROOT}/sonar-project.properties"

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

echo "Running SonarQube scanner via Docker..."

# Use the official Docker scanner image to avoid architecture/Rosetta mismatches
docker run --rm \
  --network="host" \
  -v "${REPO_ROOT}:/usr/src" \
  sonarsource/sonar-scanner-cli \
  -Dproject.settings="/usr/src/sonar-project.properties" \
  -Dsonar.projectBaseDir="/usr/src" \
  -Dsonar.working.directory="/usr/src/backend/infra/scripts/.scannerwork" \
  -Dsonar.host.url="${SONAR_HOST_URL}" \
  -Dsonar.token="${SONAR_TOKEN}"