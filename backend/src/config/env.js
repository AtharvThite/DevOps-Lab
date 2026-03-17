const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devops_automation",
  nodeEnv: process.env.NODE_ENV || "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  pipelineWorkDir: process.env.PIPELINE_WORK_DIR || "workdir",
  gitBinary: process.env.GIT_BINARY || "git",
  sonarHostUrl: process.env.SONAR_HOST_URL || "http://localhost:9000",
  sonarToken: process.env.SONAR_TOKEN || "",
  sonarScannerBinary: process.env.SONAR_SCANNER_BINARY || "sonar-scanner",
  terraformPath: process.env.TERRAFORM_PATH || "terraform",
  terraformBinary: process.env.TERRAFORM_BINARY || "terraform",
  ansiblePath: process.env.ANSIBLE_PATH || "ansible",
  ansibleBinary: process.env.ANSIBLE_BINARY || "ansible-playbook",
  ansibleInventoryFile: process.env.ANSIBLE_INVENTORY_FILE || "inventory.ini",
  ansiblePlaybookFile: process.env.ANSIBLE_PLAYBOOK_FILE || "deploy.yml",
  deploymentTarget: process.env.DEPLOYMENT_TARGET || "multipass",
  multipassBinary: process.env.MULTIPASS_BINARY || "multipass",
  lxdBinary: process.env.LXD_BINARY || "lxc",
  lxdImage: process.env.LXD_IMAGE || "ubuntu:22.04",
  deploymentExecCommand: process.env.DEPLOYMENT_EXEC_COMMAND || "",
};
