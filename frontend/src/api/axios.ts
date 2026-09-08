import axios from 'axios';

const createApiClient = (baseURL: string) => {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // A 401 on a request that carried our own token means that token is no
  // longer valid (expired, or the account was removed) -- previously
  // nothing anywhere handled this, so an expired-session user just saw
  // silently-failing requests indefinitely with no prompt to log back in.
  // Only fires for requests that actually sent a token, so a wrong-password
  // 401 from /login itself doesn't trigger a spurious "session expired".
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const sentAuthHeader = Boolean(error.config?.headers?.Authorization);
      if (error.response?.status === 401 && sentAuthHeader) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export const authApi = createApiClient(import.meta.env.VITE_AUTH_URL);
export const postApi = createApiClient(import.meta.env.VITE_POST_URL);
export const commentApi = createApiClient(import.meta.env.VITE_COMMENT_URL);
export const likeApi = createApiClient(import.meta.env.VITE_LIKE_URL);
export const aiApi = createApiClient(import.meta.env.VITE_AI_URL);
export const analyticsApi = createApiClient(import.meta.env.VITE_ANALYTICS_URL);
export const saveApi = createApiClient(import.meta.env.VITE_SAVE_URL);
export const repostApi = createApiClient(import.meta.env.VITE_REPOST_URL);
