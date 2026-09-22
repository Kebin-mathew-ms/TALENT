import API from './api';

export const fetchInterviewerStats = async () => {
  const response = await API.get('/dashboard/interviewer/stats');
  return response.data;
};

export const fetchCandidateAssessments = async () => {
  const response = await API.get('/dashboard/candidate/assessments');
  return response.data;
};
