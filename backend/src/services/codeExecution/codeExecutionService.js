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

    // Fetch question to retrieve expected output sample if available
    let targetQuestion = null;
    if (questionId) {
      targetQuestion = await prisma.question.findUnique({
        where: { id: parseInt(questionId, 10) }
      }).catch(() => null);
    }

    let executableCode = code;
    const expectedOutput = targetQuestion?.expectedOutput || null;

    if (langKey === 'javascript') {
      const hasSolutionFunc = /function\s+solution\s*\(/.test(code) || /const\s+solution\s*=/.test(code) || /let\s+solution\s*=/.test(code);
      const hasDirectLog = /console\.log\s*\(/.test(code);

      if (hasSolutionFunc && !hasDirectLog) {
        let sampleArgString = "[1, 2, 3, 4, 5]";
        if (targetQuestion?.description) {
          const match = targetQuestion.description.match(/Input:\s*([^\n,]+)/i);
          if (match && match[1]) {
            const rawInp = match[1].replace(/^[a-zA-Z0-9_]+\s*=\s*/, '').trim();
            if (rawInp && rawInp.startsWith('[') && rawInp.endsWith(']')) {
              sampleArgString = rawInp;
            }
          }
        }

        executableCode += `\n\n// --- Automated Test Harness ---
if (typeof solution === 'function') {
  try {
    let _arg = ${sampleArgString};
    let _res = solution(_arg);
    if (_res !== undefined) {
      console.log("=== Execution Test Output ===");
      console.log("Sample Input:", JSON.stringify(_arg));
      console.log("Return Value:", JSON.stringify(_res));
      ${expectedOutput ? `console.log("Expected Output:", ${JSON.stringify(expectedOutput.trim())});` : ''}
    }
  } catch (_e) {
    try {
      let _res = solution();
      if (_res !== undefined) {
        console.log("=== Execution Test Output ===");
        console.log("Return Value:", JSON.stringify(_res));
        ${expectedOutput ? `console.log("Expected Output:", ${JSON.stringify(expectedOutput.trim())});` : ''}
      }
    } catch (_err) {}
  }
}`;
      }
    } else if (langKey === 'python') {
      const hasSolutionFunc = /def\s+solution\s*\(/.test(code);
      const hasDirectPrint = /print\s*\(/.test(code);

      if (hasSolutionFunc && !hasDirectPrint) {
        let sampleArgString = "[1, 2, 3, 4, 5]";
        executableCode += `\n\n# --- Automated Test Harness ---
if 'solution' in globals() and callable(globals()['solution']):
    try:
        import json
        _arg = ${sampleArgString}
        _res = solution(_arg)
        if _res is not None:
            print("=== Execution Test Output ===")
            print("Sample Input:", json.dumps(_arg))
            print("Return Value:", json.dumps(_res))
            ${expectedOutput ? `print("Expected Output:", ${JSON.stringify(expectedOutput.trim())})` : ''}
    except Exception as _e:
        try:
            _res = solution()
            if _res is not None:
                print("=== Execution Test Output ===")
                print("Return Value:", json.dumps(_res))
                ${expectedOutput ? `print("Expected Output:", ${JSON.stringify(expectedOutput.trim())})` : ''}
        except Exception:
            pass`;
      }
    }

    const result = await sandbox.execute({
      language: langKey,
      code: executableCode,
      stdin
    });

    let executionRecord = null;
    if (sessionId && candidateId) {
      try {
        executionRecord = await prisma.codeExecution.create({
          data: {
            sessionId: parseInt(sessionId, 10),
            candidateId: parseInt(candidateId, 10),
            questionId: questionId ? parseInt(questionId, 10) : null,
            language: langKey,
            status: result.timedOut ? 'TIMEOUT' : (result.exitCode === 0 ? 'SUCCESS' : 'ERROR'),
            output: result.stdout || null,
            error: result.stderr || null,
            executionTime: result.executionTimeMs ? parseFloat(result.executionTimeMs) : null
          }
        });
      } catch (err) {
        console.warn('Could not store CodeExecution details:', err.message);
      }
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
