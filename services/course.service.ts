
import api from '@/lib/api/axios';
import {
    Course,
    CourseCreateBody,
    CourseUpdateBody,
    CoursePermission,
    CoursePermissionCreateBody,
    PaginatedResponse
} from '@/types';

const RESOURCE_URL = 'course';

export const courseService = {
    // Course CRUD
    getAll: async (subjectId?: string, page = 1, limit = 10, filters?: { name?: string; teacher_id?: string; is_public?: boolean }): Promise<PaginatedResponse<Course>> => {
        const params: any = { page, limit, ...filters };
        if (subjectId) params.subject_id = subjectId;

        const response = await api.get<PaginatedResponse<Course>>(RESOURCE_URL, {
            params
        });
        return response.data;
    },

    getAllWithoutPagination: async (subjectId?: string, filters?: { name?: string; teacher_id?: string; is_public?: boolean }): Promise<PaginatedResponse<Course>> => {
        let allCourses: Course[] = [];
        let page = 1;
        const limit = 100; // Fetch as many as possible per page
        let lastResponse: PaginatedResponse<Course> | null = null;

        while (true) {
            const params: any = { page, limit, ...filters };
            if (subjectId) params.subject_id = subjectId;
            const response = await api.get<PaginatedResponse<Course>>(RESOURCE_URL, { params });
            lastResponse = response.data;

            if (lastResponse.data && lastResponse.data.length > 0) {
                allCourses = [...allCourses, ...lastResponse.data];
            }

            if (page >= (lastResponse.total_page || 1) || !lastResponse.has_next || lastResponse.data.length === 0) {
                break;
            }
            page++;
        }

        return {
            ...lastResponse!,
            data: allCourses,
            total: allCourses.length,
            limit: allCourses.length,
            page: 1,
            total_page: 1,
            has_next: false,
            has_previous: false
        };
    },


    getById: async (id: string): Promise<Course> => {
        const response = await api.get<Course>(`${RESOURCE_URL}/${id}`);
        return response.data;
    },

    create: async (data: CourseCreateBody): Promise<Course> => {
        const response = await api.post<Course>(RESOURCE_URL, data);
        return response.data;
    },

    update: async (id: string, data: CourseUpdateBody): Promise<Course> => {
        const response = await api.put<Course>(`${RESOURCE_URL}/${id}/update`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`${RESOURCE_URL}/${id}/delete`);
    },

    // Permissions (User-Course)
    getPermissions: async (page = 1, limit = 10, filters?: { user_id?: string; course_id?: string; tariff_id?: string }): Promise<PaginatedResponse<CoursePermission>> => {
        const response = await api.get<PaginatedResponse<CoursePermission>>(`${RESOURCE_URL}/permission`, {
            params: { page, limit, ...filters }
        });
        return response.data;
    },

    grantPermission: async (data: CoursePermissionCreateBody): Promise<CoursePermission> => {
        const response = await api.post<CoursePermission>(`${RESOURCE_URL}/permission`, data);
        return response.data;
    },

    getPermissionById: async (id: string): Promise<CoursePermission> => {
        const response = await api.get<CoursePermission>(`${RESOURCE_URL}/permission/${id}`);
        return response.data;
    },

    updatePermission: async (id: string, data: Partial<CoursePermission>): Promise<CoursePermission> => {
        const response = await api.put<CoursePermission>(`${RESOURCE_URL}/permission/${id}/update`, data);
        return response.data;
    },

    deletePermission: async (id: string): Promise<void> => {
        await api.delete(`${RESOURCE_URL}/permission/${id}/delete`);
    }
};
