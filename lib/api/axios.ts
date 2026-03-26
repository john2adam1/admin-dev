
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Helper to get base URL - prioritized: env var > default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev.axadjonovsardorbek.uz/web';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get token from cookies or local storage
        // Using js-cookie for consistency
        const token = Cookies.get('admin_token');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof window !== 'undefined') {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        if (typeof window !== 'undefined') {
            console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        }
        return response;
    },
    (error: AxiosError) => {
        // Log error details for debugging
        if (error.response) {
            console.error('API Error:', {
                status: error.response.status,
                url: error.config?.url,
                method: error.config?.method,
                data: error.response.data,
            });
        }

        // Handle 401 Unauthorized and 403 Forbidden
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Clear token
            Cookies.remove('admin_token');

            // Optional: Redirect to login page if we are in the browser
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
                console.warn('Authentication failed. Redirecting to login...');
                window.location.href = '/admin/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
