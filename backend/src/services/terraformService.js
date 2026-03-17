const path = require("path");
const config = require("../config/env");
const { runProcess } = require("./commandRunner");

async function runTerraformStage({ sourceDir, appendLog }) {
  const terraformDir = path.resolve(sourceDir, config.terraformPath);

  await appendLog(`Terraform working directory: ${terraformDir}`);
  await appendLog("Running terraform init");
  await runProcess(config.terraformBinary, ["init"], {
    cwd: terraformDir,
    onStdoutLine: appendLog,
    onStderrLine: appendLog,
  });

  await appendLog("Running terraform apply -auto-approve");
  await runProcess(config.terraformBinary, ["apply", "-auto-approve"], {
    cwd: terraformDir,
    onStdoutLine: appendLog,
    onStderrLine: appendLog,
  });
}

module.exports = {
  runTerraformStage,
};
