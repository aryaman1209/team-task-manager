const rawApiBase = import.meta.env.VITE_API_URL?.trim();
const API_BASE = rawApiBase ? rawApiBase.replace(/\/+$/, '') : '';
const BASE = `${API_BASE}/api`;

const getToken = () => localStorage.getItem('token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
  return data;
};

export const api = {
  get: (path) => fetch(`${BASE}${path}`, { headers: headers() }).then(handle),

  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handle),

  put: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handle),

  del: (path) =>
    fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() }).then(handle),
};

// Auth
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  users: () => api.get('/auth/users'),
};

// Projects
export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.del(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.del(`/projects/${id}/members/${userId}`),
};

// Tasks
export const tasksApi = {
  mine: () => api.get('/tasks/mine'),
  byProject: (projectId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/tasks/project/${projectId}${q ? '?' + q : ''}`);
  },
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.del(`/tasks/${id}`),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};
