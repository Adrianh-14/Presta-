import axios from 'axios';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = config.useClientToken
    ? localStorage.getItem('clientToken')
    : localStorage.getItem('accessToken') || localStorage.getItem('clientToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const clientToken = localStorage.getItem('clientToken');

      if (clientToken && !originalRequest.url?.includes('/api/auth/client-otp/')) {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientId');
        localStorage.removeItem('clientName');
        localStorage.removeItem('clientEmail');
        localStorage.removeItem('clientSessionExpiresAt');
        window.location.href = '/portal/login';
        return Promise.reject(error);
      }

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
