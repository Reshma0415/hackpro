import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token and handle multipart headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('candidate_trust_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach session identifier
    let sessionId = localStorage.getItem('candidate_trust_session_id');
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem('candidate_trust_session_id', sessionId);
    }
    config.headers['x-session-id'] = sessionId;

    // If data is FormData, remove Content-Type so browser sets multipart boundary automatically
    if (config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('content-type');
        config.headers.delete('Content-Type');
      }
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
export { API_BASE_URL };
