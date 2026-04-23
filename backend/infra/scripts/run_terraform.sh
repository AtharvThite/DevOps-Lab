#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-apply}"

CURRENT_USER="${USER:-$(id -un)}"
if [[ "${LXD_GROUP_REEXEC:-0}" != "1" ]] && ! id -Gn | grep -qw lxd; then
  if id -Gn "${CURRENT_USER}" | grep -qw lxd && command -v sg >/dev/null 2>&1; then
    exec sg lxd -c "LXD_GROUP_REEXEC=1 bash '$0' '${ACTION}'"
  fi

  echo "Current shell does not have lxd group access."
  echo "Run: newgrp lxd (or log out/in) before running Terraform stage."
  exit 1
fi

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${BACKEND_DIR}/infra/terraform"

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform is not installed. Install Terraform first."
  exit 1
fi

cd "${TF_DIR}"

if [[ -n "${LXD_CONTAINER_NAME:-}" ]]; then
  export TF_VAR_lxd_container_name="${LXD_CONTAINER_NAME}"
fi

if [[ -n "${LXD_PROFILE_NAME:-}" ]]; then
  export TF_VAR_lxd_profile_name="${LXD_PROFILE_NAME}"
fi

if [[ -n "${LXD_IMAGE:-}" ]]; then
  export TF_VAR_lxd_image="${LXD_IMAGE}"
fi

if [[ -n "${LXD_STORAGE_POOL:-}" ]]; then
  export TF_VAR_lxd_storage_pool="${LXD_STORAGE_POOL}"
fi

if [[ -n "${LXD_NETWORK:-}" ]]; then
  export TF_VAR_lxd_network="${LXD_NETWORK}"
fi

if [[ -n "${LXD_CPU:-}" ]]; then
  export TF_VAR_lxd_cpu="${LXD_CPU}"
fi

if [[ -n "${LXD_MEMORY:-}" ]]; then
  export TF_VAR_lxd_memory="${LXD_MEMORY}"
fi

case "${ACTION}" in
  init)
    terraform init -input=false
    ;;
  apply)
    terraform apply -auto-approve -input=false
    ;;
  plan)
    terraform plan
    ;;
  destroy)
    terraform destroy -auto-approve -input=false
    ;;
  *)
    echo "Unsupported action: ${ACTION}"
    echo "Usage: bash ./infra/scripts/run_terraform.sh [init|apply|plan|destroy]"
    exit 1
    ;;
esac
