import { User } from '.';
import { Activity } from './actitivity';

export enum ActivitySessionStatus {
    Pending = 'Pending',
    InProgress = 'InProgress',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
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
    startTime: string; // ISO String
    endTime: string; // ISO String
    durationMinutes: number;
    activityStatus: ActivitySessionStatus;
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
    isBreak: boolean;
    hasConflict: boolean;
};

export type ActivitySessionPayload = Omit<
    Partial<ActivitySessionResponse>,
    'id'
> & {
    startTime: string;
    endTime: string;
    teacherNotes?: string;
    promptLevel?: PromptLevel;
    student: keyof User;
};
