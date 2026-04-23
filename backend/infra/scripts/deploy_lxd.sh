#!/usr/bin/env bash
set -euo pipefail

CURRENT_USER="${USER:-$(id -un)}"
if [[ "${LXD_GROUP_REEXEC:-0}" != "1" ]] && ! id -Gn | grep -qw lxd; then
  if id -Gn "${CURRENT_USER}" | grep -qw lxd && command -v sg >/dev/null 2>&1; then
    exec sg lxd -c "LXD_GROUP_REEXEC=1 bash '$0'"
  fi

  echo "Current shell does not have lxd group access."
  echo "Run: newgrp lxd (or log out/in) before running deployment stage."
  exit 1
fi

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_ROOT="$(cd "${BACKEND_DIR}/.." && pwd)"

CONTAINER_NAME="${LXD_CONTAINER_NAME:-devops-lab-app}"
APP_DIR="${APP_DIR:-/opt/devops-lab}"

if ! command -v lxc >/dev/null 2>&1; then
  echo "lxc CLI is not installed. Install LXD and the lxc client first."
  exit 1
fi

if ! lxc list --format csv -c n | grep -qx "${CONTAINER_NAME}"; then
  echo "Container '${CONTAINER_NAME}' does not exist. Run Terraform stage first."
  exit 1
fi

if [[ ! -d "${BACKEND_DIR}/node_modules" ]]; then
  echo "Missing ${BACKEND_DIR}/node_modules. Run npm install in backend first."
  exit 1
fi

lxc start "${CONTAINER_NAME}" >/dev/null 2>&1 || true

ARCHIVE_FILE="$(mktemp /tmp/devops-lab-XXXXXX.tar.gz)"
REMOTE_ARCHIVE_REL="tmp/devops-lab-$(date +%s)-${RANDOM}.tar.gz"
REMOTE_ARCHIVE_ABS="/${REMOTE_ARCHIVE_REL}"
trap 'rm -f "${ARCHIVE_FILE}"' EXIT

tar -czf "${ARCHIVE_FILE}" \
  --exclude='.git' \
  --exclude='frontend/node_modules' \
  --exclude='backend/uploads/*' \
  --exclude='frontend/dist' \
  -C "${REPO_ROOT}" \
  .

lxc exec "${CONTAINER_NAME}" -- mkdir -p "${APP_DIR}"
lxc file push "${ARCHIVE_FILE}" "${CONTAINER_NAME}/${REMOTE_ARCHIVE_REL}"

lxc exec "${CONTAINER_NAME}" -- bash -lc "rm -rf \"${APP_DIR}\"/* && tar -xzf \"${REMOTE_ARCHIVE_ABS}\" -C \"${APP_DIR}\" && rm -f \"${REMOTE_ARCHIVE_ABS}\""
lxc exec "${CONTAINER_NAME}" -- bash -lc "node --version && npm --version"

lxc exec "${CONTAINER_NAME}" -- bash -lc "for pid in \$(ps -eo pid=,args= | awk '/[n]ode .*src\\/server\\.js/{print \$1}'); do kill \"\$pid\" || true; done"
lxc exec "${CONTAINER_NAME}" --mode=non-interactive -- bash -lc "cd \"${APP_DIR}/backend\" && nohup npm start >/var/log/devops-lab-backend.log 2>&1 &"

echo "Deployment completed to LXD container '${CONTAINER_NAME}'."
