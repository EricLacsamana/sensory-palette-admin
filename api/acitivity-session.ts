import api from '.';
import { ENDPOINTS } from '../constants/api';

export const getActivitySessions = async (args: any = {}) => {
    const queryKey = args.queryKey || [];

    // 1. Extract values - handling cases where queryKey might be shorter
    const searchTerm = queryKey[1] || args.searchTerm || '';
    const startDate = queryKey[2] || args.startDate;
    const endDate = queryKey[3] || args.endDate;
    const studentId = queryKey[4] || args.studentId;

    // 2. Base URL
    let url = `${ENDPOINTS.ACTIVITY_SESSIONS}?populate[activity][populate]=*&sort[0]=startTime:desc`;

    // 3. CONDITIONAL STUDENT FILTERING
    // Only append if studentId is truthy and not the string 'undefined'
    if (studentId && studentId !== 'undefined') {
        url += `&filters[student][documentId][$eq]=${studentId}`;
    }

    // 4. DATE RANGE / MODE SELECTION
    if (startDate && endDate && startDate !== 'undefined') {
        url += `&filters[startTime][$gte]=${startDate}`;
        url += `&filters[startTime][$lte]=${endDate}`;
        url += `&pagination[pageSize]=100`;
    } else {
        const limit = args.limit || 15;
        const page = args.pageParam || args.page || 1;
        url += `&pagination[page]=${page}`;
        url += `&pagination[pageSize]=${limit}`;
    }

    // 5. SEARCH
    if (searchTerm && searchTerm.trim() !== '') {
        url += `&filters[$or][0][student][firstName][$containsi]=${searchTerm}`;
        url += `&filters[$or][1][activity][name][$containsi]=${searchTerm}`;
    }

    console.log('📡 Requesting:', url);
    return api.get(url).then(({ data }) => data);
};

export const getActivitySession = async (id: string) => {
    return api
        .get(`${ENDPOINTS.ACTIVITY_SESSIONS}/${id}?populate=*`)
        .then(({ data }) => data?.data);
};

export const createActivitySession = async (payload: any) => {
    console.log('payload', payload);
    const { data } = await api.post(ENDPOINTS.ACTIVITY_SESSIONS, {
        data: payload,
    });
    return data;
};

export const updateActivitySession = async (
    id: string | number,
    payload: any,
) => {
    console.log('payload', payload);
    const { data } = await api.put(`${ENDPOINTS.ACTIVITY_SESSIONS}/${id}`, {
        data: payload,
    });
    return data;
};

export const deleteActivitySession = async (id: string) => {
    return api.delete(`/activity-sessions/${id}`);
};
