import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5188/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'tekflow_token';

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
