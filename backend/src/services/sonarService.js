const config = require("../config/env");
const { runProcess } = require("./commandRunner");

async function checkQualityGate(projectKey) {
  if (typeof fetch !== "function") {
    throw new Error("Node.js runtime does not support fetch API for quality gate check");
  }

  const url = new URL("/api/qualitygates/project_status", config.sonarHostUrl);
  url.searchParams.set("projectKey", projectKey);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${config.sonarToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SonarQube quality gate API failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return payload?.projectStatus?.status || "UNKNOWN";
}

async function runSonarStage({ projectKey, sourceDir, appendLog }) {
  const args = [
    `-Dsonar.projectKey=${projectKey}`,
    `-Dsonar.sources=${sourceDir}`,
    `-Dsonar.host.url=${config.sonarHostUrl}`,
    `-Dsonar.login=${config.sonarToken}`,
  ];

  await appendLog(`Running ${config.sonarScannerBinary} ${args.join(" ")}`);

  await runProcess(config.sonarScannerBinary, args, {
    cwd: sourceDir,
    onStdoutLine: appendLog,
    onStderrLine: appendLog,
  });

  await appendLog("Checking SonarQube quality gate status");
  const qualityGateStatus = await checkQualityGate(projectKey);
  await appendLog(`Quality Gate Result: ${qualityGateStatus}`);

  if (qualityGateStatus !== "OK") {
    throw new Error(`SonarQube quality gate failed with status: ${qualityGateStatus}`);
  }
}

module.exports = {
  runSonarStage,
};
