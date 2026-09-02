import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
};

// ── Applications ──
export const applicationsAPI = {
  list: () => api.get('/api/applications/'),
  create: (data) => api.post('/api/applications/', data),
  get: (id) => api.get(`/api/applications/${id}`),
  delete: (id) => api.delete(`/api/applications/${id}`),
  updateJob: (id, jobParsed) => api.put(`/api/applications/${id}/job`, { job_parsed: jobParsed }),
  uploadResume: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/applications/${id}/resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyze: (id) => api.post(`/api/applications/${id}/analyze`),
  updateRecommendation: (appId, recIndex, status) =>
    api.patch(`/api/applications/${appId}/recommendations/${recIndex}`, { status }),
};

// ── Job Parsing (preview) ──
export const jobsAPI = {
  parseText: (text) => api.post('/api/jobs/parse', { text }),
  parseURL: (url) => api.post('/api/jobs/parse-url', { url }),
};

export default api;
