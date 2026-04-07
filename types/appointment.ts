import { UserResponse } from '.';
import { ActivitySessionResponse } from './activitiy-session';
import { AppointmentStatus } from './clinical';
import { ServiceResponse } from './service';

export interface AppointmentResponse {
    id: number;
    documentId: string;
    startAt: string; // ISO Date
    endAt: string; // ISO Date
    actualStartAt?: string;
    actualEndAt?: string;
    appointmentStatus: AppointmentStatus;
    internalNotes?: string;

    // Relations
    service?: ServiceResponse;
    student?: UserResponse; // Patient
    therapist?: UserResponse; // Provider

    createdAt: string;
    updatedAt: string;
    activitySessions?: ActivitySessionResponse[]; // Populated when fetching an appointment with its sessions
}

/**
 * Entry type for the Frontend Timeline State logic
 */
export interface AppointmentEntry extends Partial<AppointmentResponse> {
    instanceId: string;
    type: 'appointment' | 'gap';
    isLocked: boolean;
    hasConflict?: boolean;
    conflictReason?: string;
    durationMinutes: number;
}

/**
 * API Payloads for Creation/Updating
 */
export interface CreateAppointmentPayload {
    startAt: string;
    endAt: string;
    appointmentStatus: AppointmentStatus;
    service: string | number; // DocumentId
    student: string | number; // User ID
    therapist: string | number; // User ID
    internalNotes?: string;
}

export interface UpdateAppointmentPayload extends Partial<CreateAppointmentPayload> {
    actualStartAt?: string;
    actualEndAt?: string;
}
