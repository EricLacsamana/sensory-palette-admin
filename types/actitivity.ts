import { StrapiMedia } from '.';
import { Category } from './categories';

export interface Activity {
    id: number;
    documentId: string;
    activityId: string;
    name: string;
    description?: string;
    masteryThreshold: number;
    padConfiguration?: Record<string, unknown>;
    activityStatus: 'active' | 'disabled' | 'coming_soon';
    durationMinutes: number;
    categories?: Category[];
    activityUrl?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    banner?: StrapiMedia;
    activityType: string;
}

// // Helper to represent just the attributes for Partial usage
// export type ActivityAttributes = Omit<Activity, 'documentId'>;

/**
 * Interface for the Planning Timeline
 * Extended to handle Activity vs Break logic explicitly
 */
export interface ActivityEntry extends Partial<Activity> {
    // Identity
    instanceId: string;
    id?: number;

    // UI State
    isLocked: boolean;
    imageUrl?: string | null;

    // Type Logic
    isBreak: boolean; // Required now to avoid undefined checks
    breakType?: 'rest' | 'short' | 'long'; // Optional: extend what kind of break it is
    // Fallback display
    name?: string; // Required so the UI always has a label
    durationMinutes: number; // Required for timeline calculations
}
