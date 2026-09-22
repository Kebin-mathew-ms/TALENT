import API from './api';

export const fetchAssessments = async ({ page = 1, limit = 10, search = '', status = '' }) => {
  const response = await API.get('/assessments', {
    params: { page, limit, search, status },
  });
  return response.data;
};

export const fetchAssessmentById = async (id) => {
  const response = await API.get(`/assessments/${id}`);
  return response.data;
};

export const createAssessment = async (assessmentData) => {
  const response = await API.post('/assessments', assessmentData);
  return response.data;
};

export const updateAssessment = async (id, assessmentData) => {
  const response = await API.put(`/assessments/${id}`, assessmentData);
  return response.data;
};

export const deleteAssessment = async (id) => {
  const response = await API.delete(`/assessments/${id}`);
  return response.data;
};

export const checkAssessmentAccess = async (id) => {
  const response = await API.get(`/assessments/${id}/access`);
  return response.data;
};
