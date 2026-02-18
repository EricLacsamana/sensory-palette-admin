import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';
export const me = () => {
    return api.get(`${ENDPOINTS.USERS}/me?populate=*`).then(({ data }) => data);
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
