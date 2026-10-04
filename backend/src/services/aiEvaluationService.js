const prisma = require('../config/db');

class AIEvaluationService {
  /**
   * Evaluate a submission asynchronously using Groq AI
   * @param {number} submissionId
   */
  static async evaluateSubmission(submissionId) {
    let evaluationRecord = null;
    let submission = null;

    try {
      submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          session: { include: { assessment: true } },
          question: true,
          codeExecution: true
        }
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      evaluationRecord = await prisma.aIEvaluation.upsert({
        where: { submissionId },
        update: { status: 'PENDING' },
        create: {
          submissionId,
          candidateId: submission.candidateId,
          assessmentId: submission.assessmentId,
          status: 'PENDING'
        }
      });

      const apiKey = process.env.GROQ_API_KEY;
      const modelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

      if (!apiKey) {
        console.warn('GROQ_API_KEY not configured in backend/.env. Using intelligent automated evaluation fallback.');
        return await this.fallbackEvaluation(submission, evaluationRecord.id);
      }

      const prompt = `You are an expert technical interviewer and code evaluator.
Evaluate the candidate code submission for a coding problem.

CRITICAL INSTRUCTION FOR PROBLEM RELEVANCE:
- Target Problem Title: "${submission.question?.title || 'Coding Problem'}"
- Target Problem Description: "${submission.question?.description || 'N/A'}"
- Programming Language: ${submission.language}

Candidate Code Submitted:
\`\`\`${submission.language}
${submission.code}
\`\`\`

Execution Output:
Output: ${submission.codeExecution?.output || 'None'}
Error: ${submission.codeExecution?.error || 'None'}

EVALUATION CRITERIA:
1. FIRST, verify if the candidate code actually attempts and solves the TARGET PROBLEM ("${submission.question?.title}").
2. IF THE CANDIDATE SUBMITTED CODE FOR A COMPLETELY DIFFERENT PROBLEM (e.g. tree algorithm submitted for SQL/Parentheses problem, or copy-pasted wrong solution), YOU MUST SET "correctness" TO 0-10 AND "overallScore" TO 0-15, and state clearly in "feedback" that the code is completely irrelevant to the problem "${submission.question?.title}".
3. ONLY give high correctness (>70) if the logic actually solves "${submission.question?.title}".

Provide a structured evaluation in STRICT JSON format with no additional text or Markdown:
{
  "correctness": <number 0-100>,
  "codeQuality": <number 0-100>,
  "efficiency": <number 0-100>,
  "problemSolving": <number 0-100>,
  "overallScore": <number 0-100>,
  "feedback": "<detailed professional feedback summary>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'You evaluate code submissions and output ONLY valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      const rawContent = responseData.choices?.[0]?.message?.content || '{}';
      const cleanJson = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const correctness = Math.min(100, Math.max(0, parseInt(parsed.correctness || 50)));
      const codeQuality = Math.min(100, Math.max(0, parseInt(parsed.codeQuality || 50)));
      const efficiency = Math.min(100, Math.max(0, parseInt(parsed.efficiency || 50)));
      const problemSolving = Math.min(100, Math.max(0, parseInt(parsed.problemSolving || 50)));
      const overallScore = Math.min(100, Math.max(0, parseInt(parsed.overallScore || Math.round((correctness + codeQuality + efficiency + problemSolving) / 4))));

      const feedback = parsed.feedback || 'Code evaluated successfully.';
      const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

      const updatedEval = await prisma.aIEvaluation.update({
        where: { id: evaluationRecord.id },
        data: {
          correctness,
          codeQuality,
          efficiency,
          problemSolving,
          overallScore,
          feedback,
          suggestions: JSON.stringify(suggestions),
          status: 'COMPLETED'
        }
      });

      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'EVALUATED' }
      });

      const io = global.io;
      if (io && submission.session?.assessmentId) {
        io.to(`assessment_${submission.session.assessmentId}`).emit('evaluation:completed', {
          submissionId,
          sessionId: submission.sessionId,
          candidateId: submission.candidateId,
          evaluation: updatedEval
        });
      }

      return updatedEval;
    } catch (error) {
      console.error(`AI Evaluation failed for submission ${submissionId}:`, error);

      if (evaluationRecord?.id) {
        await prisma.aIEvaluation.update({
          where: { id: evaluationRecord.id },
          data: { status: 'FAILED' }
        }).catch(() => {});
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'FAILED' }
      }).catch(() => {});

      const io = global.io;
      if (io && submission?.session?.assessmentId) {
        io.to(`assessment_${submission.session.assessmentId}`).emit('evaluation:failed', {
          submissionId,
          sessionId: submission.sessionId,
          candidateId: submission.candidateId,
          error: error.message
        });
      }

      throw error;
    }
  }

  static async fallbackEvaluation(submission, evaluationId) {
    const qTitle = (submission.question?.title || '').toLowerCase();
    const qDesc = (submission.question?.description || '').toLowerCase();
    const expectedOutput = (submission.question?.expectedOutput || '').trim().toLowerCase();
    const code = submission.code || '';
    const codeText = code.toLowerCase();
    const output = (submission.codeExecution?.output || '').trim().toLowerCase();
    const error = (submission.codeExecution?.error || '').trim();
    const execTime = submission.codeExecution?.executionTime || 100;

    let isRelevant = true;

    // 1. Verify Problem Relevance
    if (codeText.includes('write your solution for:')) {
      const match = codeText.match(/write your solution for:\s*([^\n]+)/i);
      if (match && match[1]) {
        const commentTitle = match[1].trim().toLowerCase();
        if (qTitle && !qTitle.includes(commentTitle.slice(0, 8)) && !commentTitle.includes(qTitle.slice(0, 8))) {
          isRelevant = false;
        }
      }
    }

    if (qTitle.includes('sql') || qTitle.includes('salary') || qTitle.includes('department')) {
      if (codeText.includes('inorder') || codeText.includes('node.left') || codeText.includes('binary search tree')) {
        isRelevant = false;
      }
    } else if (qTitle.includes('parenthes') || qTitle.includes('string')) {
      if (codeText.includes('inorder') || codeText.includes('node.left') || codeText.includes('binary search tree')) {
        isRelevant = false;
      }
    }

    if (!isRelevant) {
      const updatedEval = await prisma.aIEvaluation.update({
        where: { id: evaluationId },
        data: {
          correctness: 10,
          codeQuality: 25,
          efficiency: 15,
          problemSolving: 10,
          overallScore: 15,
          feedback: `Irrelevant Solution: The code submitted does not solve the target problem "${submission.question?.title || 'Question'}".`,
          suggestions: JSON.stringify([`Ensure your code directly implements the solution for "${submission.question?.title || 'Question'}"`]),
          status: 'COMPLETED'
        }
      });
      await prisma.submission.update({ where: { id: submission.id }, data: { status: 'EVALUATED' } });
      return updatedEval;
    }

    // 2. Dynamic Correctness Score (0-100)
    let correctness = 60;
    if (error) {
      correctness = 25;
    } else if (output) {
      if (expectedOutput && output.includes(expectedOutput)) {
        correctness = 95;
      } else if (output.includes('return value:') || output.includes('output:')) {
        correctness = 88;
      } else {
        correctness = 75;
      }
    } else {
      correctness = 70;
    }

    // 3. Dynamic Code Quality Score (0-100)
    let codeQuality = 65;
    const lineCount = code.split('\n').length;
    if (lineCount >= 5 && lineCount <= 50) codeQuality += 10;
    if (/\/\*[\s\S]*?\*\/|\/\/.*/.test(code) || /#.*/.test(code)) codeQuality += 8;
    if (/\b(const|let|var|def|class|function)\b/.test(code)) codeQuality += 7;
    if (/[\t ]{2,}/.test(code)) codeQuality += 5;
    if (code.length < 30) codeQuality -= 20;
    codeQuality = Math.min(98, Math.max(20, codeQuality));

    // 4. Dynamic Efficiency Score (0-100)
    let efficiency = 85;
    const nestedLoops = (code.match(/\b(for|while)\b[\s\S]*?\b(for|while)\b/g) || []).length;
    if (nestedLoops >= 2) efficiency -= 25;
    else if (nestedLoops === 1) efficiency -= 10;
    if (execTime > 1000) efficiency -= 20;
    else if (execTime < 100) efficiency += 5;
    efficiency = Math.min(98, Math.max(30, efficiency));

    // 5. Dynamic Problem Solving Score (0-100)
    let problemSolving = 70;
    if (/\b(map|filter|reduce|set|stack|queue|recursion|head\.next|prev|current)\b/i.test(code)) problemSolving += 15;
    if (/\b(if|else|switch)\b/.test(code)) problemSolving += 10;
    if (error) problemSolving -= 30;
    problemSolving = Math.min(98, Math.max(15, problemSolving));

    // Overall Score Calculation (Weighted)
    const overallScore = Math.round((correctness * 0.4) + (codeQuality * 0.2) + (efficiency * 0.2) + (problemSolving * 0.2));

    let feedback = '';
    if (error) {
      feedback = `Runtime Error Encountered: ${error.split('\n')[0]}`;
    } else if (correctness >= 90) {
      feedback = `Excellent solution! Code executed cleanly with optimal output for "${submission.question?.title || 'Problem'}".`;
    } else if (correctness >= 75) {
      feedback = `Good implementation for "${submission.question?.title || 'Problem'}". Code executed cleanly without runtime errors.`;
    } else {
      feedback = `Basic implementation provided. Review algorithmic logic for "${submission.question?.title || 'Problem'}".`;
    }

    const suggestions = [];
    if (nestedLoops >= 1) suggestions.push('Optimize loop complexity to improve performance.');
    if (!/\/\//.test(code) && !/#/.test(code)) suggestions.push('Add inline comments explaining core algorithmic steps.');
    if (correctness < 85) suggestions.push('Test solution against edge cases (empty inputs, single element arrays).');
    if (suggestions.length === 0) suggestions.push('Code structure is clean and well formatted.');

    const updatedEval = await prisma.aIEvaluation.update({
      where: { id: evaluationId },
      data: {
        correctness,
        codeQuality,
        efficiency,
        problemSolving,
        overallScore,
        feedback,
        suggestions: JSON.stringify(suggestions),
        status: 'COMPLETED'
      }
    });

    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: 'EVALUATED' }
    });

    const io = global.io;
    if (io && submission.session?.assessmentId) {
      io.to(`assessment_${submission.session.assessmentId}`).emit('evaluation:completed', {
        submissionId: submission.id,
        sessionId: submission.sessionId,
        candidateId: submission.candidateId,
        evaluation: updatedEval
      });
    }

    return updatedEval;
  }
}

module.exports = { AIEvaluationService };
