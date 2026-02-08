import api from '.';
import { ENDPOINTS } from '../constants/api';

export const getActivity = async (id: string) => {
    return api
        .get(`${ENDPOINTS.ACTIVITIES}/${id}?populate=*`)
        .then(({ data }) => data?.data);
};
