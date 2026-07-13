import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


const api = axios.create({
  baseURL: API_URL + '/account',
  withCredentials: true,
});

function getCsrfFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

async function ensureCsrf() {
  if (!getCsrfFromCookie()) {
    await api.get('/api/csrf/');
  }
  return getCsrfFromCookie();
}

api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = await ensureCsrf();
    if (token) config.headers['X-CSRFToken'] = token;
  }
  return config;
});

// kept for compatibility — logout calls this, but cookie-based approach doesn't need it
export const resetCsrf = () => {};

export default api;
