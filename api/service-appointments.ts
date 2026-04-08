import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';
import { CreateServicePayload, UpdateServicePayload } from '@/types/service';

import {
    CreateAppointmentPayload,
    UpdateAppointmentPayload,
} from '@/types/appointment';

export const getServices = async (ctx: any = {}) => {
    const [, query] = ctx.queryKey;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });

    const url = `${ENDPOINTS.SERVICES}?${queryString}`;

    return await api.get(url).then(({ data }) => data.data);
};
// // 1. Get all services with category (specialty) filtering
// export const getServices = async (ctx: any = {}) => {
//     const [
//         ,
//         {
//             searchTerm = '',
//             category, // OT, BCBA, etc.
//             limit,
//             pageParam,
//             page,
//         } = {},
//     ] = ctx.queryKey || [null, {}];

//     const query: any = {
//         populate: '*', // Includes banner/media
//         sort: ['name:asc'],
//         filters: {},
//         pagination: {
//             page: pageParam || page || 1,
//             pageSize: limit || 50,
//         },
//     };

//     if (category) {
//         query.filters.category = { $eq: category };
//     }

//     if (searchTerm && searchTerm.trim() !== '') {
//         query.filters.name = { $containsi: searchTerm };
//     }

//     const queryString = qs.stringify(query, { encodeValuesOnly: true });
//     const url = `${ENDPOINTS.SERVICES}?${queryString}`;

//     return api.get(url).then(({ data }) => data.data);
// };

// 2. Get a single service protocol
export const getService = async (id: string) => {
    return api
        .get(`${ENDPOINTS.SERVICES}/${id}?populate=*`)
        .then(({ data }) => data?.data);
};

// 3. Create a new service template
export const createService = async (payload: CreateServicePayload) => {
    const { data } = await api.post(ENDPOINTS.SERVICES, {
        data: payload,
    });
    return data;
};

// 4. Update an existing service template
export const updateService = async (
    id: string,
    payload: UpdateServicePayload,
) => {
    const { data } = await api.put(`${ENDPOINTS.SERVICES}/${id}`, {
        data: payload,
    });
    return data;
};

// 5. Delete a service protocol
export const deleteService = async (id: string) => {
    return api.delete(`${ENDPOINTS.SERVICES}/${id}`);
};

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
