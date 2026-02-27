import api from '.';
import { ENDPOINTS } from '../constants/api';
import qs from 'qs';

export const getActivities = async (ctx: any = {}) => {
    const [, query] = ctx.queryKey;

    const queryString = qs.stringify(query, { encodeValuesOnly: true });

    const url = `${ENDPOINTS.ACTIVITIES}?${queryString}`;

    const res = await api.get(url).then(({ data }) => data.data);

    return res;
};

export const getActivity = async (id: string) => {
    return api
        .get(`${ENDPOINTS.ACTIVITIES}/${id}?populate=*`)
        .then(({ data }) => data?.data);
};
