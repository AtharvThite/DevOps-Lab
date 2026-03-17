const config = require("../config/env");
const { runProcess } = require("./commandRunner");

function buildInstanceName(jobId) {
  return `devops-${jobId.toString().slice(-8)}`;
}

async function runMultipassDeployment({ instanceName, appendLog }) {
  await appendLog(`Launching Multipass instance: ${instanceName}`);
  await runProcess(config.multipassBinary, ["launch", "--name", instanceName], {
    cwd: process.cwd(),
    onStdoutLine: appendLog,
    onStderrLine: appendLog,
  });

  if (config.deploymentExecCommand) {
    await appendLog(`Executing command in Multipass instance: ${config.deploymentExecCommand}`);
    await runProcess(
      config.multipassBinary,
      ["exec", instanceName, "--", "bash", "-lc", config.deploymentExecCommand],
      {
        cwd: process.cwd(),
        onStdoutLine: appendLog,
        onStderrLine: appendLog,
      }
    );
  }
}

async function runLxdDeployment({ instanceName, appendLog }) {
  await appendLog(`Launching LXD container: ${instanceName}`);
  await runProcess(config.lxdBinary, ["launch", config.lxdImage, instanceName], {
    cwd: process.cwd(),
    onStdoutLine: appendLog,
    onStderrLine: appendLog,
  });

  if (config.deploymentExecCommand) {
    await appendLog(`Executing command in LXD container: ${config.deploymentExecCommand}`);
    await runProcess(
      config.lxdBinary,
      ["exec", instanceName, "--", "bash", "-lc", config.deploymentExecCommand],
      {
        cwd: process.cwd(),
        onStdoutLine: appendLog,
        onStderrLine: appendLog,
      }
    );
  }
}

async function runDeploymentStage({ jobId, appendLog }) {
  const target = config.deploymentTarget.toLowerCase();
  const instanceName = buildInstanceName(jobId);

  if (target === "lxd") {
    await runLxdDeployment({ instanceName, appendLog });
    return { target: "lxd", instanceName, instanceStatus: "running" };
  }

  await runMultipassDeployment({ instanceName, appendLog });
  return { target: "multipass", instanceName, instanceStatus: "running" };
}

module.exports = {
  runDeploymentStage,
};
