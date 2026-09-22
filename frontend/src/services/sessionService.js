import API from './api';

export const startAssessmentSession = async (assessmentId) => {
  const response = await API.post(`/assessments/${assessmentId}/start`);
  return response.data;
};

export const endAssessmentSession = async (assessmentId) => {
  const response = await API.post(`/assessments/${assessmentId}/end`);
  return response.data;
};

export const getOrCreateCandidateSession = async (assessmentId) => {
  const response = await API.post(`/assessments/${assessmentId}/session`);
  return response.data;
};

export const fetchSessionDetails = async (sessionId) => {
  const response = await API.get(`/sessions/${sessionId}`);
  return response.data;
};

export const saveSessionCheckpoint = async (sessionId, stateData) => {
  const response = await API.patch(`/sessions/${sessionId}/state`, stateData);
  return response.data;
};

export const completeAssessmentSession = async (sessionId, finalCodeData) => {
  const response = await API.post(`/sessions/${sessionId}/complete`, finalCodeData);
  return response.data;
};
