# DevOps Tooling

This directory contains the real execution assets used by the backend pipeline stages.

## Stage Assets

- SonarQube: `../../sonar-project.properties` with `scripts/run_sonar.sh`
- Terraform: `terraform/*.tf` with `scripts/run_terraform.sh`
- Ansible: `ansible/playbook.yml` with `scripts/run_ansible.sh`
- Deployment (LXD): `scripts/deploy_lxd.sh`

## Run Manually

From `backend/`:

```bash
bash ./infra/scripts/run_sonar.sh
bash ./infra/scripts/run_terraform.sh init
bash ./infra/scripts/run_terraform.sh apply
bash ./infra/scripts/run_ansible.sh
bash ./infra/scripts/deploy_lxd.sh
```

## Required Host Tools

- `sonar-scanner`
- `terraform`
- `ansible-playbook`
- `lxc`

Install these on the machine where the backend server executes pipeline commands.

## LXD Networking Persistence

Terraform now provisions reproducible guest networking for the LXD app container so deployment survives container recreation without manual netplan edits.

- Static IPv4, default gateway, and DNS are injected via cloud-init network config.
- The LXD NIC reservation is also pinned with `ipv4.address` on the profile.
- Tune values in `terraform/terraform.tfvars` (see `terraform/terraform.tfvars.example`), especially if your `lxdbr0` subnet differs.
