import api from './api';

export const logProctoringIncident = async ({ sessionId, eventType, details }) => {
  const response = await api.post('/proctoring/incidents', {
    sessionId,
    eventType,
    details
  });
  return response.data;
};

export const getSessionProctoringIncidents = async (sessionId) => {
  const response = await api.get(`/proctoring/incidents/session/${sessionId}`);
  return response.data;
};

export const getAssessmentProctoringIncidents = async (assessmentId) => {
  const response = await api.get(`/proctoring/incidents/assessment/${assessmentId}`);
  return response.data;
};
