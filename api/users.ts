import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';
export const me = () => {
    return api.get(`${ENDPOINTS.USERS}/me?populate=*`).then(({ data }) => data);
};

export const createUser = async (payload: any) => {
    const { data } = await api.post(ENDPOINTS.USERS, payload);

    console.log('data create', data);
    return data;
};

export const getUsers = async (ctx: any) => {
    const [, query] = ctx.queryKey ?? [];

    const queryString = qs.stringify(query ?? {}, {
        encodeValuesOnly: true,
    });

    const url = queryString
        ? `${ENDPOINTS.USERS}?${queryString}`
        : ENDPOINTS.USERS;

    const response = await api.get(url);

    console.log('res', response?.data);
    return response?.data ?? [];
};

// Add this to your api/users.ts file
export const updateUserProfile = async (userId: number, payload: any) => {
    const { data } = await api.put(`${ENDPOINTS.USERS}/${userId}`, payload);

    return data;
};

export const changePassword = async (payload: any) => {
    try {
        const { data } = await api.post(
            `${ENDPOINTS.AUTH}/change-password`,
            payload,
        );
        return data;
    } catch (error: any) {
        // 1. Check if the error came from the Strapi backend (Axios response)
        if (
            error.response &&
            error.response.data &&
            error.response.data.error
        ) {
            // Throw the exact message Strapi provided (e.g., "Current password does not match")
            throw new Error(error.response.data.error.message);
        }

        // 2. Fallback for network issues or unexpected errors
        throw new Error(
            error.message ||
                'An unexpected error occurred while changing password',
        );
    }
};

// Add this to your api/users.ts or your api helpers file
export const updateStudentPasscode = async (
    id: number,
    newPasscode: string,
) => {
    // Using your existing axios instance or fetch wrapper
    return api.put(`${ENDPOINTS.USERS}/${id}`, {
        activePasscode: newPasscode,
        passcodeExpiresAt: new Date(
            Date.now() + 4 * 60 * 60 * 1000,
        ).toISOString(),
    });
};
