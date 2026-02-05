import api from '.';
import { ENDPOINTS } from '../constants/api';

export const getActivitySessions = async () => {
    return api
        .get(`${ENDPOINTS.ACTIVITY_SESSIONS}?populate=*`)
        .then(({ data }) => data?.data);
};

export const getActivitySession = async (id: string) => {
    return api
        .get(`${ENDPOINTS.ACTIVITY_SESSIONS}/${id}?populate=*`)
        .then(({ data }) => data?.data);
};

export const createActivitySession = async (payload: any) => {
    const { data } = await api.post(ENDPOINTS.ACTIVITY_SESSIONS, {
        data: payload,
    });
    return data;
};
