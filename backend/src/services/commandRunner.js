const { spawn } = require("child_process");

function runCommand(command, options = {}) {
  const { cwd, onLog } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
    });

    child.stdout.on("data", (data) => {
      const text = data.toString();
      if (onLog) {
        onLog(text.trim());
      }
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      if (onLog) {
        onLog(text.trim());
      }
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command} (exit code ${code})`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

module.exports = { runCommand };
