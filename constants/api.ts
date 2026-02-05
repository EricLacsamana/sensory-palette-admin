export const CONFIG = {
    timeout: 30000,
} as const;

export const ENDPOINTS = {
    ACTIVITIES: '/api/activities',
    ACTIVITY_SESSIONS: '/api/activity-sessions',
    AUTH_LOCAL: '/api/auth/local',
    STUDENTS: '/api/students', 
    USERS: '/api/users',     
} as const;

export type Endpoint = typeof ENDPOINTS[keyof typeof ENDPOINTS];