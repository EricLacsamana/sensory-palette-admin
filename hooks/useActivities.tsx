import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { ENDPOINTS } from '../constants/api';

const fetchActivities = async () => {
    const { data } = await api.get(`${ENDPOINTS.ACTIVITIES}/?populate=*`);
    return data.data;
};

export const useActivities = () => {
    return useQuery({
        queryKey: ['activities'],
        queryFn: fetchActivities,
    });
};
