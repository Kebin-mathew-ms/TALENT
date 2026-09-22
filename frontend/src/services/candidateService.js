import API from './api';

export const fetchCandidates = async ({ page = 1, limit = 10, search = '' }) => {
  const response = await API.get('/candidates', {
    params: { page, limit, search },
  });
  return response.data;
};

export const fetchCandidateById = async (id) => {
  const response = await API.get(`/candidates/${id}`);
  return response.data;
};

export const createCandidate = async (candidateData) => {
  const response = await API.post('/candidates', candidateData);
  return response.data;
};

export const updateCandidate = async (id, candidateData) => {
  const response = await API.put(`/candidates/${id}`, candidateData);
  return response.data;
};

export const deleteCandidate = async (id) => {
  const response = await API.delete(`/candidates/${id}`);
  return response.data;
};
