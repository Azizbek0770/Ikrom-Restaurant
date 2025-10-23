import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  telegram: (userData) => api.post('/auth/telegram', { ...userData, role: 'delivery' }),
  getCurrentUser: () => api.get('/auth/me'),
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data)
};

export const deliveriesAPI = {
  getAvailable: () => api.get('/deliveries/available'),
  getMy: (params) => api.get('/deliveries/my-deliveries', { params }),
  accept: (id) => api.post(`/deliveries/${id}/accept`),
  updateLocation: (id, location) => api.patch(`/deliveries/${id}/location`, location),
  markPickedUp: (id) => api.patch(`/deliveries/${id}/picked-up`),
  complete: (id) => api.patch(`/deliveries/${id}/complete`)
};

export const ordersAPI = {
  getOne: (id) => api.get(`/orders/${id}`)
};

// Public helpers
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params })
};

export const bannersAPI = {
  getAll: () => api.get('/banners')
};

export default api;