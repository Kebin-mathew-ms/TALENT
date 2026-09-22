const { LocalSandboxProvider } = require('./localSandboxProvider');
const prisma = require('../../config/db');

const sandbox = new LocalSandboxProvider();

class CodeExecutionService {
  /**
   * Execute candidate code safely and record in database if requested
   */
  static async executeCode({ sessionId, questionId, language, code, stdin = '', candidateId = null }) {
    if (!code || typeof code !== 'string') {
      throw new Error('Code is required for execution');
    }

    if (code.length > 50000) {
      throw new Error('Code exceeds maximum size limit of 50KB');
    }

    const normalizedLang = (language || 'javascript').toLowerCase();
    if (!['javascript', 'nodejs', 'js', 'python', 'py'].includes(normalizedLang)) {
      throw new Error(`Unsupported programming language: ${language}`);
    }

    const langKey = (normalizedLang === 'python' || normalizedLang === 'py') ? 'python' : 'javascript';

    const result = await sandbox.execute({
      language: langKey,
      code,
      stdin
    });

    let executionRecord = null;
    if (sessionId && candidateId) {
      executionRecord = await prisma.codeExecution.create({
        data: {
          sessionId,
          candidateId,
          questionId: questionId || null,
          language: langKey,
          code,
          stdin,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          executionTimeMs: result.executionTimeMs,
          timedOut: result.timedOut,
          memoryUsageBytes: result.memoryUsageBytes,
          status: result.timedOut ? 'TIMEOUT' : (result.exitCode === 0 ? 'SUCCESS' : 'ERROR')
        }
      });
    }

    return {
      executionId: executionRecord?.id || null,
      status: result.timedOut ? 'TIMEOUT' : (result.exitCode === 0 ? 'SUCCESS' : 'ERROR'),
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTimeMs,
      timedOut: result.timedOut
    };
  }
}

module.exports = { CodeExecutionService };
