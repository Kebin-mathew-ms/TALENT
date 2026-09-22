const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const TIMEOUT_MS = 5000;
const MAX_OUTPUT_BYTES = 10240; // 10KB limit

class LocalSandboxProvider {
  /**
   * Run candidate code in an isolated child process
   */
  async execute({ language, code, stdin = '' }) {
    const fileExtension = language === 'python' ? '.py' : '.js';
    const tempFileName = `talent_exec_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    await fs.writeFile(tempFilePath, code, 'utf8');

    let command = '';
    let args = [];

    if (language === 'javascript' || language === 'nodejs') {
      command = process.execPath;
      args = [tempFilePath];
    } else if (language === 'python') {
      command = process.platform === 'win32' ? 'python' : 'python3';
      args = [tempFilePath];
    } else {
      await fs.unlink(tempFilePath).catch(() => {});
      throw new Error(`Unsupported programming language: ${language}`);
    }

    const startTime = Date.now();
    let timedOut = false;
    let stdout = '';
    let stderr = '';
    let exitCode = null;

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, TIMEOUT_MS);

      if (stdin) {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.stdout.on('data', (chunk) => {
        if (stdout.length < MAX_OUTPUT_BYTES) {
          stdout += chunk.toString('utf8');
          if (stdout.length > MAX_OUTPUT_BYTES) {
            stdout = stdout.substring(0, MAX_OUTPUT_BYTES) + '\n...[Output Truncated at 10KB]';
          }
        }
      });

      child.stderr.on('data', (chunk) => {
        if (stderr.length < MAX_OUTPUT_BYTES) {
          stderr += chunk.toString('utf8');
          if (stderr.length > MAX_OUTPUT_BYTES) {
            stderr = stderr.substring(0, MAX_OUTPUT_BYTES) + '\n...[Output Truncated at 10KB]';
          }
        }
      });

      child.on('error', (err) => {
        stderr += `Process execution error: ${err.message}`;
      });

      child.on('close', async (code) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;
        exitCode = code;

        await fs.unlink(tempFilePath).catch(() => {});

        if (timedOut) {
          stderr += `\n[Execution Error]: Time limit exceeded (${TIMEOUT_MS / 1000}s)`;
        }

        resolve({
          stdout: stdout.trimEnd(),
          stderr: stderr.trimEnd(),
          exitCode: timedOut ? -1 : exitCode ?? 0,
          executionTimeMs,
          timedOut,
          memoryUsageBytes: process.memoryUsage().heapUsed
        });
      });
    });
  }
}

module.exports = { LocalSandboxProvider };
