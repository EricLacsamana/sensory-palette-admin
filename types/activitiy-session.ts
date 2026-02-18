import { User, UserResponse } from '.';
import { Activity } from './actitivity';

export enum ActivitySessionStatus {
    Pending = 'pending',
    InProgress = 'in-progress',
    Completed = 'completed',
    Cancelled = 'cancelled',
    Interrupted = 'interrupted',
    Abandoned = 'abandoned',
    Reschedule = 'reschedule',
}

export interface ActivitySessionResponse {
    id: number | string;
    documentId: string;
    student: UserResponse;
    activity: Activity;
    therapist: User;
    startAt: string;
    endAt: string; // ISO String
    actualStartAt: string; // ISO String
    actualEndAt: string; // ISO String
    activitySessionStatus: ActivitySessionStatus;
    teacherNotes?: string;
    score?: number;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
}

export type ActivitySessionEntry = Omit<
    Partial<ActivitySessionResponse>,
    'id'
> & {
    instanceId: string;
    id?: number | string;
    isLocked: boolean;
    startAt: string;
    endAt: string;
    isBreak?: boolean;
    hasConflict?: boolean;
    conflictReason?: string;
    student?: UserResponse;
    durationMinutes?: number;
    documentId?: string;
    activity: Activity;
    type: 'activity' | 'gap';
};

export type CreateActivitySessionPayload = {
    startAt: string;
    endAt: string;
    teacherNotes?: string;
    durationMinutes?: number;
    student: number;
    activity: string;
};

export type UpdatectivitySessionPayload = {
    startAt: string;
    endAt: string;
    teacherNotes?: string;
    durationMinutes?: number;
    activitiySessionStatus?: ActivitySessionStatus;
};
