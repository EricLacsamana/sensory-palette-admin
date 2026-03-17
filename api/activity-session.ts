import {
    CreateActivitySessionPayload,
    UpdatectivitySessionPayload,
} from '@/types/activitiy-session';
import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';

export const getActivitySessionsNew = async (ctx: any = {}) => {
    const [queryKey, query] = ctx.queryKey;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });
    console.log(queryKey, queryString);
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

// ... your existing imports

// 1. Get Analytics for a Single Student (Used in the Student Dashboard)
export const getStudentAnalytics = async (ctx: any = {}) => {
    // Destructure the query key array passed by React Query
    const [, { studentId, startDate, endDate }] = ctx.queryKey;

    if (!studentId) throw new Error('studentId is required for analytics');

    const query: any = {};
    if (startDate) query.startDate = startDate;
    if (endDate) query.endDate = endDate;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });

    // Using your configured 'api' instance fixes the 404 routing issue
    const url = `/activity-sessions/analytics/student/${studentId}?${queryString}`;

    const { data } = await api.get(url);
    return data?.data;
};

// 2. Get Global Analytics (Useful for an Admin/Clinic-wide Dashboard)
export const getGlobalAnalytics = async (ctx: any = {}) => {
    const [, { startDate, endDate }] = ctx.queryKey;

    const query: any = {};
    if (startDate) query.startDate = startDate;
    if (endDate) query.endDate = endDate;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });
    const url = `/activity-sessions/analytics/global?${queryString}`;

    const { data } = await api.get(url);
    return data?.data;
};

// 3. Get Comparison Analytics (Compare Student A vs Student B or Global)
export const getComparisonAnalytics = async (ctx: any = {}) => {
    const [, { baseStudent, compareStudent, startDate, endDate }] =
        ctx.queryKey;

    if (!baseStudent)
        throw new Error('baseStudent ID is required for comparison');

    const query: any = { baseStudent };
    if (compareStudent) query.compareStudent = compareStudent;
    if (startDate) query.startDate = startDate;
    if (endDate) query.endDate = endDate;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });
    const url = `/activity-sessions/analytics/compare?${queryString}`;

    const { data } = await api.get(url);
    return data?.data;
};
