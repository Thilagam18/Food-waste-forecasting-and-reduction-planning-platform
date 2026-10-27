import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to inject JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fw_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('fw_access_token');
      localStorage.removeItem('fw_user_data');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const dashboardService = {
  getStats: (days = 30) => api.get(`/dashboard/stats?days=${days}`),
  getCharts: (days = 30) => api.get(`/dashboard/charts?days=${days}`),
};

export const foodItemService = {
  list: (params?: { category?: string; search?: string; is_active?: boolean }) =>
    api.get('/food-items', { params }),
  create: (data: any) => api.post('/food-items', data),
  update: (id: number, data: any) => api.put(`/food-items/${id}`, data),
  delete: (id: number) => api.delete(`/food-items/${id}`),
};

export const foodLogService = {
  list: (params?: any) => api.get('/food-logs', { params }),
  create: (data: any) => api.post('/food-logs', data),
  update: (id: number, data: any) => api.put(`/food-logs/${id}`, data),
  delete: (id: number) => api.delete(`/food-logs/${id}`),
};

export const forecastingService = {
  getLatest: (foodItemId?: number) =>
    api.get('/forecasting/latest', { params: foodItemId ? { food_item_id: foodItemId } : {} }),
  generate: (data: { food_item_id?: number; horizon_days?: number; buffer_pct?: number }) =>
    api.post('/forecasting/generate', data),
};

export const recommendationService = {
  list: (params?: { status?: string; priority?: string; category?: string }) =>
    api.get('/recommendations', { params }),
  refresh: () => api.post('/recommendations/refresh'),
  updateStatus: (id: number, status: string, actionNotes?: string) =>
    api.patch(`/recommendations/${id}/status`, { status, action_notes: actionNotes }),
  recordIntervention: (id: number, data: { action_taken: string; food_saved_kg?: number; cost_saved?: number; staff_notes?: string }) =>
    api.post(`/recommendations/${id}/intervene`, data),
};

export const alertService = {
  list: (params?: { is_resolved?: boolean }) => api.get('/alerts', { params }),
  resolve: (id: number) => api.patch(`/alerts/${id}/resolve`),
};

export const reportService = {
  getSummary: (params?: { start_date?: string; end_date?: string; category?: string; meal_period?: string }) =>
    api.get('/reports/summary', { params }),
  getExportUrl: (startDate?: string, endDate?: string) => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return `${base}/reports/export-csv?${params.toString()}`;
  },
};

export const impactService = {
  getSummary: () => api.get('/impact/summary'),
};

export const demoService = {
  load: () => api.post('/demo/load'),
  clear: () => api.post('/demo/clear'),
};

export default api;
