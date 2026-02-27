import api from './index';
import { ENDPOINTS } from '../constants/api';
import { User, UserResponse } from '@/types';
import { QueryFunctionContext } from '@tanstack/react-query';

export interface StudentInput extends Partial<User> {
    password?: string;
}

export const createStudent = async (data: StudentInput): Promise<User> => {
    const response = await api.post<User>(ENDPOINTS.USERS, data);
    return response.data;
};
export const getStudents = async (ctx: any): Promise<UserResponse[]> => {
    const [, { searchQuery }] = ctx.queryKey;

    const params = new URLSearchParams();

    // Populate ALL relations
    params.append('populate', '*');

    // Filter strictly for "Student" role
    params.append('filters[role][name][$eq]', 'Student');

    if (searchQuery) {
        params.append('filters[$or][0][username][$containsi]', searchQuery);
        params.append('filters[$or][1][email][$containsi]', searchQuery);
    }

    const response = await api.get(`${ENDPOINTS.USERS}?${params.toString()}`);
    return response.data;
};

export const getStudent = async (
    ctx: QueryFunctionContext,
): Promise<UserResponse> => {
    const [, id] = ctx.queryKey;

    const { data } = await api.get(`${ENDPOINTS.USERS}/${id}?populate=*`);

    // Safely handle both standard Strapi responses and the /users endpoint quirk,
    // and fallback to null so React Query never receives undefined.
    return data?.data ?? data ?? null;
};

export const updateStudent = async (
    id: string | number,
    data: StudentInput,
): Promise<User> => {
    const response = await api.put<User>(`${ENDPOINTS.USERS}/${id}`, data);
    return response.data;
};
