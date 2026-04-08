import qs from 'qs';
import api from './index';
import { ENDPOINTS } from '../constants/api';
import { User, UserResponse } from '@/types';
import { QueryFunctionContext } from '@tanstack/react-query';

export interface TherapistInput extends Partial<User> {
    password?: string;
}

export const createTherapist = async (data: TherapistInput): Promise<User> => {
    const response = await api.post<User>(ENDPOINTS.USERS, data);
    return response.data;
};

export const getTherapists = async (ctx: any): Promise<UserResponse[]> => {
    const [, { searchQuery }] = ctx.queryKey;

    const params = new URLSearchParams();

    // Populate ALL relations
    params.append('populate', '*');

    // Filter strictly for "Therapist" role
    params.append('filters[role][name][$eq]', 'Therapist');

    if (searchQuery) {
        params.append('filters[$or][0][username][$containsi]', searchQuery);
        params.append('filters[$or][1][email][$containsi]', searchQuery);
    }

    // FIX: Await the response and extract .data
    const response = await api.get(`${ENDPOINTS.USERS}?${params.toString()}`);
    return response.data;
};

// export const getTherapists = async (ctx: any): Promise<UserResponse[]> => {
//     const [, { searchQuery }] = ctx.queryKey;

//     const params = new URLSearchParams();

//     // Populate ALL relations
//     params.append('populate', '*');

//     // Filter strictly for "Therapist" role
//     params.append('filters[role][name][$eq]', 'Therapist');

//     if (searchQuery) {
//         params.append('filters[$or][0][username][$containsi]', searchQuery);
//         params.append('filters[$or][1][email][$containsi]', searchQuery);
//     }

//     const response = await api.get(`${ENDPOINTS.USERS}?${params.toString()}`);
//     return response.data;
// };

export const getTherapist = async (
    ctx: QueryFunctionContext,
): Promise<UserResponse> => {
    const [, id] = ctx.queryKey;

    const { data } = await api.get(`${ENDPOINTS.USERS}/${id}?populate=*`);

    // Safely handle both standard Strapi responses and the /users endpoint quirk,
    // and fallback to null so React Query never receives undefined.
    return data?.data ?? data ?? null;
};

export const updateTherapist = async (
    id: string | number,
    data: TherapistInput,
): Promise<User> => {
    const response = await api.put<User>(`${ENDPOINTS.USERS}/${id}`, data);
    return response.data;
};
