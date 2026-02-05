import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { loginFailure, logout } from '../redux/auth/authSlice';
import { store } from '../redux/store';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337',
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const state = store.getState();
        const token = state.auth?.token;

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
            console.warn('Session expired. Logging out...');


            store.dispatch(logout());
            store.dispatch(
                loginFailure('Session expired. Please log in again.')
            );
            
 
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;