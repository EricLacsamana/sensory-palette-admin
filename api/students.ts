import api from './index';
import { ENDPOINTS } from '../constants/api';
import { User, UserResponse } from '@/types';

export interface StudentInput extends Partial<User> {
    password?: string;
}

export const createStudent = async (data: StudentInput): Promise<User> => {
    const response = await api.post<User>(ENDPOINTS.USERS, data);
    return response.data;
};
export const getStudents = async (ctx: any): Promise<User[]> => {
    const [, { searchQuery }] = ctx.queryKey;

    const params = new URLSearchParams();

    // Always populate the role to check it, and filter strictly for "Student"
    params.append('populate', 'role');
    params.append('filters[role][name][$eq]', 'Student'); // Case-sensitive: 'Student' or 'student'

    // 2. If a search term exists, add a case-insensitive "Contains" filter
    // This creates logic: Role=Student AND (Username contains X OR Email contains X)
    if (searchQuery) {
        params.append('filters[$or][0][username][$containsi]', searchQuery);
        params.append('filters[$or][1][email][$containsi]', searchQuery);
    }

    // 3. Make the request
    const response = await api.get<User[]>(
        `${ENDPOINTS.USERS}?${params.toString()}`,
    );
    return response.data;
};

export const getStudent = async (ctx: any): Promise<UserResponse> => {
    const [, { id }] = ctx.queryKey;

    const response = await api.get<UserResponse>(
        `${ENDPOINTS.USERS}/${id}?populate=role`,
    );

    return response.data;
};

export const updateStudent = async (
    id: string | number,
    data: StudentInput,
): Promise<User> => {
    const response = await api.put<User>(`${ENDPOINTS.USERS}/${id}`, data);
    return response.data;
};
