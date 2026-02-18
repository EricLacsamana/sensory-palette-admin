import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../redux/store';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337',
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const isAuthRoute = config.url?.includes('/auth/local');

        // 🔥 THE ULTIMATE SHIELD:
        // If it's a login attempt, we strip EVERYTHING. No exceptions.
        if (isAuthRoute) {
            delete config.headers.Authorization;
            return config;
        }

        // For all other routes, grab the token from Redux OR LocalStorage directly
        const state = store.getState();
        const token = state.auth?.token || localStorage.getItem('jwt');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

export default api;
