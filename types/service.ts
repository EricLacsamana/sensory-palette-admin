import { ClinicalSpecialty } from './clinical';

export interface ServiceResponse {
    id: number;
    documentId: string;
    name: string; // e.g., "Sensory Integration Session"
    category: ClinicalSpecialty; // e.g., "OT"
    durationMinutes: number; // Standard length
    description?: string;
    baseRate?: number; // Standard billing fee
    banner?: {
        url: string;
        formats?: any;
    };
    createdAt: string;
    updatedAt: string;
}

/**
 * Payload for Admin-side Service Creation
 */
export interface CreateServicePayload {
    name: string;
    category: ClinicalSpecialty;
    durationMinutes: number;
    description?: string;
    baseRate?: number;
    banner?: number | string; // Strapi Media ID
}

export type UpdateServicePayload = Partial<CreateServicePayload>;
