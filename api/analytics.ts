import { ENDPOINTS } from '@/constants/api';
import api from '.';
import qs from 'qs';

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
    const url = `api/activity-sessions/analytics/student/${studentId}?${queryString}`;

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

    const { data } = await api.get(
        `${ENDPOINTS.ACTIVITY_SESSIONS}/analytics/global?${queryString}`,
    );
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
    const url = `api/activity-sessions/analytics/compare?${queryString}`;

    const { data } = await api.get(url);
    return data?.data;
};

export const getStudentsAnalytics = async (
    id: string,
    startDate?: string,
    endDate?: string,
) => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const { data } = await api.get(
        `${ENDPOINTS.ACTIVITY_SESSIONS}/analytics/student/${id}?${queryParams.toString()}`,
    );

    return data?.data;
};
