const { runPipeline } = require("./pipelineExecutor");

class PipelineQueue {
  constructor() {
    this.jobs = [];
    this.processing = false;
  }

  enqueue(jobId) {
    this.jobs.push(jobId);
    this.processNext();
  }

  async processNext() {
    if (this.processing || this.jobs.length === 0) {
      return;
    }

    this.processing = true;
    const nextJobId = this.jobs.shift();

    try {
      await runPipeline(nextJobId);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}

module.exports = new PipelineQueue();
