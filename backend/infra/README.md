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
