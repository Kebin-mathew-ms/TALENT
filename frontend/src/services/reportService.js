import api from './api';

export const fetchReports = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await api.get(`/reports${queryParams ? `?${queryParams}` : ''}`);
  return response.data;
};

export const fetchReportById = async (id) => {
  const response = await api.get(`/reports/${id}`);
  return response.data;
};

export const generateReport = async (sessionId) => {
  const response = await api.post(`/reports/generate/${sessionId}`);
  return response.data;
};

export const downloadReportPDF = async (id, fileName = 'Report.pdf') => {
  const response = await api.get(`/reports/${id}/pdf`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadBulkReportsZIP = async (assessmentId) => {
  const response = await api.get(`/reports/assessment/${assessmentId}/download-all`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Assessment_${assessmentId}_Reports.zip`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
