const path = require("path");
const config = require("../config/env");
const { runProcess } = require("./commandRunner");

async function runAnsibleStage({ sourceDir, appendLog }) {
  const ansibleDir = path.resolve(sourceDir, config.ansiblePath);

  await appendLog(`Ansible working directory: ${ansibleDir}`);
  await appendLog(`Running ansible-playbook -i ${config.ansibleInventoryFile} ${config.ansiblePlaybookFile}`);

  await runProcess(
    config.ansibleBinary,
    ["-i", config.ansibleInventoryFile, config.ansiblePlaybookFile],
    {
      cwd: ansibleDir,
      onStdoutLine: appendLog,
      onStderrLine: appendLog,
    }
  );
}

module.exports = {
  runAnsibleStage,
};
