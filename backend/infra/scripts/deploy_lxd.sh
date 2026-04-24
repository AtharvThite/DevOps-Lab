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
DEPLOY_SOURCE_URL="${DEPLOY_SOURCE_URL:-}"
DEPLOY_SOURCE_PATH="${DEPLOY_SOURCE_PATH:-}"

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

if ! command -v tar >/dev/null 2>&1; then
  echo "tar is required for deployment packaging."
  exit 1
fi

detect_compose_command() {
  if lxc exec "${CONTAINER_NAME}" -- bash -lc 'command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1'; then
    echo "podman compose"
    return 0
  fi

  if lxc exec "${CONTAINER_NAME}" -- bash -lc 'command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1'; then
    echo "docker compose"
    return 0
  fi

  if lxc exec "${CONTAINER_NAME}" -- bash -lc 'command -v podman-compose >/dev/null 2>&1'; then
    echo "podman-compose"
    return 0
  fi

  if lxc exec "${CONTAINER_NAME}" -- bash -lc 'command -v docker-compose >/dev/null 2>&1'; then
    echo "docker-compose"
    return 0
  fi

  return 1
}

ensure_compose_command() {
  local compose_cmd

  if compose_cmd="$(detect_compose_command)"; then
    echo "${compose_cmd}"
    return 0
  fi

  echo "No compose runtime found in container '${CONTAINER_NAME}'. Attempting to install one..."

  if ! lxc exec "${CONTAINER_NAME}" -- bash -lc 'command -v apt-get >/dev/null 2>&1'; then
    echo "Container does not provide apt-get, cannot auto-install compose runtime."
    return 1
  fi

  lxc exec "${CONTAINER_NAME}" --mode=non-interactive -- bash -lc 'export DEBIAN_FRONTEND=noninteractive; apt-get update && (apt-get install -y podman podman-compose || apt-get install -y docker.io docker-compose)'

  if compose_cmd="$(detect_compose_command)"; then
    echo "${compose_cmd}"
    return 0
  fi

  echo "Compose runtime is still unavailable after install attempt."
  return 1
}

REMOTE_SOURCE_DIR="${APP_DIR}/source"

normalize_repo_url() {
  local input_url="${1:-}"

  input_url="${input_url%%/tree/*}"
  input_url="${input_url%%/blob/*}"
  input_url="${input_url%%/issues/*}"
  input_url="${input_url%%/pull/*}"
  input_url="${input_url%.git}"

  if [[ "${input_url}" =~ ^https?://github\.com/[^/]+/[^/]+$ ]]; then
    echo "${input_url}.git"
    return 0
  fi

  echo "${input_url}"
}

ensure_container_dns() {
  if lxc exec "${CONTAINER_NAME}" -- bash -lc 'getent hosts github.com >/dev/null 2>&1'; then
    return 0
  fi

  lxc exec "${CONTAINER_NAME}" -- bash -lc 'cp /etc/resolv.conf /etc/resolv.conf.bak 2>/dev/null || true; cat > /etc/resolv.conf <<EOF
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF'

  if lxc exec "${CONTAINER_NAME}" -- bash -lc 'getent hosts github.com >/dev/null 2>&1'; then
    return 0
  fi

  echo "Unable to resolve github.com from the container even after DNS fallback."
  return 1
}

clone_or_copy_source() {
  if [[ -n "${DEPLOY_SOURCE_URL}" ]]; then
    local clone_url
    clone_url="$(normalize_repo_url "${DEPLOY_SOURCE_URL}")"
    ensure_container_dns
    lxc exec "${CONTAINER_NAME}" -- bash -lc 'command -v git >/dev/null 2>&1 || (export DEBIAN_FRONTEND=noninteractive; apt-get update && apt-get install -y git)'
    lxc exec "${CONTAINER_NAME}" -- bash -lc "rm -rf \"${REMOTE_SOURCE_DIR}\" && mkdir -p \"${APP_DIR}\" && git clone --depth 1 \"${clone_url}\" \"${REMOTE_SOURCE_DIR}\""
    return
  fi

  if [[ -n "${DEPLOY_SOURCE_PATH}" ]]; then
    if [[ -d "${DEPLOY_SOURCE_PATH}" ]]; then
      lxc file push --recursive "${DEPLOY_SOURCE_PATH}" "${CONTAINER_NAME}${REMOTE_SOURCE_DIR}"
      return
    fi

    if [[ -f "${DEPLOY_SOURCE_PATH}" ]]; then
      case "${DEPLOY_SOURCE_PATH}" in
        *.zip)
          if ! command -v unzip >/dev/null 2>&1; then
            echo "unzip is required to extract uploaded ZIP archives."
            exit 1
          fi

          local temp_dir
          temp_dir="$(mktemp -d /tmp/devops-lab-upload-XXXXXX)"
          unzip -q "${DEPLOY_SOURCE_PATH}" -d "${temp_dir}"
          lxc file push --recursive "${temp_dir}" "${CONTAINER_NAME}${REMOTE_SOURCE_DIR}"
          rm -rf "${temp_dir}"
          return
          ;;
        *)
          echo "Unsupported uploaded source format: ${DEPLOY_SOURCE_PATH}"
          exit 1
          ;;
      esac
    fi
  fi

  echo "No submitted repository URL or uploaded source was provided to the deployment stage."
  exit 1
}

