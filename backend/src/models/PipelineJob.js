const mongoose = require("mongoose");

const stageSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "running", "success", "failed", "skipped"],
      default: "pending",
    },
    logs: {
      type: [String],
      default: [],
    },
    startedAt: Date,
    finishedAt: Date,
  },
  { _id: false }
);

const pipelineJobSchema = new mongoose.Schema(
  {
    repoUrl: {
      type: String,
      default: "",
    },
    filePath: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["queued", "running", "success", "failed"],
      default: "queued",
      index: true,
    },
    stages: {
      sonar: { type: stageSchema, default: () => ({}) },
      terraform: { type: stageSchema, default: () => ({}) },
      ansible: { type: stageSchema, default: () => ({}) },
      deployment: { type: stageSchema, default: () => ({}) },
    },
    currentStage: {
      type: String,
      default: "queued",
    },
    error: {
      type: String,
      default: "",
    },
    deploymentInfo: {
      target: { type: String, default: "" },
      instanceName: { type: String, default: "" },
      instanceStatus: { type: String, default: "" },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

module.exports = mongoose.model("PipelineJob", pipelineJobSchema);
