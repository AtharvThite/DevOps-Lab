const path = require("path");
const PipelineJob = require("../models/PipelineJob");
const pipelineQueue = require("../services/pipelineQueue");
const { runPreflightChecks } = require("../services/preflightService");

function buildJobPayload({ repoUrl, filePath }) {
  return {
    repoUrl: repoUrl || "",
    filePath: filePath || "",
    status: "queued",
    currentStage: "queued",
    stages: {
      sonar: { status: "pending", logs: [] },
      terraform: { status: "pending", logs: [] },
      ansible: { status: "pending", logs: [] },
      deployment: { status: "pending", logs: [] },
    },
    deploymentInfo: {
      target: "",
      instanceName: "",
      instanceStatus: "",
    },
  };
}

function isValidGithubUrl(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes("github.com");
  } catch (_error) {
    return false;
  }
}

async function runPipeline(req, res) {
  try {
    const repoUrl = typeof req.body.repoUrl === "string" ? req.body.repoUrl.trim() : "";
    const uploadedFile = req.file;

    if (!repoUrl && !uploadedFile) {
      return res.status(400).json({
        message: "Provide either a GitHub repository URL or a ZIP file upload",
      });
    }

    if (repoUrl && uploadedFile) {
      return res.status(400).json({
        message: "Provide either repo URL or ZIP file, not both",
      });
    }

    if (repoUrl && !isValidGithubUrl(repoUrl)) {
      return res.status(400).json({
        message: "Repository URL must be a valid GitHub URL",
      });
    }

    const filePath = uploadedFile ? path.normalize(uploadedFile.path) : "";

    const job = await PipelineJob.create(buildJobPayload({ repoUrl, filePath }));
    pipelineQueue.enqueue(job._id.toString());

    return res.status(202).json({
      message: "Pipeline queued successfully",
      jobId: job._id,
      status: job.status,
      createdAt: job.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getPipelineStatus(req, res) {
  try {
    const { id } = req.params;
    const job = await PipelineJob.findById(id).lean();

    if (!job) {
      return res.status(404).json({ message: "Pipeline job not found" });
    }

    return res.json({
      id: job._id,
      status: job.status,
      currentStage: job.currentStage,
      stages: job.stages,
      error: job.error,
      deploymentInfo: job.deploymentInfo,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getPipelineLogs(req, res) {
  try {
    const { id } = req.params;
    const job = await PipelineJob.findById(id).lean();

    if (!job) {
      return res.status(404).json({ message: "Pipeline job not found" });
    }

    return res.json({
      id: job._id,
      logs: {
        sonar: job.stages.sonar.logs,
        terraform: job.stages.terraform.logs,
        ansible: job.stages.ansible.logs,
        deployment: job.stages.deployment.logs,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getPipelineHistory(_req, res) {
  try {
    const jobs = await PipelineJob.find({})
      .sort({ createdAt: -1 })
      .select("repoUrl filePath status stages currentStage createdAt updatedAt error deploymentInfo")
      .lean();

    return res.json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getPipelinePreflight(_req, res) {
  try {
    const checks = await runPreflightChecks();
    return res.json(checks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  runPipeline,
  getPipelineStatus,
  getPipelineLogs,
  getPipelineHistory,
  getPipelinePreflight,
};
