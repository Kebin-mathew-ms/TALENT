import api from './api';

export const runCode = async ({ sessionId, questionId, language, code, stdin }) => {
  const response = await api.post('/code/execute', {
    sessionId,
    questionId,
    language,
    code,
    stdin
  });
  return response.data;
};
