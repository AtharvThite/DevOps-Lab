const PipelineJob = require("../models/PipelineJob");
const { runCommand } = require("./commandRunner");
const config = require("../config/env");

const STAGE_ORDER = ["sonar", "terraform", "ansible", "deployment"];
const URL_PATTERN = /(https?:\/\/[^\s"')]+)/i;

function detectDeployedUrl(lines = []) {
  for (const line of lines) {
    const match = line.match(URL_PATTERN);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendLog(jobId, stage, message) {
  await PipelineJob.findByIdAndUpdate(jobId, {
    $push: {
      [`stages.${stage}.logs`]: `${new Date().toISOString()} | ${message}`,
    },
  });
}

async function updateStage(jobId, stage, status, extras = {}) {
  const payload = {
    [`stages.${stage}.status`]: status,
    ...extras,
  };

  await PipelineJob.findByIdAndUpdate(jobId, { $set: payload });
}

async function runSimulatedStage(jobId, stage, messages) {
  await updateStage(jobId, stage, "running", {
    [`stages.${stage}.startedAt`]: new Date(),
    currentStage: stage,
  });

  for (const message of messages) {
    await appendLog(jobId, stage, message);
    await sleep(800);
  }

  if (stage === "sonar" && config.simulateSonarFail) {
    await appendLog(jobId, stage, "QUALITY GATE STATUS: FAILED");
    throw new Error("Pipeline stopped because SonarQube quality gate failed");
  }

  await updateStage(jobId, stage, "success", {
    [`stages.${stage}.finishedAt`]: new Date(),
  });

  return [];
}

async function executeRealStage(job, stage, command, options = {}) {
  await updateStage(job._id, stage, "running", {
    [`stages.${stage}.startedAt`]: new Date(),
    currentStage: stage,
  });

  await appendLog(job._id, stage, `Executing command: ${command}`);

  const stageOutput = [];

  await runCommand(command, {
    cwd: process.cwd(),
    env: options.env,
    onLog: async (line) => {
      if (line) {
        stageOutput.push(line);
        await appendLog(job._id, stage, line);
      }
    },
  });

  if (stage === "sonar") {
    const qualityGateFailed = stageOutput.some((line) =>
      line.toUpperCase().includes(config.sonarFailPattern.toUpperCase())
    );

    if (qualityGateFailed) {
      throw new Error("Pipeline stopped because SonarQube quality gate failed");
    }
  }

  await updateStage(job._id, stage, "success", {
    [`stages.${stage}.finishedAt`]: new Date(),
  });

  return stageOutput;
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

async function runPipeline(jobId) {
  const job = await PipelineJob.findById(jobId);
  if (!job) {
    return;
  }

  await PipelineJob.findByIdAndUpdate(jobId, {
    $set: {
      status: "running",
      currentStage: "sonar",
      deployedUrl: "",
    },
  });

  const stageConfigs = {
    sonar: {
      command: config.sonarCommand,
      logs: [
        "Preparing SonarQube scanner context",
        "Analyzing code quality metrics",
        "Evaluating quality gate",
      ],
    },
    terraform: {
      command: `${config.terraformInitCommand} && ${config.terraformApplyCommand}`,
      logs: [
        "Initializing Terraform backend and providers",
        "Planning infrastructure changes",
        "Applying infrastructure with auto approval",
      ],
    },
    ansible: {
      command: config.ansibleCommand,
      logs: [
        "Loading Ansible inventory",
        "Applying configuration tasks",
        "Verifying service health checks",
      ],
    },
    deployment: {
      command:
        config.deploymentTarget.toLowerCase() === "lxd"
          ? config.lxdCommand
          : config.multipassCommand,
      logs: [
        `Provisioning runtime instance using ${config.deploymentTarget}`,
        "Deploying application artifacts",
        "Running post-deployment verification",
      ],
    },
  };

  try {
    let deploymentStageOutput = [];

    for (const stage of STAGE_ORDER) {
      const stageConfig = stageConfigs[stage];

      if (config.simulatePipeline) {
        await runSimulatedStage(jobId, stage, stageConfig.logs);
      } else {
        const stageOptions =
          stage === "deployment"
            ? {
                env: {
                  DEPLOY_SOURCE_URL: job.repoUrl || "",
                  DEPLOY_SOURCE_PATH: job.filePath || "",
                },
              }
            : {};

        const stageOutput = await executeRealStage(job, stage, stageConfig.command, stageOptions);

        if (stage === "deployment") {
          deploymentStageOutput = stageOutput;
        }
      }

    }

    const deployedUrl =
      config.deployedAppUrl ||
      detectDeployedUrl(deploymentStageOutput) ||
      "";

    await PipelineJob.findByIdAndUpdate(jobId, {
      $set: {
        status: "success",
        currentStage: "completed",
        error: "",
        deployedUrl,
      },
    });
  } catch (error) {
    const failedJob = await PipelineJob.findById(jobId);
    const failedStage = failedJob?.currentStage || "sonar";

    await updateStage(jobId, failedStage, "failed", {
      [`stages.${failedStage}.finishedAt`]: new Date(),
    });
    await appendLog(jobId, failedStage, error.message);
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
