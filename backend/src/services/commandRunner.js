const { spawn } = require("child_process");

function emitLines(chunk, remainder, callback) {
  const combined = `${remainder}${chunk.toString()}`;
  const parts = combined.split(/\r?\n/);
  const newRemainder = parts.pop() || "";

  parts.forEach((line) => {
    if (line.trim()) {
      callback(line);
    }
  });

  return newRemainder;
}

function runProcess(executable, args = [], options = {}) {
  const { cwd, onStdoutLine, onStderrLine } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      shell: false,
      env: process.env,
      windowsHide: true,
    });

    let stdoutRemainder = "";
    let stderrRemainder = "";
    let stdoutChain = Promise.resolve();
    let stderrChain = Promise.resolve();

    child.stdout.on("data", (data) => {
      if (!onStdoutLine) {
        return;
      }

      stdoutRemainder = emitLines(data, stdoutRemainder, (line) => {
        stdoutChain = stdoutChain.then(() => Promise.resolve(onStdoutLine(line)));
      });
    });

    child.stderr.on("data", (data) => {
      if (!onStderrLine) {
        return;
      }

      stderrRemainder = emitLines(data, stderrRemainder, (line) => {
        stderrChain = stderrChain.then(() => Promise.resolve(onStderrLine(line)));
      });
    });

    child.on("close", (code) => {
      if (stdoutRemainder.trim() && onStdoutLine) {
        stdoutChain = stdoutChain.then(() => Promise.resolve(onStdoutLine(stdoutRemainder)));
      }
      if (stderrRemainder.trim() && onStderrLine) {
        stderrChain = stderrChain.then(() => Promise.resolve(onStderrLine(stderrRemainder)));
      }

      Promise.all([stdoutChain, stderrChain])
        .then(() => {
          if (code === 0) {
            resolve();
            return;
          }

          reject(
            new Error(
              `Command failed: ${executable} ${args.join(" ")} (exit code ${code})`
            )
          );
        })
        .catch((error) => {
          reject(error);
        });
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

module.exports = { runProcess };
