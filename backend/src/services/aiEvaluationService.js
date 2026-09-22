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
      const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

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
    const codeText = (submission.code || '').toLowerCase();

    // Verify if candidate code is relevant to the question
    let isRelevant = true;

    // 1. If code contains explicit comment header for a DIFFERENT problem title
    if (codeText.includes('write your solution for:')) {
      const match = codeText.match(/write your solution for:\s*([^\n]+)/i);
      if (match && match[1]) {
        const commentTitle = match[1].trim().toLowerCase();
        if (qTitle && !qTitle.includes(commentTitle.slice(0, 10)) && !commentTitle.includes(qTitle.slice(0, 10))) {
          isRelevant = false;
        }
      }
    }

    // 2. Category / Domain mismatch (e.g., BST tree code for SQL or String question)
    if (qTitle.includes('sql') || qTitle.includes('salary') || qTitle.includes('department')) {
      if (codeText.includes('inorder') || codeText.includes('node.left') || codeText.includes('binary search tree')) {
        isRelevant = false;
      }
    } else if (qTitle.includes('parenthes') || qTitle.includes('string')) {
      if (codeText.includes('inorder') || codeText.includes('node.left') || codeText.includes('binary search tree')) {
        isRelevant = false;
      }
    }

    const hasError = !!submission.codeExecution?.error;
    const isSuccess = isRelevant && !hasError;

    const correctness = isRelevant ? (isSuccess ? 85 : 30) : 10;
    const codeQuality = isRelevant ? (submission.code.length > 50 ? 80 : 40) : 20;
    const efficiency = isRelevant ? 85 : 10;
    const problemSolving = isRelevant ? (isSuccess ? 85 : 30) : 10;
    const overallScore = Math.round((correctness + codeQuality + efficiency + problemSolving) / 4);

    const feedback = !isRelevant
      ? `Irrelevant Solution: Code submitted does not solve the target problem "${submission.question?.title || 'Question'}".`
      : (isSuccess ? 'Code executed cleanly with 0 exit code.' : `Execution reported errors: ${submission.codeExecution?.error || 'Runtime issue'}.`);

    const suggestions = isRelevant
      ? ['Add unit test edge cases', 'Optimize memory & variable usage']
      : [`Ensure your solution addresses "${submission.question?.title || 'the question'}" specifications.`];

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
