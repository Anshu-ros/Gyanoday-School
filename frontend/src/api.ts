import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('admin_token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('admin_token');
    delete api.defaults.headers.common.Authorization;
  }
};

const ensureCsrfToken = async () => {
  const stored = localStorage.getItem('csrf_token');
  if (stored) return stored;
  const response = await api.get('/csrf-token');
  const token = response.data.csrfToken;
  localStorage.setItem('csrf_token', token);
  return token;
};

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = localStorage.getItem('csrf_token');
  if (csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

export const fetchTeachers = () => api.get('/teachers');
export const askSchoolAssistant = async (message: string, previousQuestion?: string) => {
  await ensureCsrfToken();
  return api.post('/chat', { message, previous_question: previousQuestion });
};
export const submitInquiry = async (payload: Record<string, unknown>) => {
  await ensureCsrfToken();
  return api.post('/inquiries', payload);
};
export const submitAdmission = async (payload: Record<string, unknown>) => {
  await ensureCsrfToken();
  return api.post('/admissions', payload);
};
export const loginAdmin = async (username: string, password: string) => {
  await ensureCsrfToken();
  const response = await api.post('/admin/login', { username, password });
  setAuthToken(response.data.access_token);
  return response.data;
};
export const getAdminMe = () => api.get('/admin/me');
export const listInquiriesAdmin = () => api.get('/admin/inquiries');
export const listAdmissionsAdmin = () => api.get('/admin/admissions');
export const updateInquiryStatus = (id: number, status: string) => api.patch(`/admin/inquiries/${id}`, { status });
export const updateAdmissionStatus = (id: number, status: string) => api.patch(`/admin/admissions/${id}`, { status });
export const logoutAdmin = () => setAuthToken(null);

export default api;
