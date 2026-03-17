const { spawn } = require("child_process");
const config = require("../config/env");

function checkBinary(binary) {
  return new Promise((resolve) => {
    const finder = process.platform === "win32" ? "where" : "which";
    const child = spawn(finder, [binary], {
      shell: false,
      windowsHide: true,
    });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        binary,
        available: code === 0,
        location: output.trim(),
        details: errorOutput.trim(),
      });
    });

    child.on("error", (error) => {
      resolve({
        binary,
        available: false,
        location: "",
        details: error.message,
      });
    });
  });
}

function checkRequiredEnv() {
  const checks = [
    { key: "SONAR_HOST_URL", value: config.sonarHostUrl },
    { key: "SONAR_TOKEN", value: config.sonarToken },
    { key: "TERRAFORM_PATH", value: config.terraformPath },
    { key: "ANSIBLE_PATH", value: config.ansiblePath },
    { key: "ANSIBLE_INVENTORY_FILE", value: config.ansibleInventoryFile },
    { key: "ANSIBLE_PLAYBOOK_FILE", value: config.ansiblePlaybookFile },
    { key: "DEPLOYMENT_TARGET", value: config.deploymentTarget },
  ];

  return checks.map((check) => ({
    key: check.key,
    valid: Boolean(check.value),
    message: check.value ? "ok" : `${check.key} is missing`,
  }));
}

async function runPreflightChecks() {
  const requiredEnv = checkRequiredEnv();

  const binariesToCheck = [
    config.gitBinary,
    config.sonarScannerBinary,
    config.terraformBinary,
    config.ansibleBinary,
  ];

  if (config.deploymentTarget.toLowerCase() === "lxd") {
    binariesToCheck.push(config.lxdBinary);
  } else {
    binariesToCheck.push(config.multipassBinary);
  }

  const uniqueBinaries = [...new Set(binariesToCheck.filter(Boolean))];
  const binaryResults = await Promise.all(uniqueBinaries.map((binary) => checkBinary(binary)));

  const envOk = requiredEnv.every((item) => item.valid);
  const binariesOk = binaryResults.every((item) => item.available);

  return {
    ready: envOk && binariesOk,
    requiredEnv,
    binaries: binaryResults,
    deploymentTarget: config.deploymentTarget,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  runPreflightChecks,
};
