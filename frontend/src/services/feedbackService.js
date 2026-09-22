import api from './api';

export const saveFeedback = async (data) => {
  const response = await api.post('/feedback', data);
  return response.data;
};

export const fetchFeedback = async (candidateId, assessmentId) => {
  const response = await api.get(`/feedback/${candidateId}/${assessmentId}`);
  return response.data;
};
