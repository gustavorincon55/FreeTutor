import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


const api = axios.create({
  baseURL: API_URL + '/account',
  withCredentials: true,
});

//Gustavo: Trying to fix an issue with the deployed webapp. 
// function getCsrfFromCookie() {
//   const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
//   return match ? match[1] : null;
// }

// async function ensureCsrf() {
//   if (!getCsrfFromCookie()) {
//     await api.get('/api/csrf/');
//   }
//   return getCsrfFromCookie();
// }

let csrfToken = null;

async function ensureCsrf() {
  if (!csrfToken) {
    const res = await api.get('/api/csrf/');
    csrfToken = res.data.csrfToken;
  }
  return csrfToken;
}

export const resetCsrf = () => { csrfToken = null; };


api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = await ensureCsrf();
    if (token) config.headers['X-CSRFToken'] = token;
  }
  return config;
});

// //Gustavo: Trying to fix an issue with the deployed webapp. 
// // kept for compatibility — logout calls this, but cookie-based approach doesn't need it
// export const resetCsrf = () => {};

export default api;
