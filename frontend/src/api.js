
import axios from 'axios';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Dashboard
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// Work Entries
export const getWorkEntries = (params = {}) => api.get('/api/work-entries/', { params });
export const createWorkEntry = (data) => api.post('/api/work-entries/', data);
export const updateWorkEntry = (id, data) => api.put(`/api/work-entries/${id}`, data);
export const deleteWorkEntry = (id) => api.delete(`/api/work-entries/${id}`);

// Employers
export const getEmployers = () => api.get('/api/employers/');
export const createEmployer = (data) => api.post('/api/employers/', data);
export const updateEmployer = (id, data) => api.put(`/api/employers/${id}`, data);
export const deleteEmployer = (id) => api.delete(`/api/employers/${id}`);

// Payments
export const getPayments = (params = {}) => api.get('/api/payments/', { params });
export const createPayment = (data) => api.post('/api/payments/', data);
export const deletePayment = (id) => api.delete(`/api/payments/${id}`);

// Advances
export const getAdvances = (params = {}) => api.get('/api/advances/', { params });
export const createAdvance = (data) => api.post('/api/advances/', data);
export const updateAdvance = (id, data) => api.put(`/api/advances/${id}`, data);
export const deleteAdvance = (id) => api.delete(`/api/advances/${id}`);

// Reports
export const getMonthlyReport = (year, month) => api.get('/api/reports/monthly', { params: { year, month } });
export const getWeeklyReport = (weekStart) => api.get('/api/reports/weekly', { params: { week_start: weekStart } });
export const getEmployerSummary = () => api.get('/api/reports/employer-summary');
export const getChartData = (year) => api.get('/api/reports/chart-data', { params: { year } });
export const exportCSV = (params = {}) => `${API_BASE}/api/reports/export-csv?${new URLSearchParams(params).toString()}`;

// AI
export const aiQuery = (question, language = 'en') => api.post('/api/ai/query', { question, language });
export const getAISuggestions = (language = 'en') => api.get('/api/ai/suggestions', { params: { language } });

// Demo
export const resetDemo = () => api.delete('/api/demo/reset');

export default api;
