import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';
import {
    CreateAppointmentPayload,
    UpdateAppointmentPayload,
} from '@/types/appointment';

// 1. Flexible query for the Timeline Modal (uses passed query object)
export const getAppointmentsNew = async (ctx: any = {}) => {
    const [queryKey, query] = ctx.queryKey;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });
    const url = `${ENDPOINTS.APPOINTMENTS}?${queryString}`;

    const res = await api.get(url).then(({ data }) => data.data);
    return res;
};

// 2. List view for Dashboard (Learner or Therapist perspective)
export const getAppointments = async (ctx: any = {}) => {
    const [
        ,
        {
            searchTerm = '',
            limit,
            pageParam,
            page,
            startAt, // ISO String
            endAt, // ISO String
            studentId, // Learner ID
            therapistId, // Therapist ID
        } = {},
    ] = ctx.queryKey || [null, {}];

    const query: any = {
        populate: {
            service: { populate: '*' },
            student: { populate: '*' },
            therapist: { populate: '*' },
        },
        sort: ['startAt:desc'],
        filters: {},
        pagination: {},
    };

    if (studentId) query.filters.student = studentId;
    if (therapistId) query.filters.therapist = therapistId;

    if (startAt && endAt && startAt !== 'undefined') {
        query.filters.startAt = {
            $gte: startAt,
            $lte: endAt,
        };
        query.pagination.pageSize = 100;
    } else {
        query.pagination.page = pageParam || page || 1;
        query.pagination.pageSize = limit || 15;
    }

    if (searchTerm && searchTerm.trim() !== '') {
        query.filters.$or = [
            { student: { fullName: { $containsi: searchTerm } } },
            { service: { name: { $containsi: searchTerm } } },
            { therapist: { fullName: { $containsi: searchTerm } } },
        ];
    }

    const queryString = qs.stringify(query, { encodeValuesOnly: true });
    const url = `${ENDPOINTS.APPOINTMENTS}?${queryString}`;

    return api.get(url).then(({ data }) => data.data);
};

export const getAppointment = async (ctx: any = {}) => {
    const [queryKey, id, query] = ctx.queryKey;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });

    const url = `${ENDPOINTS.APPOINTMENTS}/${id}?${queryString}`;

    const res = await api.get(url).then(({ data }) => data.data);
    console.log('quack', res);

    return res;
};
// 4. Create an appointment
export const createAppointment = async (payload: CreateAppointmentPayload) => {
    const { data } = await api.post(ENDPOINTS.APPOINTMENTS, {
        data: payload,
    });
    return data;
};

// 5. Update an appointment (e.g., status or time change)
export const updateAppointment = async (
    id: string,
    payload: UpdateAppointmentPayload,
) => {
    const { data } = await api.put(`${ENDPOINTS.APPOINTMENTS}/${id}`, {
        data: payload,
    });
    return data;
};

// 6. Delete an appointment
export const deleteAppointment = async (id: string) => {
    return api.delete(`${ENDPOINTS.APPOINTMENTS}/${id}`);
};
