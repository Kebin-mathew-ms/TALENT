import api from './api';

export const submitCode = async ({ sessionId, questionId, code, language, executionResult }) => {
  const response = await api.post('/submissions', {
    sessionId,
    questionId,
    code,
    language,
    executionResult
  });
  return response.data;
};

export const getSessionSubmissions = async (sessionId) => {
  const response = await api.get(`/submissions/session/${sessionId}`);
  return response.data;
};

export const getAssessmentSubmissions = async (assessmentId) => {
  const response = await api.get(`/submissions/assessment/${assessmentId}`);
  return response.data;
};

export const retryAIEvaluation = async (submissionId) => {
  const response = await api.post(`/submissions/evaluations/${submissionId}/retry`);
  return response.data;
};
