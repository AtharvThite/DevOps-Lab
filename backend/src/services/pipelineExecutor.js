const PipelineJob = require("../models/PipelineJob");
const config = require("../config/env");
const { prepareSource } = require("./sourcePreparationService");
const { runSonarStage } = require("./sonarService");
const { runTerraformStage } = require("./terraformService");
const { runAnsibleStage } = require("./ansibleService");
const { runDeploymentStage } = require("./deploymentService");

const STAGE_ORDER = ["sonar", "terraform", "ansible", "deployment"];

async function appendLog(jobId, stage, message) {
  await PipelineJob.findByIdAndUpdate(jobId, {
    $push: {
      [`stages.${stage}.logs`]: `${new Date().toISOString()} | ${message}`,
    },
  });
}

async function updateStage(jobId, stage, status, extras = {}) {
  await PipelineJob.findByIdAndUpdate(jobId, {
    $set: {
      [`stages.${stage}.status`]: status,
      ...extras,
    },
  });
}

async function markRemainingAsSkipped(jobId, failedStage) {
  const failedIndex = STAGE_ORDER.indexOf(failedStage);

  for (let index = failedIndex + 1; index < STAGE_ORDER.length; index += 1) {
    const stage = STAGE_ORDER[index];
    await updateStage(jobId, stage, "skipped", {
      [`stages.${stage}.finishedAt`]: new Date(),
    });
    await appendLog(jobId, stage, "Skipped due to previous stage failure");
  }
}

function ensureRuntimeConfig() {
  if (!config.sonarToken) {
    throw new Error("SONAR_TOKEN is required for real SonarQube integration");
  }

  if (!["multipass", "lxd"].includes(config.deploymentTarget.toLowerCase())) {
    throw new Error("DEPLOYMENT_TARGET must be either multipass or lxd");
  }
}

async function runStage(jobId, stage, stageRunner) {
  await updateStage(jobId, stage, "running", {
    currentStage: stage,
    [`stages.${stage}.startedAt`]: new Date(),
    [`stages.${stage}.finishedAt`]: null,
  });

  const appendStageLog = async (line) => {
    await appendLog(jobId, stage, line);
  };

  await stageRunner(appendStageLog);

  await updateStage(jobId, stage, "success", {
    [`stages.${stage}.finishedAt`]: new Date(),
  });
}

async function runPipeline(jobId) {
  const job = await PipelineJob.findById(jobId);
  if (!job) {
    return;
  }

  try {
    ensureRuntimeConfig();

    await PipelineJob.findByIdAndUpdate(jobId, {
      $set: {
        status: "running",
        currentStage: "sonar",
        error: "",
      },
    });

    // Prepare source once, then pass paths to each stage for real command execution.
    const sourceDir = await prepareSource({
      job,
      onLog: async (line) => {
        await appendLog(jobId, "sonar", `[source] ${line}`);
      },
    });

    const projectKey = `pipeline-${jobId.toString()}`;

    // Step 1 and 2: run Sonar scan and verify quality gate through Sonar API.
    await runStage(jobId, "sonar", async (appendStageLog) => {
      await runSonarStage({
        projectKey,
        sourceDir,
        appendLog: appendStageLog,
      });
    });

    // Step 3: provision infrastructure from Terraform folder.
    await runStage(jobId, "terraform", async (appendStageLog) => {
      await runTerraformStage({
        sourceDir,
        appendLog: appendStageLog,
      });
    });

    // Step 4: configure infrastructure with Ansible inventory/playbook.
    await runStage(jobId, "ansible", async (appendStageLog) => {
      await runAnsibleStage({
        sourceDir,
        appendLog: appendStageLog,
      });
    });

    // Step 5: deploy on Multipass or LXD and persist instance metadata.
    await runStage(jobId, "deployment", async (appendStageLog) => {
      const deploymentInfo = await runDeploymentStage({
        jobId,
        appendLog: appendStageLog,
      });

      await PipelineJob.findByIdAndUpdate(jobId, {
        $set: {
          deploymentInfo,
        },
      });
    });

    await PipelineJob.findByIdAndUpdate(jobId, {
      $set: {
        status: "success",
        currentStage: "completed",
      },
    });
  } catch (error) {
    const failedJob = await PipelineJob.findById(jobId);
    const failedStage = failedJob?.currentStage || "sonar";

    await updateStage(jobId, failedStage, "failed", {
      [`stages.${failedStage}.finishedAt`]: new Date(),
    });
    await appendLog(jobId, failedStage, `ERROR: ${error.message}`);
    await markRemainingAsSkipped(jobId, failedStage);

    await PipelineJob.findByIdAndUpdate(jobId, {
      $set: {
        status: "failed",
        error: error.message,
      },
    });
  }
}

module.exports = {
  runPipeline,
};
