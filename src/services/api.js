import axios from 'axios';

let refreshPromise = null;

const refreshAccessToken = (refreshToken) => {
  if (!refreshPromise) {
    refreshPromise = axios.post('/api/auth/refresh', { refreshToken })
      .then(({ data }) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  // Axios debe generar automáticamente el boundary de multipart/form-data.
  // Forzar application/json aquí provoca 415 al subir contratos.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
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
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = requestUrl.includes('/api/auth/');

    const clearSessionAndRedirect = () => {
      const isClientSession = !!localStorage.getItem('clientToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (isClientSession) {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientId');
        localStorage.removeItem('clientName');
        localStorage.removeItem('clientEmail');
        localStorage.removeItem('clientSessionExpiresAt');
        window.location.href = '/portal/login?reason=session-expired';
      } else {
        window.location.href = '/login?reason=session-expired';
      }
    };

    if (status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const clientToken = localStorage.getItem('clientToken');

      if (clientToken && !originalRequest.url?.includes('/api/auth/client-otp/')) {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientId');
        localStorage.removeItem('clientName');
        localStorage.removeItem('clientEmail');
        localStorage.removeItem('clientSessionExpiresAt');
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const returnTo = currentPath.startsWith('/portal/pago-qr')
          ? `&returnTo=${encodeURIComponent(currentPath)}`
          : '';
        window.location.href = `/portal/login${returnTo}`;
        return Promise.reject(error);
      }

      if (refreshToken) {
        try {
          const accessToken = await refreshAccessToken(refreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          clearSessionAndRedirect();
        }
      }
    }

    // Un 403 significa que la sesión sí fue autenticada, pero no tiene
    // permisos para esa acción (por ejemplo, un QR no autorizado). No se debe
    // cerrar la sesión ni enviar al usuario al login: la pantalla que hizo la
    // petición debe mostrar el motivo y permitir continuar trabajando.
    // Las sesiones inválidas/expiradas llegan como 401 y se resuelven arriba
    // intentando renovar el token antes de redirigir.
    if (status === 403 && !isAuthRequest) {
      const isExpenseWrite = /\/api\/expenses(?:\/|$)/i.test(requestUrl) &&
        ['post', 'put', 'patch', 'delete'].includes((originalRequest?.method || '').toLowerCase());
      error.userMessage = error.response?.data?.message || (isExpenseWrite
        ? 'Tu sesión sigue activa, pero necesitas volver a iniciar sesión para registrar o modificar gastos.'
        : 'No tienes autorización para realizar esta acción. Solicita permiso al administrador.');
    }

    return Promise.reject(error);
  }
);

export default api;