detect_compose_file_remote() {
  lxc exec "${CONTAINER_NAME}" -- bash -lc "find \"${REMOTE_SOURCE_DIR}\" -maxdepth 5 \\( -name 'compose.yaml' -o -name 'compose.yml' -o -name 'docker-compose.yaml' -o -name 'docker-compose.yml' -o -name 'container-compose.yml' \\) | sort | head -n 1"
}

rewrite_localhost_api_urls() {
  lxc exec "${CONTAINER_NAME}" -- bash -lc "find \"${REMOTE_SOURCE_DIR}\" -maxdepth 6 -type f \\( -name '*.html' -o -name '*.js' -o -name '*.ts' -o -name '*.tsx' \\) -print0 | xargs -0 -r sed -i -E 's#https?://localhost:[0-9]+/todos#\\/todos#g'"
}

ensure_compose_dockerfile() {
  local compose_dir="$1"

  if lxc exec "${CONTAINER_NAME}" -- bash -lc "test -f \"${compose_dir}/Dockerfile\" || test -f \"${compose_dir}/dockerfile\""; then
    return 0
  fi

  if lxc exec "${CONTAINER_NAME}" -- bash -lc "test -f \"${compose_dir}/DockerFile\""; then
    lxc exec "${CONTAINER_NAME}" -- bash -lc "cp \"${compose_dir}/DockerFile\" \"${compose_dir}/Dockerfile\""
    echo "Normalized DockerFile to Dockerfile for compose build."
    return 0
  fi

  echo "No Dockerfile found in the compose directory."
  return 1
}

run_compose_up() {
  local compose_workdir="$1"
  local compose_command="$2"

  if [[ "${compose_command}" == "docker-compose" ]]; then
    lxc exec "${CONTAINER_NAME}" --mode=non-interactive -- bash -lc "cd \"${compose_workdir}\" && docker-compose down --remove-orphans || true"
    lxc exec "${CONTAINER_NAME}" --mode=non-interactive -- bash -lc "docker ps -aq --filter 'label=com.docker.compose.project=source' | xargs -r docker rm -f || true"
    lxc exec "${CONTAINER_NAME}" --mode=non-interactive -- bash -lc "cd \"${compose_workdir}\" && docker-compose up -d --build --force-recreate --remove-orphans"
    return
  fi

  lxc exec "${CONTAINER_NAME}" --mode=non-interactive -- bash -lc "cd \"${compose_workdir}\" && ${compose_command} up -d --build --remove-orphans"
}

lxc start "${CONTAINER_NAME}" >/dev/null 2>&1 || true
lxc exec "${CONTAINER_NAME}" -- mkdir -p "${APP_DIR}"
lxc exec "${CONTAINER_NAME}" -- bash -lc "rm -rf \"${REMOTE_SOURCE_DIR}\""
clone_or_copy_source
rewrite_localhost_api_urls

compose_file_path="$(detect_compose_file_remote || true)"
if [[ -z "${compose_file_path}" ]]; then
  echo "No compose file found in the submitted repository."
  exit 1
fi

compose_dir="$(dirname "${compose_file_path}")"
if [[ "${compose_dir}" == "${REMOTE_SOURCE_DIR}" ]]; then
  compose_rel_dir="."
else
  compose_rel_dir="${compose_dir#${REMOTE_SOURCE_DIR}/}"
fi

if ! ensure_compose_dockerfile "${compose_dir}"; then
  exit 1
fi

if ! compose_cmd="$(ensure_compose_command)"; then
  exit 1
fi

run_compose_up "${REMOTE_SOURCE_DIR}/${compose_rel_dir}" "${compose_cmd}"
lxc exec "${CONTAINER_NAME}" --mode=non-interactive -- bash -lc "cd \"${REMOTE_SOURCE_DIR}/${compose_rel_dir}\" && ${compose_cmd} ps"

echo "Compose deployment completed to LXD container '${CONTAINER_NAME}' from submitted repository."
