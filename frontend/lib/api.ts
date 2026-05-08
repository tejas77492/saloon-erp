import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('salon_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // Don't auto-redirect if on public pages
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/my-bookings')) {
        localStorage.removeItem('salon_token');
        localStorage.removeItem('salon_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role?: string }) => api.post('/auth/register', data),
  me:       () => api.get('/auth/me'),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll:   (activeOnly?: boolean) => api.get(`/services${activeOnly ? '?active=true' : ''}`),
  getOne:   (id: string) => api.get(`/services/${id}`),
  create:   (data: object) => api.post('/services', data),
  update:   (id: string, data: object) => api.put(`/services/${id}`, data),
  delete:   (id: string) => api.delete(`/services/${id}`),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  create:   (data: object) => api.post('/bookings', data),
  getMy:    () => api.get('/bookings/my'),
  getAll:   (params?: object) => api.get('/bookings', { params }),
  getOne:   (id: string) => api.get(`/bookings/${id}`),
  update:   (id: string, data: object) => api.put(`/bookings/${id}`, data),
  delete:   (id: string) => api.delete(`/bookings/${id}`),
  getStats: () => api.get('/bookings/stats'),
};

// ─── Availability ─────────────────────────────────────────────────────────────
export const availabilityApi = {
  get: (date: string, duration: number) =>
    api.get(`/availability?date=${date}&duration=${duration}`),
};

// ─── Blocked Time ─────────────────────────────────────────────────────────────
export const blockedTimeApi = {
  getAll:  () => api.get('/blocked-time'),
  create:  (data: object) => api.post('/blocked-time', data),
  delete:  (id: string) => api.delete(`/blocked-time/${id}`),
};

// ─── Working Hours ─────────────────────────────────────────────────────────────
export const workingHoursApi = {
  getAll:  () => api.get('/working-hours'),
  update:  (data: object[]) => api.put('/working-hours', data),
};

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:    () => api.get('/notifications'),
  markRead:  (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete:    (id: string) => api.delete(`/notifications/${id}`),
};

export default api;
