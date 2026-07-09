import axios from 'axios';

const api = axios.create({
  baseURL: '', // Uses Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecotrade_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / unauthenticated actions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ecotrade_admin_token');
      localStorage.removeItem('ecotrade_admin_user');
      // If we are not on the login page already, redirect
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  uploadProfilePhoto: async (formData) => {
    const response = await api.put('/api/auth/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const adminAPI = {
  // Users management
  getUsers: async (role = '') => {
    const response = await api.get(`/api/admin/users${role ? `?role=${role}` : ''}`);
    return response.data;
  },
  updateUserProfile: async (id, data) => {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
  },
  toggleUserActive: async (id) => {
    const response = await api.put(`/api/admin/users/${id}/toggle`);
    return response.data;
  },
  changeUserRole: async (id, role) => {
    const response = await api.put(`/api/admin/users/${id}/role`, { role });
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  // Collector Profiles
  getCollectorProfiles: async () => {
    const response = await api.get('/api/admin/collectors/profiles');
    return response.data;
  },
  createCollectorProfile: async (data) => {
    const response = await api.post('/api/admin/collectors/profiles', data);
    return response.data;
  },
  updateCollectorProfile: async (id, data) => {
    const response = await api.put(`/api/admin/collectors/profiles/${id}`, data);
    return response.data;
  },

  // Reports
  getReports: async () => {
    const response = await api.get('/api/admin/reports');
    return response.data;
  },
  generateReport: async (data) => {
    const response = await api.post('/api/admin/reports', data);
    return response.data;
  },
  seedProducts: async () => {
    const response = await api.post('/api/admin/seed');
    return response.data;
  },

  // Scrap Categories
  getScrapCategories: async () => {
    const response = await api.get('/api/admin/scrap-categories');
    return response.data;
  },
  createScrapCategory: async (data) => {
    const response = await api.post('/api/admin/scrap-categories', data);
    return response.data;
  },
  updateScrapCategory: async (id, data) => {
    const response = await api.put(`/api/admin/scrap-categories/${id}`, data);
    return response.data;
  },
  deleteScrapCategory: async (id) => {
    const response = await api.delete(`/api/admin/scrap-categories/${id}`);
    return response.data;
  },

  // Scheduled Reports
  getScheduledReports: async () => {
    const response = await api.get('/api/admin/scheduled-reports');
    return response.data;
  },
  getScheduledReportById: async (id) => {
    const response = await api.get(`/api/admin/scheduled-reports/${id}`);
    return response.data;
  },
  createScheduledReport: async (data) => {
    const response = await api.post('/api/admin/scheduled-reports', data);
    return response.data;
  },
  updateScheduledReport: async (id, data) => {
    const response = await api.put(`/api/admin/scheduled-reports/${id}`, data);
    return response.data;
  },
  deleteScheduledReport: async (id) => {
    const response = await api.delete(`/api/admin/scheduled-reports/${id}`);
    return response.data;
  },
  executeScheduledReportNow: async (id) => {
    const response = await api.post(`/api/admin/scheduled-reports/${id}/execute`);
    return response.data;
  },
  getSchedulerStatus: async () => {
    const response = await api.get('/api/admin/scheduler/status');
    return response.data;
  },
};

export const scrapAPI = {
  getRequests: async (status = '') => {
    const response = await api.get(`/api/scrap${status ? `?status=${status}` : ''}`);
    return response.data.scraps || response.data;
  },
  assignCollector: async (id, collectorId) => {
    const response = await api.put(`/api/scrap/${id}/status`, { status: 'assigned', collector_id: collectorId });
    return response.data;
  },
  updateStatus: async (id, status, _pointsAwarded = 0, quantityActual = null) => {
    const response = await api.put(`/api/scrap/${id}/status`, { status, quantity_actual: quantityActual, points_awarded: _pointsAwarded });
    return response.data;
  },
};

export const productAPI = {
  getProducts: async () => {
    const response = await api.get('/api/products');
    return response.data.products || response.data;
  },
  createProduct: async (formData) => {
    // Form data for file uploading
    const response = await api.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updateProduct: async (id, formData) => {
    const response = await api.put(`/api/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },
};

export const orderAPI = {
  getOrders: async (status = '') => {
    const response = await api.get(`/api/orders${status ? `?status=${status}` : ''}`);
    return response.data;
  },
  updateStatus: async (id, orderStatus, paymentStatus) => {
    const response = await api.put(`/api/orders/${id}/status`, { orderStatus, paymentStatus });
    return response.data;
  },
  assignCollector: async (id, collectorId) => {
    const response = await api.put(`/api/orders/${id}/assign-collector`, { collectorId });
    return response.data;
  },
  placeOrder: async (payload) => {
    const response = await api.post('/api/orders', payload);
    return response.data;
  },
  // eSewa Payment Integration
  initiateEsewaPayment: async (payload) => {
    const response = await api.post('/api/orders/esewa/initiate', payload);
    return response.data;
  },
  verifyEsewaPayment: async (payload) => {
    const response = await api.post('/api/orders/esewa/verify', payload);
    return response.data;
  },
  handleEsewaFailure: async (payload) => {
    const response = await api.post('/api/orders/esewa/failure', payload);
    return response.data;
  },
  // Map & Location Features
  getScrapMapMarkers: async (status = null) => {
    const url = status ? `/api/scrap/map/markers?status=${status}` : '/api/scrap/map/markers';
    const response = await api.get(url);
    return response.data;
  },
  getNearbyScrapRequests: async (lat, lng, radius = 5) => {
    const response = await api.get(`/api/scrap/map/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data;
  },
  getScrapLocationData: async (scrapId) => {
    const response = await api.get(`/api/scrap/${scrapId}/location`);
    return response.data;
  },
  getScrapRouteInfo: async (scrapId) => {
    const response = await api.get(`/api/scrap/${scrapId}/route`);
    return response.data;
  },
  updateCollectorLocation: async (lat, lng) => {
    const response = await api.post('/api/scrap/collector/location', { lat, lng });
    return response.data;
  },
};

export const complaintAPI = {
  getComplaints: async () => {
    const response = await api.get('/api/complaints');
    return response.data;
  },
  resolveComplaint: async (id, resolution) => {
    const response = await api.put(`/api/complaints/${id}/resolve`, { response: resolution });
    return response.data;
  },
};

export const feedbackAPI = {
  getFeedback: async () => {
    const response = await api.get('/api/feedback');
    return response.data;
  },
  replyFeedback: async (id, replyMessage) => {
    const response = await api.post(`/api/feedback/${id}/reply`, { replyMessage });
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/dashboard/admin');
    return response.data;
  },
};

export default api;
