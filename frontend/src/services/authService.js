import API from './api';

export const registerCandidate = async (candidateData) => {
  const response = await API.post('/auth/register', candidateData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

export const getMe = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  try {
    await API.post('/auth/logout');
  } catch (error) {
    console.error('Logout error acknowledgement:', error);
  } finally {
    localStorage.removeItem('talent_flow_token');
    localStorage.removeItem('talent_flow_user');
  }
};
