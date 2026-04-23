#!/usr/bin/env bash
set -euo pipefail

CURRENT_USER="${USER:-$(id -un)}"
if [[ "${LXD_GROUP_REEXEC:-0}" != "1" ]] && ! id -Gn | grep -qw lxd; then
  if id -Gn "${CURRENT_USER}" | grep -qw lxd && command -v sg >/dev/null 2>&1; then
    exec sg lxd -c "LXD_GROUP_REEXEC=1 bash '$0'"
  fi

  echo "Current shell does not have lxd group access."
  echo "Run: newgrp lxd (or log out/in) before running Ansible stage."
  exit 1
fi

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANSIBLE_DIR="${BACKEND_DIR}/infra/ansible"

if ! command -v ansible-playbook >/dev/null 2>&1; then
  echo "ansible-playbook is not installed. Install Ansible first."
  exit 1
fi

export ANSIBLE_CONFIG="${ANSIBLE_DIR}/ansible.cfg"

ansible-playbook -i "${ANSIBLE_DIR}/inventory.ini" "${ANSIBLE_DIR}/playbook.yml"
