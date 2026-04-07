export const CONFIG = {
    timeout: 30000,
} as const;

export const ENDPOINTS = {
    APPOINTMENTS: '/api/appointments',
    ACTIVITIES: '/api/activities',
    ACTIVITY_SESSIONS: '/api/activity-sessions',
    AUTH: '/api/auth',
    AUTH_LOCAL: '/api/auth/local',
    NOTIFICATIONS: '/api/notifications',
    SERVICES: '/api/services',
    STUDENTS: '/api/students',
    USERS: '/api/users',
} as const;

export type Endpoint = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];
