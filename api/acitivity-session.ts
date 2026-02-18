import {
    CreateActivitySessionPayload,
    UpdatectivitySessionPayload,
} from '@/types/activitiy-session';
import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';

export const getActivitySessionsNew = async (ctx: any = {}) => {
    const [, query] = ctx.queryKey;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });
    console.log('queryString', queryString);
    // console.log('query', queryString);
    const url = `${ENDPOINTS.ACTIVITY_SESSIONS}?${queryString}`;

    const res = await api.get(url).then(({ data }) => data.data);
    console.log('quack', res);

    return res;
};
export const getActivitySessions = async (ctx: any = {}) => {
    const [
        ,
        {
            searchTerm = '',
            limit,
            pageParam,
            page,
            startDate,
            endDate,
            studentId,
        },
    ] = ctx.queryKey;

    const query: any = {
        populate: {
            activity: { populate: '*' },
            student: { populate: '*' },
            therapist: { populate: '*' },
        },
        sort: ['startTime:desc'],
        filters: {},
        pagination: {},
    };

    if (!!studentId) {
        query.filters.student = studentId;
    }

    if (startDate && endDate && startDate !== 'undefined') {
        query.filters.startTime = {
            $gte: startDate,
            $lte: endDate,
        };
        query.pagination.pageSize = 100;
    } else {
        query.pagination.page = pageParam || page || 1;
        query.pagination.pageSize = limit || 15;
    }

    // 4. Add Search Logic
    if (searchTerm && searchTerm.trim() !== '') {
        query.filters.$or = [
            { student: { firstName: { $containsi: searchTerm } } },
            { activity: { name: { $containsi: searchTerm } } },
        ];
    }

    const queryString = qs.stringify(query, { encodeValuesOnly: true });

    // console.log('query', queryString);
    const url = `${ENDPOINTS.ACTIVITY_SESSIONS}?${queryString}`;

    return api.get(url).then(({ data }) => data.data);
};

export const getActivitySession = async (id: string) => {
    return api
        .get(`${ENDPOINTS.ACTIVITY_SESSIONS}/${id}?populate=*`)
        .then(({ data }) => data?.data);
};

export const createActivitySession = async (
    payload: CreateActivitySessionPayload,
) => {
    console.log('create payload', payload);
    const { data } = await api.post(ENDPOINTS.ACTIVITY_SESSIONS, {
        data: payload,
    });
    return data;
};

export const updateActivitySession = async (
    id: string,
    payload: UpdatectivitySessionPayload,
) => {
    console.log('update payload', payload);
    const { data } = await api.put(`${ENDPOINTS.ACTIVITY_SESSIONS}/${id}`, {
        data: payload,
    });
    return data;
};

export const deleteActivitySession = async (id: string) => {
    return api.delete(`${ENDPOINTS.ACTIVITY_SESSIONS}/${id}`);
};

export const triggerActivitySessionRecommendation = async (id: string) => {
    // We use POST as defined in our Strapi custom route
    const url = `${ENDPOINTS.ACTIVITY_SESSIONS}/${id}/recommend`;

    // In Strapi v5 custom routes, the response is usually flattened
    const { data } = await api.post(url);
    return data;
};
