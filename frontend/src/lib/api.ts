import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medisakhi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medisakhi_token');
      localStorage.removeItem('medisakhi_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Medicines
export const medicinesAPI = {
  list: () => api.get('/medicines/'),
  create: (data: any) => api.post('/medicines/', data),
  get: (id: string) => api.get(`/medicines/${id}`),
  update: (id: string, data: any) => api.put(`/medicines/${id}`, data),
  discontinue: (id: string) => api.post(`/medicines/${id}/discontinue`),
  identify: (data: any) => api.post('/medicines/identify', data),
  getSchedule: (id: string) => api.get(`/medicines/${id}/schedule`),
  setSchedule: (id: string, reminder_times: string[], timezone?: string) =>
    api.post(`/medicines/${id}/schedule`, { reminder_times, timezone }),
  refill: (id: string, refill_quantity: number = 30) =>
    api.post(`/medicines/${id}/refill`, { refill_quantity }),
};

// Schedules
export const schedulesAPI = {
  create: (data: any) => api.post('/schedules/', data),
  list: () => api.get('/schedules/'),
  update: (id: string, data: any) => api.put(`/schedules/${id}`, data),
  upcoming: () => api.get('/schedules/upcoming'),
};

// Reminders
export const remindersAPI = {
  list: () => api.get('/reminders/'),
  upcoming: (hours_ahead: number = 24) => api.get('/reminders/upcoming', { params: { hours_ahead } }),
  get: (id: string) => api.get(`/reminders/${id}`),
  getActiveAlarm: (reminder_id?: string) => api.get('/reminders/active-alarm', { params: { reminder_id } }),
  confirm: (id: string, notes?: string) => api.post(`/reminders/${id}/confirm`, { method: 'app', notes }),
  missed: (id: string, reason?: string) => api.post(`/reminders/${id}/missed`, { reason: reason || 'Not taken' }),
  requestHelp: (id: string, notes?: string) => api.post(`/reminders/${id}/request-help`, { notes }),
  snooze: (id: string, minutes: number = 15) => api.post(`/reminders/${id}/snooze`, { minutes }),
  escalateCaretaker: (id: string) => api.post(`/reminders/${id}/escalate-caretaker`),
};

// Webhooks (Simulation for keypad mobile)
export const webhooksAPI = {
  simulateKeypadSms: (from_number: string, body: string) =>
    api.post('/webhooks/sms/incoming', { From: from_number, Body: body }),
};

// Caregivers
export const caregiversAPI = {
  requestLink: (data: any) => api.post('/caregivers/request', data),
  approve: (id: string) => api.post(`/caregivers/${id}/approve`),
  revoke: (id: string) => api.post(`/caregivers/${id}/revoke`),
  patients: () => api.get('/caregivers/patients'),
  alerts: () => api.get('/caregivers/alerts'),
  acknowledge: (id: string) => api.post(`/caregivers/alerts/${id}/acknowledge`),
  resolve: (id: string, notes: string) => api.post(`/caregivers/alerts/${id}/resolve`, { notes }),
  requests: () => api.get('/caregivers/assistance-requests'),
};

// Prescriptions
export const prescriptionsAPI = {
  upload: (file: File, medicine_id?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (medicine_id) form.append('medicine_id', medicine_id);
    return api.post('/prescriptions/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  extract: (id: string) => api.get(`/prescriptions/${id}/extract`),
  verify: (id: string, data: any) => api.post(`/prescriptions/${id}/verify`, data),
  list: () => api.get('/prescriptions/'),
};

// Chatbot
export const chatbotAPI = {
  sendMessage: (message: string, language: string, session_id?: string) =>
    api.post('/chatbot/message', { message, language, session_id }),
  history: () => api.get('/chatbot/history'),
};

// Reports
export const reportsAPI = {
  summary: (start_date?: string, end_date?: string) =>
    api.get('/reports/summary', { params: { start_date, end_date } }),
  adherence: (start_date?: string, end_date?: string) =>
    api.get('/reports/adherence', { params: { start_date, end_date } }),
  exportCsv: () => api.get('/reports/export/csv', { responseType: 'blob' }),
};

// Patients
export const patientsAPI = {
  profile: () => api.get('/patients/profile'),
  updateProfile: (data: any) => api.put('/patients/profile', data),
  accessibility: () => api.get('/patients/accessibility'),
  updateAccessibility: (data: any) => api.put('/patients/accessibility', data),
};

// Notifications
export const notificationsAPI = {
  test: (channel: string) => api.post('/notifications/test', { channel }),
  history: () => api.get('/notifications/history'),
};

// Admin
export const adminAPI = {
  users: () => api.get('/admin/users'),
  updateRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  settings: () => api.get('/admin/system-settings'),
  updateSettings: (data: any) => api.put('/admin/system-settings', data),
  auditLogs: () => api.get('/admin/audit-logs'),
  health: () => api.get('/admin/system-health'),
};

export default api;
