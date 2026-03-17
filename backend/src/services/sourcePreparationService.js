const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const config = require("../config/env");
const { runProcess } = require("./commandRunner");

function ensureCleanDirectory(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

async function extractZip(zipFilePath, outputDir) {
  await fs
    .createReadStream(zipFilePath)
    .pipe(unzipper.Extract({ path: outputDir }))
    .promise();
}

async function cloneRepo(repoUrl, outputDir, onLog) {
  await runProcess(config.gitBinary, ["clone", "--depth", "1", repoUrl, outputDir], {
    cwd: process.cwd(),
    onStdoutLine: onLog,
    onStderrLine: onLog,
  });
}

async function prepareSource({ job, onLog }) {
  const baseDir = path.resolve(config.pipelineWorkDir, job._id.toString());
  const sourceDir = path.join(baseDir, "source");

  ensureCleanDirectory(baseDir);

  // Use a dedicated per-job directory to keep concurrent jobs isolated.
  if (job.repoUrl) {
    onLog("Cloning repository source");
    await cloneRepo(job.repoUrl, sourceDir, onLog);
    return sourceDir;
  }

  if (job.filePath) {
    onLog("Extracting uploaded ZIP source");
    fs.mkdirSync(sourceDir, { recursive: true });
    await extractZip(job.filePath, sourceDir);
    return sourceDir;
  }

  throw new Error("No source provided for pipeline execution");
}

module.exports = {
  prepareSource,
};
