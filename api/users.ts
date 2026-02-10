import api from '../api';
import { ENDPOINTS } from '../constants/api';

export const me = () => {
    return api.get(`${ENDPOINTS.USERS}/me?populate=*`).then(({ data }) => data);
};
