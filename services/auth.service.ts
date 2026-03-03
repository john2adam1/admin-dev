
import api from '@/lib/api/axios';
import { LoginReq, TokenRes, PasswordChangeReq, AuthResponse } from '@/types';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'admin_token';

export const authService = {
    // Login
    login: async (data: LoginReq): Promise<AuthResponse> => {
        // Correct endpoint for admin login as per swagger: /web/auth/admin/login
        // Axios base URL already includes /web
        const response = await api.post<AuthResponse>('auth/admin/login', data);
        const { access_token } = response.data;

        if (access_token) {
            Cookies.set(TOKEN_KEY, access_token, { expires: 7 });
        }

        return response.data;
    },

    // Change Password (if needed for admin)
    changePassword: async (data: PasswordChangeReq): Promise<void> => {
        await api.put('auth/password/change', data);
    },

    // Refresh Password/Token (as per requirements "PUT /auth/password/refresh")
    // Note: Usually refresh is for tokens. If this endpoint is for password refresh, usage depends on context.
    // If it's for token refresh:
    refreshToken: async (): Promise<TokenRes> => {
        // This might be different based on actual API implementation
        // Assuming standard refresh flow if it existed, but using the specific endpoint requested:
        const response = await api.put<TokenRes>('auth/password/refresh');
        return response.data;
    },

    // Logout
    logout: (): void => {
        Cookies.remove(TOKEN_KEY);
        if (typeof window !== 'undefined') {
            window.location.href = '/admin/login';
        }
    },

    // Check auth status
    isAuthenticated: (): boolean => {
        return !!Cookies.get(TOKEN_KEY);
    },

    // Get token
    getToken: (): string | undefined => {
        return Cookies.get(TOKEN_KEY);
    }
};
