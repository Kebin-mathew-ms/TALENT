const { CodeExecutionService } = require('../services/codeExecution/codeExecutionService');

const runCode = async (req, res) => {
  try {
    const { sessionId, questionId, language, code, stdin } = req.body;
    const candidateId = req.user?.role === 'CANDIDATE' ? req.user.id : (req.body.candidateId || null);

    if (!code) {
      return res.status(400).json({ error: 'Code content is required' });
    }

    const result = await CodeExecutionService.executeCode({
      sessionId,
      questionId,
      language: language || 'javascript',
      code,
      stdin: stdin || '',
      candidateId
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Code execution failed'
    });
  }
};

module.exports = { runCode };
