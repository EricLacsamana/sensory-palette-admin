import { User } from '.';
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

export enum PromptLevel {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface ActivitySessionResponse {
    id: number | string;
    documentId: string;
    student: User;
    activity: Activity;
    therapist: User;
    startAt: string;
    endAt: string; // ISO String
    durationMinutes: number;
    activitySessionStatus: ActivitySessionStatus;
    promptLevel: PromptLevel;
    teacherNotes?: string;
    actualScore?: number;
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
};

export type ActivitySessionPayload = Omit<
    Partial<ActivitySessionResponse>,
    'id'
> & {
    startAt: string;
    endAt: string;
    teacherNotes?: string;
    promptLevel?: PromptLevel;
    student: keyof User;
};
