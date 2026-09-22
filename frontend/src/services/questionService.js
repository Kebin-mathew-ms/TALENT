import API from './api';

export const fetchQuestions = async ({
  page = 1,
  limit = 10,
  search = '',
  category = '',
  difficulty = '',
  language = '',
}) => {
  const response = await API.get('/questions', {
    params: { page, limit, search, category, difficulty, language },
  });
  return response.data;
};

export const fetchQuestionById = async (id) => {
  const response = await API.get(`/questions/${id}`);
  return response.data;
};

export const createQuestion = async (questionData) => {
  const response = await API.post('/questions', questionData);
  return response.data;
};

export const updateQuestion = async (id, questionData) => {
  const response = await API.put(`/questions/${id}`, questionData);
  return response.data;
};

export const deleteQuestion = async (id) => {
  const response = await API.delete(`/questions/${id}`);
  return response.data;
};
