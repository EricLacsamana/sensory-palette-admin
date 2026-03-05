import api from '.';
import { ENDPOINTS } from '@/constants/api';

// Fetch unread notifications for the currently logged-in user
export const getMyNotifications = async () => {
    // Note: Assuming your axios instance already injects the Authorization Bearer token
    const response = await api.get(`${ENDPOINTS.NOTIFICATIONS}/me`);
    return response.data;
};

// Mark a single notification as read (Uses standard Strapi core router)
export const markAsRead = async (documentId: string) => {
    const response = await api.put(
        `${ENDPOINTS.NOTIFICATIONS}/${documentId}/read`,
        {
            data: { isRead: true },
        },
    );
    return response.data;
};

// Mark a single notification as read (Uses standard Strapi core router)
export const markAsUnread = async (documentId: string) => {
    const response = await api.put(
        `${ENDPOINTS.NOTIFICATIONS}/${documentId}/unread`,
        {
            data: { isRead: true },
        },
    );
    return response.data;
};

// Mark all notifications as read for the current user
export const markAllMyRead = async () => {
    const response = await api.put(
        `${ENDPOINTS.NOTIFICATIONS}/notifications/mark-all-read`,
    );
    return response.data;
};
