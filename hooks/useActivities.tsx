// hooks/useActivities.ts (or wherever your file is located)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { ENDPOINTS } from '../constants/api';
import { Activity } from '@/types/actitivity';

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
            id: string;
            // You can keep Activity here, but we cast during destructuring
            // to avoid TS errors if your Activity type doesn't strictly define these Strapi fields
            payload: Activity;
        }) => {
            console.log('Original payload before cleaning:', payload);

            // Destructure out the read-only keys that Strapi rejects on update
            const {
                id: _id,
                documentId: _documentId,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                publishedAt: _publishedAt,
                ...cleanPayload
            } = payload;

            // Send the cleanPayload to Strapi
            const { data } = await api.put(`${ENDPOINTS.ACTIVITIES}/${id}`, {
                data: cleanPayload,
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
