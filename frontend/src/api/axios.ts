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

  return api;
};

export const authApi = createApiClient(import.meta.env.VITE_AUTH_URL);
export const postApi = createApiClient(import.meta.env.VITE_POST_URL);
export const commentApi = createApiClient(import.meta.env.VITE_COMMENT_URL);
export const likeApi = createApiClient(import.meta.env.VITE_LIKE_URL);