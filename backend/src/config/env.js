const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devops_automation",
  nodeEnv: process.env.NODE_ENV || "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  simulatePipeline: process.env.SIMULATE_PIPELINE !== "false",
  simulateSonarFail: process.env.SIMULATE_SONAR_FAIL === "true",
  sonarFailPattern: process.env.SONAR_FAIL_PATTERN || "QUALITY GATE STATUS: FAILED",
  sonarCommand: process.env.SONAR_COMMAND || "sonar-scanner",
  terraformInitCommand: process.env.TERRAFORM_INIT_COMMAND || "terraform init",
  terraformApplyCommand:
    process.env.TERRAFORM_APPLY_COMMAND || "terraform apply -auto-approve",
  ansibleCommand: process.env.ANSIBLE_COMMAND || "ansible-playbook playbook.yml",
  deploymentTarget: process.env.DEPLOYMENT_TARGET || "multipass",
  multipassCommand: process.env.MULTIPASS_COMMAND || "multipass launch",
  lxdCommand: process.env.LXD_COMMAND || "lxc launch ubuntu:22.04 app-instance",
  deployedAppUrl: process.env.DEPLOYED_APP_URL || "http://10.100.219.50:3000/",
};
