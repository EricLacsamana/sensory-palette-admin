import api from '../api copy';
import { ENDPOINTS } from '../constants/api';

export const getActivity = async (id) => {
    return api
        .get(`${ENDPOINTS.ACTIVITIES}/${id}?populate=*`)
        .then(({ data }) => data?.data);
};
