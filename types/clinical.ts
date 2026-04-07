/**
 * Professional Clinical Specialties / Departments
 * Used for both Therapist profiles and Service categorization.
 */
export type ClinicalSpecialty =
    | 'OT' // Occupational Therapist
    | 'BCBA' // Board Certified Behavior Analyst
    | 'RBT' // Registered Behavior Technician
    | 'SLP' // Speech-Language Pathologist
    | 'PT' // Physical Therapist
    | 'LCSW' // Licensed Clinical Social Worker
    | 'Psychologist';

/**
 * Standard Appointment Lifecycle
 */
export type AppointmentStatus =
    | 'pending' // Scheduled
    | 'in_progress' // Session active
    | 'completed' // Success
    | 'cancelled' // Voided
    | 'no_show' // Patient missed
    | 'reschedule'; // Needs moving
