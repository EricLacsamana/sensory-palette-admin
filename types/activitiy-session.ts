import { User, UserResponse } from '.';
import { Activity } from './actitivity';

export enum ActivitySessionStatus {
    Pending = 'pending',
    Queued = 'queued',
    InProgress = 'in_progress',
    Paused = 'paused', // Added Paused Status
    Interrupted = 'interrupted',
    Completed = 'completed',
    Cancelled = 'cancelled',
    Abandoned = 'abandoned',
    Reschedule = 'reschedule',
}

export type PauseReason =
    | 'Bathroom Break'
    | 'Behavioral Interruption'
    | 'Tech Issue'
    | 'Learner Initiated'
    | 'Fatigue / Break'
    | 'Other';

export interface TimeLog {
    status: 'start' | 'pause' | 'resume';
    timestamp: string;
    reason?: PauseReason | string;
}

export interface BehavioralIndicator {
    evidence: string;
    confidence: number;
    pattern: string;
}

export interface TelemetryAnalysis {
    event: string;
    timestamp: number;
    info: string;
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
    clinicalObservations?: string;
    score?: number;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    timeLogs: TimeLog[];
    enableLearnerControls?: boolean;
    rawTelemetry: unknown[];
    behavioralIndicators?: BehavioralIndicator[];
    aiRecommendation: string;
    enableAdaptiveDifficulty: boolean;
    isHandsFree: boolean;
    accuracy: number;
    aiAccuracy: number;
    telemetryAnalysis: TelemetryAnalysis[];
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
    enableLearnerControls?: boolean;
    rawTelemetry: unknown[];
};

export type CreateActivitySessionPayload = {
    startAt: string;
    endAt: string;
    clinicalObservations?: string;
    durationMinutes?: number;
    student: number;
    activity: string;
};

export type UpdatectivitySessionPayload = {
    startAt?: string;
    endAt?: string;
    actualStartAt?: string | null;
    actualEndAt?: string | null;
    clinicalObservations?: string;
    durationMinutes?: number;
    activitySessionStatus?: ActivitySessionStatus;
    score?: number;
    rawTelemetry?: unknown[];
    timeLogs?: TimeLog[];
    enableLearnerControls?: boolean;
};
