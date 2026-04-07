
import api from '@/lib/api/axios';
import { PromocodeRedemptionListResponse, PaginationMeta } from '@/types';

export interface PromoCode {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    starts_at: string;
    ends_at: string;
    max_uses_total: number;
    max_uses_per_user: number;
    min_order_amount: number;
    max_discount: number;
    is_active: boolean;
    type: string;
    courses: string[];
    course_id?: string;
    created_at: string;
    updated_at: string;
}

export interface PromoCodeCreateReq {
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    starts_at: string;
    ends_at: string;
    max_uses_total?: number;
    max_uses_per_user?: number;
    min_order_amount?: number;
    max_discount?: number;
    is_active?: boolean;
    type: string;
    courses: string[];
    course_id?: string;
}

export interface PromoCodeUpdateReq {
    discount_type?: 'percent' | 'fixed';
    discount_value?: number;
    starts_at?: string;
    ends_at?: string;
    max_uses_total?: number;
    max_uses_per_user?: number;
    min_order_amount?: number;
    max_discount?: number;
    is_active?: boolean;
    type?: string;
    courses?: string[];
    course_id?: string;
}

export interface PromoCodeListResponse {
    promo_codes: PromoCode[];
    count: number;
    meta?: PaginationMeta;
}

export const promocodeService = {
    getAll: async (page = 1, limit = 10, filters?: { code?: string; is_active?: boolean }): Promise<PromoCodeListResponse> => {
        const response = await api.get<PromoCodeListResponse>('promocode', {
            params: { page, limit, ...filters }
        });
        return response.data;
    },

    getOne: async (id: string): Promise<PromoCode> => {
        const response = await api.get<PromoCode>(`promocode/${id}`);
        return response.data;
    },

    create: async (data: PromoCodeCreateReq): Promise<PromoCode> => {
        const response = await api.post<PromoCode>('promocode', data);
        return response.data;
    },

    update: async (id: string, data: PromoCodeUpdateReq): Promise<PromoCode> => {
        const response = await api.put<PromoCode>(`promocode/${id}/update`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`promocode/${id}/delete`);
    },

    getRedemptions: async (id: string, page = 1, limit = 10, filters?: any): Promise<PromocodeRedemptionListResponse> => {
        const response = await api.get<PromocodeRedemptionListResponse>(`promocode/redemption`, {
            params: { page, limit, promo_id: id, promocode_id: id, ...filters }
        });
        return response.data;
    },

    getAllRedemptions: async (page = 1, limit = 10, filters?: { user_id?: string; promo_id?: string; is_active?: string }): Promise<any> => {
        const response = await api.get<any>('promocode/redemption', {
            params: { page, limit, ...filters }
        });
        return response.data;
    }
};
