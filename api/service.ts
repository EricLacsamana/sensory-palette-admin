import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';
import { CreateServicePayload, UpdateServicePayload } from '@/types/service';

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
