// hooks/useActivities.ts (or wherever your file is located)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { ENDPOINTS } from '../constants/api';

// --- FETCH ---
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

// --- CREATE ---
export const useCreateActivity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post(ENDPOINTS.ACTIVITIES, {
                data: payload,
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });
};

// --- UPDATE ---
export const useUpdateActivity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: string | number;
            payload: any;
        }) => {
            const { data } = await api.put(`${ENDPOINTS.ACTIVITIES}/${id}`, {
                data: payload,
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });
};

// --- DELETE ---
export const useDeleteActivity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            const { data } = await api.delete(`${ENDPOINTS.ACTIVITIES}/${id}`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });
};
