'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    UserCircle,
    Stethoscope,
    CalendarDays,
    Clock,
    CheckCircle2,
    Loader2,
    Activity,
    X,
    Pencil,
    AlertCircle,
    Sparkles,
    ChevronLeft,
    DollarSign,
    CalendarClock,
    ArrowRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import {
    useSearchParams,
    useRouter,
    usePathname,
    useParams,
} from 'next/navigation';
import {
    useQuery,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';

import {
    createAppointment,
    updateAppointment,
    getAppointments,
    getAppointment,
} from '@/api/service-appointments';
import { getStudent, getStudents } from '@/api/students';
import { getTherapists } from '@/api/therapist';
import { getServices } from '@/api/service-appointments';
import { UserResponse } from '@/types';
import { ServiceResponse } from '@/types/service';
import {
    AppointmentEntry,
    CreateAppointmentPayload,
    UpdateAppointmentPayload,
    AppointmentResponse,
} from '@/types/appointment';
import { FormatService } from '@/utils/helpers';
import { SpecialtyBadge } from './components/SpecialityBadge';
import { cn } from '@/lib/utils';

const MAX_APPOINTMENTS_PER_DAY =
    Number(process.env.NEXT_PUBLIC_MAX_APPOINTMENTS_PER_DAY) || 9;

// --- UTILITY HOOK: Debounce ---
function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 300);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

// --- FORM TYPES ---
interface AppointmentFormValues {
    studentId: number | null;
    service: ServiceResponse | null;
    therapistId: number | null;
    date: string;
    time: string;
}

// --- SUMMARY TIMELINE ITEM ---
const SummaryItem = React.memo(
    ({
        stepNum,
        currentStep,
        icon: Icon,
        title,
        value,
        subValue,
        onEdit,
        isLocked,
    }: any) => {
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;
        const canEdit = isCompleted && !isLocked;

        return (
            <div className={`relative ${stepNum === 4 ? '' : 'pb-6 sm:pb-8'}`}>
                {stepNum !== 4 && (
                    <div className="absolute left-[19px] top-[30px] -bottom-[8px] w-[2px] z-0">
                        <div
                            className={cn(
                                'h-full w-full transition-colors duration-500',
                                isCompleted ? 'bg-indigo-500' : 'bg-slate-200',
                            )}
                        />
                    </div>
                )}
                <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                    <div
                        className={cn(
                            'h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 shrink-0 shadow-sm bg-white relative z-10',
                            isActive
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50'
                                : isCompleted
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-200 text-slate-400',
                        )}
                    >
                        {isCompleted ? (
                            <CheckCircle2 size={18} strokeWidth={3} />
                        ) : (
                            <Icon size={18} />
                        )}
                    </div>
                    <div className="flex flex-1 items-start justify-between group pt-2.5">
                        <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                            <span
                                className={cn(
                                    'text-sm font-bold tracking-tight transition-colors w-fit',
                                    isActive
                                        ? 'text-indigo-950'
                                        : isCompleted
                                          ? 'text-slate-900'
                                          : 'text-slate-400',
                                    canEdit
                                        ? 'cursor-pointer hover:text-indigo-600'
                                        : 'cursor-default',
                                )}
                                onClick={() => canEdit && onEdit(stepNum)}
                            >
                                {title}
                            </span>
                            <AnimatePresence mode="wait">
                                {value && (isCompleted || stepNum === 4) && (
                                    <motion.div
                                        key="value"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="flex flex-col pr-2 mt-0.5"
                                    >
                                        <p className="text-xs font-semibold text-indigo-600 truncate">
                                            {value}
                                        </p>
                                        {subValue && (
                                            <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                                                {subValue}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(stepNum)}
                                className="p-1.5 mt-[-4px] text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 md:group-hover:opacity-100"
                            >
                                <Pencil size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    },
);
SummaryItem.displayName = 'SummaryItem';

// --- MAIN MODAL COMPONENT ---
export const AppointmentSchedulingModal = ({
    onClose,
}: {
    onClose?: () => void;
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = useParams();
    const queryClient = useQueryClient();

    // URL Params parsing
    const urlStudentId = useMemo(() => {
        const id = params?.id || searchParams.get('studentId');
        return id ? Number(id) : null;
    }, [params, searchParams]);

    const urlAppointmentId = useMemo(() => {
        return searchParams.get('appointmentId') || null;
    }, [searchParams]);

    const urlDate = useMemo(() => {
        return searchParams.get('selectedDate') || '';
    }, [searchParams]);

    // Fetch existing appointment if URL param exists
    const { data: fetchedAppointment, isLoading: isLoadingFetchedAppointment } =
        useQuery({
            queryKey: [
                'appointment',
                urlAppointmentId,
                {
                    populate: {
                        service: { populate: '*' },
                        therapist: { populate: '*' },
                        student: { populate: '*' },
                    },
                },
            ],
            queryFn: getAppointment,
            enabled: !!urlAppointmentId,
        });

    const activeAppointment = fetchedAppointment;
    const isRescheduling = !!urlAppointmentId;

    // --- LOCAL STATE ---
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(
        urlStudentId && !isRescheduling ? 2 : 1,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [confirmClose, setConfirmClose] = useState(false);

    // --- RHF SETUP ---
    const {
        watch,
        setValue,
        getValues,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<AppointmentFormValues>({
        defaultValues: {
            studentId: urlStudentId,
            service: null,
            therapistId: null,
            date: urlDate || '',
            time: '',
        },
    });

    // 1. Force Sync form Date if URL Param changes (Fixes Next.js hydration delay)
    useEffect(() => {
        if (urlDate && !isRescheduling) {
            if (getValues('date') !== urlDate) {
                setValue('date', urlDate);
                setValue('time', '');
            }
        }
    }, [urlDate, isRescheduling, setValue, getValues]);

    // 2. Sync React Hook Form if the appointment was fetched dynamically from the URL param
    useEffect(() => {
        if (fetchedAppointment) {
            setValue('studentId', fetchedAppointment.student?.id || null);
            setValue('service', fetchedAppointment.service || null);
            setValue('therapistId', fetchedAppointment.therapist?.id || null);

            if (fetchedAppointment.startAt) {
                const d = new Date(fetchedAppointment.startAt);
                setValue(
                    'date',
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                );
                setValue(
                    'time',
                    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
                );
            }
            setStep(4);
        }
    }, [fetchedAppointment, setValue]);

    const studentId = watch('studentId');
    const selectedService = watch('service');
    const therapistId = watch('therapistId');
    const selectedDate = watch('date');
    const selectedTime = watch('time');

    // --- CHANGE DETECTION LOGIC ---
    const hasChanges = useMemo(() => {
        if (!isRescheduling || !activeAppointment) return true; // Always true for new appointments

        const originalDate = new Date(activeAppointment.startAt);
        const origDateStr = `${originalDate.getFullYear()}-${String(originalDate.getMonth() + 1).padStart(2, '0')}-${String(originalDate.getDate()).padStart(2, '0')}`;
        const origTimeStr = `${String(originalDate.getHours()).padStart(2, '0')}:${String(originalDate.getMinutes()).padStart(2, '0')}`;

        return (
            selectedDate !== origDateStr ||
            selectedTime !== origTimeStr ||
            studentId !== activeAppointment.student?.id ||
            therapistId !== activeAppointment.therapist?.id ||
            selectedService?.id !== activeAppointment.service?.id
        );
    }, [
        isRescheduling,
        activeAppointment,
        selectedDate,
        selectedTime,
        studentId,
        therapistId,
        selectedService,
    ]);

    const isDirty = useMemo(() => {
        if (isRescheduling) return hasChanges;
        return !!(
            studentId ||
            selectedService ||
            therapistId ||
            selectedDate ||
            selectedTime
        );
    }, [
        isRescheduling,
        hasChanges,
        studentId,
        selectedService,
        therapistId,
        selectedDate,
        selectedTime,
    ]);

    // --- QUERIES ---
    const {
        data: studentsList = [],
        isFetching: isFetchingStudents,
        isLoading: isInitialLoadingStudents,
    } = useQuery({
        queryKey: ['students', debouncedSearchQuery],
        queryFn: getStudents,
        enabled: step === 1,
        placeholderData: keepPreviousData,
    });

    const { data: student } = useQuery({
        queryKey: ['student', studentId],
        queryFn: getStudent,
        enabled: !!studentId,
        initialData: activeAppointment?.student,
    });

    const {
        data: servicesList = [],
        isFetching: isFetchingServices,
        isLoading: isInitialLoadingServices,
    } = useQuery({
        queryKey: ['services', { populate: '*' }],
        queryFn: getServices,
        enabled: step === 2,
        placeholderData: keepPreviousData,
    });

    const {
        data: therapistList = [],
        isFetching: isFetchingTherapists,
        isLoading: isInitialLoadingTherapists,
    } = useQuery({
        queryKey: ['therapists', { searchQuery: debouncedSearchQuery }],
        queryFn: getTherapists,
        enabled: step === 3 || step === 4,
        placeholderData: keepPreviousData,
    });

    const startOfDayIso = selectedDate
        ? new Date(`${selectedDate}T00:00:00.000`).toISOString()
        : '';
    const endOfDayIso = selectedDate
        ? new Date(`${selectedDate}T23:59:59.999`).toISOString()
        : '';

    const {
        data: therapistAppointments = [],
        isFetching: isFetchingTherapistSlots,
    } = useQuery({
        queryKey: [
            'appointments',
            { therapistId, startAt: startOfDayIso, endAt: endOfDayIso },
        ],
        queryFn: getAppointments,
        enabled: step === 4 && !!selectedDate && !!therapistId,
    });

    const {
        data: studentAppointments = [],
        isFetching: isFetchingStudentSlots,
    } = useQuery({
        queryKey: [
            'appointments',
            { studentId, startAt: startOfDayIso, endAt: endOfDayIso },
        ],
        queryFn: getAppointments,
        enabled: step === 4 && !!selectedDate && !!studentId,
    });

    // --- BUSINESS LOGIC ---
    const activeAppointmentsCount = useMemo(() => {
        if (!therapistAppointments || !Array.isArray(therapistAppointments))
            return 0;
        // Exclude the appointment currently being rescheduled so it doesn't count against the limit
        return therapistAppointments.filter(
            (app: AppointmentEntry) =>
                app.appointmentStatus !== 'cancelled' &&
                app.id !== activeAppointment?.id,
        ).length;
    }, [therapistAppointments, activeAppointment]);

    const isMaxAppointmentsReached =
        activeAppointmentsCount >= MAX_APPOINTMENTS_PER_DAY;
    const isFetchingSlots = isFetchingTherapistSlots || isFetchingStudentSlots;

    const availableSlots = useMemo(() => {
        if (!selectedDate || !selectedService || isMaxAppointmentsReached)
            return [];
        const slots: string[] = [];
        const clinicStartHour = 8,
            clinicEndHour = 17;

        const serviceDuration = selectedService.durationMinutes || 60;

        const intervalMinutes = serviceDuration;

        const currentSlot = new Date(`${selectedDate}T00:00:00`);
        currentSlot.setHours(clinicStartHour, 0, 0, 0);
        const endOfDay = new Date(`${selectedDate}T00:00:00`);
        endOfDay.setHours(clinicEndHour, 0, 0, 0);

        const now = new Date();

        const tAppts = Array.isArray(therapistAppointments)
            ? therapistAppointments
            : [];
        const sAppts = Array.isArray(studentAppointments)
            ? studentAppointments
            : [];

        // Exclude cancelled AND exclude the appointment we are currently rescheduling
        const activeConflicts = [...tAppts, ...sAppts].filter(
            (app: AppointmentEntry) =>
                app.appointmentStatus !== 'cancelled' &&
                app.id !== activeAppointment?.id,
        );

        const bookedRanges = activeConflicts.map((app) => ({
            start: new Date(app.startAt).getTime(),
            end: new Date(app.endAt).getTime(),
        }));

        while (currentSlot < endOfDay) {
            const slotStartMs = currentSlot.getTime();
            const slotEndMs = slotStartMs + serviceDuration * 60000;
            if (slotEndMs > endOfDay.getTime()) break;

            const isPast = slotStartMs <= now.getTime();
            const hasCollision = bookedRanges.some(
                (range) => slotStartMs < range.end && slotEndMs > range.start,
            );

            if (!isPast && !hasCollision) {
                slots.push(
                    `${currentSlot.getHours().toString().padStart(2, '0')}:${currentSlot.getMinutes().toString().padStart(2, '0')}`,
                );
            }
            currentSlot.setMinutes(currentSlot.getMinutes() + intervalMinutes);
        }
        return slots;
    }, [
        selectedDate,
        selectedService,
        therapistAppointments,
        studentAppointments,
        isMaxAppointmentsReached,
        activeAppointment,
    ]);

    // Fallbacks for UI
    const selectedTherapist = useMemo(
        () =>
            therapistList.find((t: UserResponse) => t.id === therapistId) ||
            activeAppointment?.therapist,
        [therapistList, therapistId, activeAppointment],
    );

    const displayedStudent = useMemo(() => {
        return (
            studentsList.find((s: UserResponse) => s.id === studentId) ||
            student ||
            activeAppointment?.student
        );
    }, [studentsList, studentId, student, activeAppointment]);

    const displayedService = selectedService || activeAppointment?.service;

    const filteredStudents = useMemo(
        () =>
            studentsList.filter(
                (s: UserResponse) =>
                    s.fullName
                        ?.toLowerCase()
                        .includes(debouncedSearchQuery.toLowerCase()) ||
                    s.id?.toString().includes(debouncedSearchQuery),
            ),
        [studentsList, debouncedSearchQuery],
    );
    const filteredServices = useMemo(
        () =>
            servicesList.filter(
                (s: ServiceResponse) =>
                    s.name
                        .toLowerCase()
                        .includes(debouncedSearchQuery.toLowerCase()) ||
                    s.category
                        .toLowerCase()
                        .includes(debouncedSearchQuery.toLowerCase()),
            ),
        [servicesList, debouncedSearchQuery],
    );

    // --- HANDLERS ---
    const handleClose = () => {
        const p = new URLSearchParams(searchParams.toString());
        p.delete('isAppointmentModalOpen');
        p.delete('appointmentId'); // Clean up URL parameter
        p.delete('studentId');
        router.replace(`${pathname}?${p.toString()}`);
        if (onClose) onClose();
    };

    const handleCloseRequest = () => {
        if (isDirty) {
            setConfirmClose(true);
        } else {
            handleClose();
        }
    };

    const goToStep = (newStep: 1 | 2 | 3 | 4 | 5) => {
        setSearchQuery('');
        setStep(newStep);
    };

    const onSubmit = async (data: AppointmentFormValues) => {
        if (
            !data.studentId ||
            !data.service ||
            !data.therapistId ||
            !data.date ||
            !data.time
        )
            return;
        try {
            const startDateTime = new Date(`${data.date}T${data.time}`);
            const endDateTime = new Date(
                startDateTime.getTime() + data.service.durationMinutes * 60000,
            );

            if (isRescheduling && activeAppointment?.documentId) {
                // UPDATE EXISTING
                const payload: UpdateAppointmentPayload = {
                    startAt: startDateTime.toISOString(),
                    endAt: endDateTime.toISOString(),
                    service: data.service.documentId,
                    student: data.studentId,
                    therapist: data.therapistId,
                };
                await updateAppointment(activeAppointment.documentId, payload);
                toast.success('Appointment rescheduled successfully!');
            } else {
                // CREATE NEW
                const payload: CreateAppointmentPayload = {
                    startAt: startDateTime.toISOString(),
                    endAt: endDateTime.toISOString(),
                    appointmentStatus: 'pending',
                    service: data.service.documentId,
                    student: data.studentId,
                    therapist: data.therapistId,
                };
                await createAppointment(payload as any);
                toast.success('Appointment booked successfully!');
            }

            await queryClient.invalidateQueries({ queryKey: ['appointments'] });
            handleClose();
        } catch (error) {
            toast.error(
                isRescheduling
                    ? 'Failed to reschedule appointment.'
                    : 'Failed to book appointment.',
            );
        }
    };

    const formatTimeSlot = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const d = new Date();
        d.setHours(Number(hours), Number(minutes));
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Calculate disabled states for the bottom button
    const isBookReady =
        selectedDate &&
        selectedTime &&
        !isMaxAppointmentsReached &&
        !isSubmitting;
    const isConfirmDisabled =
        !isBookReady ||
        isSubmitting ||
        (isRescheduling && !hasChanges && step === 5);

    // Dynamic Button Text
    const getButtonText = () => {
        if (isSubmitting) return 'Confirming...';
        if (step < 5) return 'Review Details';
        if (isRescheduling && !hasChanges) return 'No Changes Made';
        if (isRescheduling) return 'Confirm Reschedule';
        return 'Confirm Booking';
    };

    // --- REUSABLE SEARCH INPUT ---
    const renderSearchInput = (placeholder: string, isFetching: boolean) => (
        <div className="relative mb-3 sm:mb-6 shrink-0 group">
            <Search
                className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={18}
            />
            <input
                type="text"
                className="w-full pl-10 sm:pl-12 pr-12 py-2.5 sm:py-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all shadow-sm outline-none"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                {isFetching ? (
                    <Loader2
                        className="animate-spin text-indigo-500"
                        size={18}
                    />
                ) : searchQuery ? (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-300 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={16} />
                    </button>
                ) : null}
            </div>
        </div>
    );

    // Initial load block
    if (urlAppointmentId && isLoadingFetchedAppointment) {
        return (
            <Dialog open onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="[&>button]:hidden !max-w-[1100px] w-full h-[95dvh] sm:h-[85vh] p-0 flex items-center justify-center bg-white rounded-none sm:rounded-3xl border-none relative">
                    <DialogTitle className="sr-only">
                        Loading Appointment
                    </DialogTitle>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="absolute top-4 right-4 sm:top-6 sm:right-8 text-slate-400 hover:text-slate-900 rounded-full h-9 w-9 sm:h-10 sm:w-10 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm z-50"
                    >
                        <X size={18} />
                    </Button>
                    <div className="flex flex-col items-center gap-4">
                        <Loader2
                            className="animate-spin text-indigo-500"
                            size={48}
                        />
                        <p className="text-slate-500 font-medium animate-pulse">
                            Loading appointment details...
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open onOpenChange={(open) => !open && handleCloseRequest()}>
            {/* [&>button]:hidden prevents Radix UI's default close button from rendering and overlapping */}
            <DialogContent className="[&>button]:hidden !max-w-[1100px] w-full h-[95dvh] sm:h-[85vh] p-0 flex flex-row bg-white overflow-hidden rounded-none sm:rounded-3xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] border-none">
                <DialogTitle className="sr-only">
                    {isRescheduling
                        ? 'Reschedule Appointment'
                        : 'Book Appointment'}
                </DialogTitle>
                <Toaster position="top-right" richColors theme="light" />

                {/* --- DISCARD CONFIRMATION OVERLAY --- */}
                <AnimatePresence>
                    {confirmClose && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-[90%] text-center"
                            >
                                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-6 h-6 text-rose-600" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">
                                    Discard Changes?
                                </h3>
                                <p className="text-sm text-slate-500 mb-6 font-medium">
                                    You have unsaved changes. Are you sure you
                                    want to discard them and close?
                                </p>
                                <div className="flex gap-3 justify-center w-full">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 font-bold"
                                        onClick={() => setConfirmClose(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="flex-1 font-bold"
                                        onClick={handleClose}
                                    >
                                        Discard
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- SIDEBAR --- */}
                <aside className="w-[320px] bg-white border-r border-slate-200 flex-col hidden md:flex shrink-0 relative z-30 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.03)]">
                    <div className="p-8 pb-8 shrink-0">
                        <div
                            className={cn(
                                'h-12 w-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg',
                                isRescheduling
                                    ? 'bg-amber-500 shadow-amber-200'
                                    : 'bg-indigo-600 shadow-indigo-200',
                            )}
                        >
                            {isRescheduling ? (
                                <CalendarClock size={24} />
                            ) : (
                                <CalendarDays size={24} />
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Scheduler
                        </h2>
                        <p
                            className={cn(
                                'text-xs font-bold mt-1 uppercase tracking-widest',
                                isRescheduling
                                    ? 'text-amber-500'
                                    : 'text-slate-400',
                            )}
                        >
                            {isRescheduling
                                ? 'Reschedule Appointment'
                                : 'New Appointment'}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar min-h-0">
                        <SummaryItem
                            stepNum={1}
                            currentStep={step}
                            icon={UserCircle}
                            title="Learner"
                            value={displayedStudent?.fullName}
                            subValue={displayedStudent?.diagnosis}
                            onEdit={goToStep}
                            isLocked={isRescheduling}
                        />
                        <SummaryItem
                            stepNum={2}
                            currentStep={step}
                            icon={Activity}
                            title="Service"
                            value={displayedService?.name}
                            subValue={
                                displayedService?.durationMinutes
                                    ? `${displayedService.durationMinutes} min`
                                    : undefined
                            }
                            onEdit={goToStep}
                            isLocked={isRescheduling}
                        />
                        <SummaryItem
                            stepNum={3}
                            currentStep={step}
                            icon={Stethoscope}
                            title="Therapist"
                            value={selectedTherapist?.fullName}
                            subValue={selectedTherapist?.specialty}
                            onEdit={goToStep}
                            isLocked={isRescheduling}
                        />
                        <SummaryItem
                            stepNum={4}
                            currentStep={step}
                            icon={Clock}
                            title="Time"
                            value={
                                selectedDate && selectedTime
                                    ? formatTimeSlot(selectedTime)
                                    : null
                            }
                            subValue={
                                selectedDate
                                    ? new Date(
                                          selectedDate + 'T12:00:00',
                                      ).toLocaleDateString(undefined, {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                      })
                                    : undefined
                            }
                            onEdit={goToStep}
                            isLocked={false}
                        />
                    </div>

                    {/* Fixed Sidebar Footer */}
                    <div className="p-6 shrink-0 bg-white border-t border-slate-100 mt-auto">
                        <Button
                            type="button"
                            className={cn(
                                'w-full h-12 lg:h-14 font-bold rounded-xl text-[15px] transition-all duration-300',
                                isBookReady && !isConfirmDisabled
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200',
                            )}
                            onClick={() => {
                                if (step < 5) setStep(5);
                                else handleSubmit(onSubmit)();
                            }}
                            disabled={isConfirmDisabled}
                        >
                            {isSubmitting && (
                                <Loader2
                                    className="animate-spin mr-2"
                                    size={18}
                                />
                            )}
                            {getButtonText()}
                        </Button>
                    </div>
                </aside>

                {/* --- MAIN AREA (Pure White Background for contrast) --- */}
                <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
                    {/* Fixed Header */}
                    <header className="shrink-0 h-14 sm:h-20 px-4 md:px-8 flex items-center justify-between z-20 pointer-events-none absolute top-0 left-0 right-0 w-full">
                        <div className="flex items-center">
                            {/* Mobile Back Button: Hidden on Step 4 if rescheduling to prevent going to Step 3 */}
                            {step > (isRescheduling ? 4 : 1) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => goToStep((step - 1) as any)}
                                    className="md:hidden text-slate-500 hover:text-slate-900 pointer-events-auto bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-full h-9 w-9 mr-2"
                                >
                                    <ChevronLeft size={18} />
                                </Button>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleCloseRequest}
                            className="text-slate-400 hover:text-slate-900 rounded-full h-9 w-9 sm:h-10 sm:w-10 pointer-events-auto bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm"
                        >
                            <X size={18} />
                        </Button>
                    </header>

                    {/* Main Content Wrapper */}
                    <div className="flex-1 flex flex-col min-h-0 px-4 pt-16 pb-20 sm:px-8 sm:pt-20 sm:pb-8 md:px-12 md:py-12 bg-white">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: LEARNER/STUDENT SELECTION */}
                            {step === 1 && !isRescheduling && (
                                <motion.div
                                    key="s1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="w-full max-w-2xl mx-auto flex flex-col h-full"
                                >
                                    <h1 className="shrink-0 text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1 sm:mb-2">
                                        Who is this for?
                                    </h1>
                                    <p className="shrink-0 text-slate-500 mb-3 sm:mb-6 text-xs sm:text-base">
                                        Search and select a learner to begin
                                        scheduling.
                                    </p>

                                    {renderSearchInput(
                                        'Search by name, ID, or diagnosis...',
                                        isFetchingStudents &&
                                            !isInitialLoadingStudents,
                                    )}

                                    <div className="flex-1 overflow-y-auto min-h-0 p-1 -m-1 custom-scrollbar">
                                        {isInitialLoadingStudents ? (
                                            <div className="flex justify-center p-8">
                                                <Loader2
                                                    className="animate-spin text-indigo-400"
                                                    size={32}
                                                />
                                            </div>
                                        ) : filteredStudents.length === 0 ? (
                                            <div className="text-center p-8 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 border-dashed text-slate-400 text-sm">
                                                No learners found matching "
                                                {searchQuery}"
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 pb-4">
                                                {filteredStudents.map(
                                                    (s: UserResponse) => (
                                                        <button
                                                            type="button"
                                                            key={s.id}
                                                            onClick={() => {
                                                                setValue(
                                                                    'studentId',
                                                                    s.id,
                                                                );
                                                                goToStep(2);
                                                            }}
                                                            className={cn(
                                                                'flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 text-left group',
                                                                studentId ===
                                                                    s.id
                                                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 shadow-md scale-[1.01]'
                                                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md',
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'h-10 w-10 sm:h-12 sm:w-12 mt-0.5 rounded-full flex items-center justify-center overflow-hidden shrink-0',
                                                                    studentId ===
                                                                        s.id
                                                                        ? 'bg-white shadow-sm'
                                                                        : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50',
                                                                )}
                                                            >
                                                                {s.profilePicture ? (
                                                                    <img
                                                                        src={FormatService.formatStrapiMedia(
                                                                            s.profilePicture,
                                                                            'thumbnail',
                                                                        )}
                                                                        alt=""
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <UserCircle
                                                                        size={
                                                                            20
                                                                        }
                                                                        className={
                                                                            studentId ===
                                                                            s.id
                                                                                ? 'text-indigo-600'
                                                                                : ''
                                                                        }
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span
                                                                    className={cn(
                                                                        'font-bold truncate text-sm sm:text-base',
                                                                        studentId ===
                                                                            s.id
                                                                            ? 'text-indigo-950'
                                                                            : 'text-slate-900',
                                                                    )}
                                                                >
                                                                    {s.fullName}
                                                                </span>
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 font-medium">
                                                                    {s.age && (
                                                                        <span>
                                                                            {
                                                                                s.age
                                                                            }{' '}
                                                                            yrs
                                                                        </span>
                                                                    )}
                                                                    {s.age &&
                                                                        s.gender && (
                                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                        )}
                                                                    {s.gender && (
                                                                        <span className="capitalize">
                                                                            {
                                                                                s.gender
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {s.diagnosis && (
                                                                    <div className="mt-1 sm:mt-1.5 inline-flex">
                                                                        <span
                                                                            className={cn(
                                                                                'text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md uppercase tracking-wider truncate max-w-full',
                                                                                studentId ===
                                                                                    s.id
                                                                                    ? 'bg-indigo-100 text-indigo-700'
                                                                                    : 'bg-slate-100 text-slate-500',
                                                                            )}
                                                                        >
                                                                            {
                                                                                s.diagnosis
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: CLINICAL SERVICE SELECTION */}
                            {step === 2 && !isRescheduling && (
                                <motion.div
                                    key="s2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="w-full max-w-3xl mx-auto flex flex-col h-full"
                                >
                                    <h1 className="shrink-0 text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1 sm:mb-2">
                                        Select Treatment
                                    </h1>
                                    <p className="shrink-0 text-slate-500 mb-3 sm:mb-6 text-xs sm:text-base">
                                        What service does{' '}
                                        <span className="font-bold text-slate-700">
                                            {displayedStudent?.firstName ||
                                                'the learner'}
                                        </span>{' '}
                                        need?
                                    </p>

                                    {renderSearchInput(
                                        'Search services...',
                                        isFetchingServices &&
                                            !isInitialLoadingServices,
                                    )}

                                    <div className="flex-1 overflow-y-auto min-h-0 p-1 -m-1 custom-scrollbar">
                                        {isInitialLoadingServices ? (
                                            <div className="flex justify-center p-8">
                                                <Loader2
                                                    className="animate-spin text-indigo-400"
                                                    size={32}
                                                />
                                            </div>
                                        ) : filteredServices.length === 0 ? (
                                            <div className="text-center p-8 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 border-dashed text-slate-400 text-sm">
                                                No services found matching "
                                                {searchQuery}"
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 pb-4">
                                                {filteredServices.map(
                                                    (srv: ServiceResponse) => (
                                                        <button
                                                            type="button"
                                                            key={srv.id}
                                                            onClick={() => {
                                                                setValue(
                                                                    'service',
                                                                    srv,
                                                                );
                                                                setValue(
                                                                    'therapistId',
                                                                    null,
                                                                );
                                                                setValue(
                                                                    'time',
                                                                    '',
                                                                );
                                                                goToStep(3);
                                                            }}
                                                            className={cn(
                                                                'p-0 rounded-xl sm:rounded-2xl border transition-all duration-200 text-left group flex flex-col h-full overflow-hidden',
                                                                selectedService?.id ===
                                                                    srv.id
                                                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 shadow-md scale-[1.01]'
                                                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md',
                                                            )}
                                                        >
                                                            {srv.banner && (
                                                                <div className="w-full h-24 sm:h-28 bg-slate-100 shrink-0 overflow-hidden relative">
                                                                    <img
                                                                        src={
                                                                            FormatService.formatStrapiMedia(
                                                                                srv.banner as any,
                                                                                'small',
                                                                            ) ||
                                                                            srv
                                                                                .banner
                                                                                .url
                                                                        }
                                                                        alt={
                                                                            srv.name
                                                                        }
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="p-3 sm:p-5 flex flex-col flex-1 w-full">
                                                                <div className="flex justify-between items-start mb-2 sm:mb-3 w-full">
                                                                    <SpecialtyBadge
                                                                        specialty={
                                                                            srv.category
                                                                        }
                                                                    />
                                                                    <div
                                                                        className={cn(
                                                                            'flex items-center gap-1 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-colors',
                                                                            selectedService?.id ===
                                                                                srv.id
                                                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                                                : 'bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600',
                                                                        )}
                                                                    >
                                                                        <Clock
                                                                            size={
                                                                                10
                                                                            }
                                                                            className="sm:w-3 sm:h-3"
                                                                        />{' '}
                                                                        {
                                                                            srv.durationMinutes
                                                                        }
                                                                        m
                                                                    </div>
                                                                </div>

                                                                <h3
                                                                    className={cn(
                                                                        'font-black text-sm sm:text-base leading-tight transition-colors mb-1',
                                                                        selectedService?.id ===
                                                                            srv.id
                                                                            ? 'text-indigo-950'
                                                                            : 'text-slate-800 group-hover:text-indigo-700',
                                                                    )}
                                                                >
                                                                    {srv.name}
                                                                </h3>

                                                                {srv.description && (
                                                                    <p
                                                                        className={cn(
                                                                            'text-[10px] sm:text-xs line-clamp-2 leading-relaxed mb-2 flex-1',
                                                                            selectedService?.id ===
                                                                                srv.id
                                                                                ? 'text-indigo-900/70'
                                                                                : 'text-slate-500',
                                                                        )}
                                                                    >
                                                                        {
                                                                            srv.description
                                                                        }
                                                                    </p>
                                                                )}

                                                                {srv.baseRate !==
                                                                    undefined && (
                                                                    <div
                                                                        className={cn(
                                                                            'mt-auto pt-1 flex items-center gap-0.5 text-[11px] sm:text-sm font-semibold',
                                                                            selectedService?.id ===
                                                                                srv.id
                                                                                ? 'text-indigo-700'
                                                                                : 'text-slate-400',
                                                                        )}
                                                                    >
                                                                        <DollarSign
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="sm:w-3.5 sm:h-3.5"
                                                                        />
                                                                        <span>
                                                                            {srv.baseRate.toFixed(
                                                                                2,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: PROVIDER SELECTION */}
                            {step === 3 &&
                                selectedService &&
                                !isRescheduling && (
                                    <motion.div
                                        key="s3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="w-full max-w-4xl mx-auto flex flex-col h-full"
                                    >
                                        <h1 className="shrink-0 text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1 sm:mb-2">
                                            Assign Provider
                                        </h1>
                                        <p className="shrink-0 text-slate-500 mb-3 sm:mb-6 text-xs sm:text-base">
                                            Who will administer the{' '}
                                            <span className="font-bold text-slate-700">
                                                {selectedService.name}
                                            </span>
                                            ?
                                        </p>

                                        {renderSearchInput(
                                            'Search providers...',
                                            isFetchingTherapists &&
                                                !isInitialLoadingTherapists,
                                        )}

                                        <div className="flex-1 overflow-y-auto min-h-0 p-1 -m-1 custom-scrollbar">
                                            {isInitialLoadingTherapists ? (
                                                <div className="flex justify-center p-8">
                                                    <Loader2
                                                        className="animate-spin text-indigo-400"
                                                        size={32}
                                                    />
                                                </div>
                                            ) : therapistList.length === 0 ? (
                                                <div className="text-center p-8 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 border-dashed text-slate-400 text-sm">
                                                    No providers found.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 pb-4">
                                                    {therapistList.map(
                                                        (t: UserResponse) => (
                                                            <button
                                                                type="button"
                                                                key={t.id}
                                                                onClick={() => {
                                                                    setValue(
                                                                        'therapistId',
                                                                        t.id,
                                                                    );
                                                                    setValue(
                                                                        'time',
                                                                        '',
                                                                    );
                                                                    goToStep(4);
                                                                }}
                                                                className={cn(
                                                                    'flex flex-row items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 text-left group relative overflow-hidden gap-3',
                                                                    therapistId ===
                                                                        t.id
                                                                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 shadow-md scale-[1.01]'
                                                                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md',
                                                                )}
                                                            >
                                                                {therapistId ===
                                                                    t.id && (
                                                                    <div className="hidden sm:block absolute top-2 right-2 text-indigo-500">
                                                                        <CheckCircle2
                                                                            size={
                                                                                16
                                                                            }
                                                                            className="fill-indigo-100"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-slate-300 overflow-hidden shrink-0 bg-slate-50">
                                                                    {t.profilePicture ? (
                                                                        <img
                                                                            src={FormatService.formatStrapiMedia(
                                                                                t.profilePicture,
                                                                                'thumbnail',
                                                                            )}
                                                                            alt=""
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <Stethoscope
                                                                            size={
                                                                                20
                                                                            }
                                                                            className={
                                                                                therapistId ===
                                                                                t.id
                                                                                    ? 'text-indigo-400'
                                                                                    : ''
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col flex-1 min-w-0">
                                                                    <h3
                                                                        className={cn(
                                                                            'font-black text-sm sm:text-base mb-0.5 truncate w-full',
                                                                            therapistId ===
                                                                                t.id
                                                                                ? 'text-indigo-950'
                                                                                : 'text-slate-900',
                                                                        )}
                                                                    >
                                                                        {
                                                                            t.fullName
                                                                        }
                                                                    </h3>
                                                                    <div className="flex items-center">
                                                                        {t.specialty && (
                                                                            <SpecialtyBadge
                                                                                specialty={
                                                                                    t.specialty
                                                                                }
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                            {/* STEP 4: TIME SELECTION */}
                            {step === 4 && selectedTherapist && (
                                <motion.div
                                    key="s4"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="w-full max-w-3xl mx-auto flex flex-col h-full"
                                >
                                    <h1 className="shrink-0 text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1 sm:mb-2">
                                        {isRescheduling
                                            ? 'Select New Time'
                                            : 'Schedule Time'}
                                    </h1>
                                    <p className="shrink-0 text-slate-500 mb-3 sm:mb-5 text-xs sm:text-base">
                                        Select an available date and time slot
                                        with{' '}
                                        <span className="font-bold text-slate-700">
                                            {selectedTherapist.fullName}
                                        </span>
                                        .
                                    </p>

                                    {/* Highlight banner for Current Schedule context when rescheduling */}
                                    {isRescheduling &&
                                        activeAppointment?.startAt && (
                                            <div className="shrink-0 mb-4 sm:mb-6 bg-amber-50 border border-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                    <CalendarClock size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider mb-0.5">
                                                        Current Schedule
                                                    </p>
                                                    <p className="text-xs sm:text-sm font-bold text-amber-900">
                                                        {new Date(
                                                            activeAppointment.startAt,
                                                        ).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                weekday:
                                                                    'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}{' '}
                                                        at{' '}
                                                        {new Date(
                                                            activeAppointment.startAt,
                                                        ).toLocaleTimeString(
                                                            'en-US',
                                                            {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true,
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                    {/* The Card Wrapper - allows internal scrolling for slots */}
                                    <div className="bg-slate-50/50 sm:bg-white p-3 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200 shadow-sm sm:shadow-lg sm:shadow-slate-200/40 flex flex-col flex-1 min-h-0">
                                        <div className="shrink-0 mb-4 sm:mb-6">
                                            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-3 block">
                                                1. Select Date
                                            </label>
                                            <div className="relative group">
                                                <CalendarDays className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-indigo-500 group-hover:scale-110 transition-transform w-4 h-4 sm:w-5 sm:h-5" />
                                                <input
                                                    type="date"
                                                    min={new Date().toLocaleDateString(
                                                        'en-CA',
                                                    )}
                                                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3.5 bg-white sm:bg-slate-50 border-0 ring-1 ring-slate-200 hover:ring-slate-300 rounded-lg sm:rounded-xl text-sm sm:text-lg font-bold focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer outline-none text-slate-700 shadow-sm sm:shadow-none"
                                                    value={selectedDate || ''}
                                                    onChange={(e) => {
                                                        const newDate =
                                                            e.target.value;
                                                        setValue(
                                                            'date',
                                                            newDate,
                                                        );
                                                        setValue('time', '');

                                                        // Update the URL secretly so the underlying appts page follows along
                                                        const p =
                                                            new URLSearchParams(
                                                                searchParams.toString(),
                                                            );
                                                        p.set(
                                                            'selectedDate',
                                                            newDate,
                                                        );
                                                        router.replace(
                                                            `${pathname}?${p.toString()}`,
                                                            { scroll: false },
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-200 sm:bg-slate-100 w-full mb-4 sm:mb-6 shrink-0" />

                                        <div className="flex flex-col flex-1 min-h-0">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4 shrink-0">
                                                <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block">
                                                    2. Select Time
                                                </label>
                                                {selectedDate && (
                                                    <span
                                                        className={cn(
                                                            'text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border bg-white sm:bg-slate-50',
                                                            isMaxAppointmentsReached
                                                                ? 'text-rose-600 border-rose-100'
                                                                : 'text-slate-500 border-slate-200',
                                                        )}
                                                    >
                                                        {
                                                            activeAppointmentsCount
                                                        }{' '}
                                                        /{' '}
                                                        {
                                                            MAX_APPOINTMENTS_PER_DAY
                                                        }{' '}
                                                        Appts
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 overflow-y-auto min-h-0 p-1 -m-1 custom-scrollbar">
                                                {isFetchingSlots ? (
                                                    <div className="h-24 sm:h-32 flex items-center justify-center bg-white sm:bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100">
                                                        <Loader2
                                                            className="animate-spin text-indigo-400"
                                                            size={24}
                                                        />
                                                    </div>
                                                ) : !selectedDate ? (
                                                    <div className="h-24 sm:h-32 flex flex-col items-center justify-center text-slate-400 bg-white sm:bg-slate-50 rounded-lg sm:rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
                                                        <Sparkles className="mb-1.5 text-slate-300 w-5 h-5 sm:w-6 sm:h-6" />
                                                        <p className="font-medium text-xs sm:text-sm">
                                                            Pick a date above to
                                                            view slots.
                                                        </p>
                                                    </div>
                                                ) : isMaxAppointmentsReached ? (
                                                    <div className="h-24 sm:h-32 flex flex-col items-center justify-center text-rose-600 bg-white sm:bg-rose-50 rounded-lg sm:rounded-xl border border-rose-100 p-4 text-center">
                                                        <AlertCircle className="mb-1.5 w-5 h-5 sm:w-7 sm:h-7" />
                                                        <p className="font-black text-sm sm:text-base">
                                                            Provider Fully
                                                            Booked
                                                        </p>
                                                    </div>
                                                ) : availableSlots.length ===
                                                  0 ? (
                                                    <div className="h-24 sm:h-32 flex flex-col items-center justify-center text-slate-500 bg-white sm:bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
                                                        <Clock className="mb-1.5 text-slate-300 w-5 h-5 sm:w-7 sm:h-7" />
                                                        <p className="font-medium text-xs sm:text-sm text-slate-600">
                                                            No available slots.
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs font-medium mt-0.5 text-slate-400">
                                                            Either the provider
                                                            or the learner is
                                                            busy.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
                                                        {availableSlots.map(
                                                            (slot) => (
                                                                <button
                                                                    type="button"
                                                                    key={slot}
                                                                    onClick={() =>
                                                                        setValue(
                                                                            'time',
                                                                            slot,
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        'h-10 sm:h-12 rounded-lg text-[11px] sm:text-sm font-black border-2 transition-all duration-200',
                                                                        selectedTime ===
                                                                            slot
                                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105'
                                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600',
                                                                    )}
                                                                >
                                                                    {formatTimeSlot(
                                                                        slot,
                                                                    )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: REVIEW & CONFIRM */}
                            {step === 5 && (
                                <motion.div
                                    key="s5"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="w-full max-w-3xl mx-auto flex flex-col h-full"
                                >
                                    <h1 className="shrink-0 text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1 sm:mb-2">
                                        Review Details
                                    </h1>
                                    <p className="shrink-0 text-slate-500 mb-3 sm:mb-6 text-xs sm:text-base">
                                        Please review and confirm the
                                        appointment details below.
                                    </p>

                                    <div className="flex-1 overflow-y-auto min-h-0 p-1 -m-1 custom-scrollbar">
                                        <div className="bg-slate-50/50 sm:bg-white p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-200 shadow-sm sm:shadow-lg sm:shadow-slate-200/40 flex flex-col gap-4 sm:gap-6">
                                            {/* Error Boundary: Catch if user tries to reschedule without making changes */}
                                            {isRescheduling && !hasChanges && (
                                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
                                                    <AlertCircle
                                                        className="text-rose-500 shrink-0 mt-0.5"
                                                        size={20}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-rose-800">
                                                            No Changes Detected
                                                        </p>
                                                        <p className="text-xs font-medium text-rose-600 mt-1">
                                                            You haven't made any
                                                            modifications to the
                                                            existing
                                                            appointment. Please
                                                            change the time,
                                                            date, or details to
                                                            proceed.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dynamic Date/Time Display based on Mode */}
                                            {isRescheduling &&
                                            activeAppointment?.startAt ? (
                                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                    {/* Original Schedule - Grayed out and crossed out */}
                                                    <div className="flex-1 flex flex-col justify-center bg-slate-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 opacity-60 grayscale relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-3 opacity-20">
                                                            <CalendarClock
                                                                size={64}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">
                                                            Previous Schedule
                                                        </p>
                                                        <p className="text-sm sm:text-base font-black text-slate-700 line-through relative z-10">
                                                            {new Date(
                                                                activeAppointment.startAt,
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    weekday:
                                                                        'short',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                },
                                                            )}
                                                        </p>
                                                        <p className="text-xs font-bold text-slate-500 mt-0.5 line-through relative z-10">
                                                            at{' '}
                                                            {new Date(
                                                                activeAppointment.startAt,
                                                            ).toLocaleTimeString(
                                                                'en-US',
                                                                {
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                    hour12: true,
                                                                },
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Visual Arrow Separator */}
                                                    <div className="hidden sm:flex items-center justify-center shrink-0 text-slate-300">
                                                        <ArrowRight size={24} />
                                                    </div>

                                                    {/* New Schedule Highlight */}
                                                    <div className="flex-1 flex flex-col justify-center bg-indigo-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-indigo-200 relative overflow-hidden shadow-inner">
                                                        <div className="absolute top-0 right-0 p-3 opacity-10 text-indigo-500">
                                                            <CalendarDays
                                                                size={64}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 relative z-10">
                                                            New Schedule
                                                        </p>
                                                        <p className="text-sm sm:text-base font-black text-indigo-950 relative z-10">
                                                            {new Date(
                                                                selectedDate +
                                                                    'T12:00:00', // Forces local parsing of YYYY-MM-DD
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    weekday:
                                                                        'short',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                },
                                                            )}
                                                        </p>
                                                        <p className="text-xs font-bold text-indigo-600 mt-0.5 relative z-10">
                                                            at{' '}
                                                            {formatTimeSlot(
                                                                selectedTime,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 bg-indigo-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-indigo-100">
                                                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                        <CalendarDays
                                                            size={28}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-wider mb-0.5">
                                                            Scheduled for
                                                        </p>
                                                        <p className="text-sm sm:text-lg font-black text-indigo-950">
                                                            {new Date(
                                                                selectedDate +
                                                                    'T12:00:00', // Forces local parsing of YYYY-MM-DD
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    weekday:
                                                                        'long',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                },
                                                            )}
                                                        </p>
                                                        <p className="text-xs sm:text-sm font-bold text-indigo-700 mt-0.5">
                                                            at{' '}
                                                            {formatTimeSlot(
                                                                selectedTime,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Student Summary Node */}
                                                <div className="p-4 border border-slate-200 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-start gap-3">
                                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {displayedStudent?.profilePicture ? (
                                                            <img
                                                                src={FormatService.formatStrapiMedia(
                                                                    displayedStudent.profilePicture,
                                                                    'thumbnail',
                                                                )}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <UserCircle
                                                                size={24}
                                                                className="text-slate-400"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                            Student
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {
                                                                displayedStudent?.fullName
                                                            }
                                                        </p>
                                                        {displayedStudent?.diagnosis && (
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {
                                                                    displayedStudent.diagnosis
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Provider Summary Node */}
                                                <div className="p-4 border border-slate-200 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-start gap-3">
                                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {selectedTherapist?.profilePicture ? (
                                                            <img
                                                                src={FormatService.formatStrapiMedia(
                                                                    selectedTherapist.profilePicture,
                                                                    'thumbnail',
                                                                )}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <Stethoscope
                                                                size={24}
                                                                className="text-slate-400"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                            Provider
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {
                                                                selectedTherapist?.fullName
                                                            }
                                                        </p>
                                                        {selectedTherapist?.specialty && (
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {
                                                                    selectedTherapist.specialty
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Treatment Summary Node */}
                                            <div className="p-0 border border-slate-200 rounded-xl sm:rounded-2xl bg-white shadow-sm flex flex-col overflow-hidden">
                                                {displayedService?.banner && (
                                                    <div className="w-full h-20 sm:h-24 bg-slate-100 overflow-hidden">
                                                        <img
                                                            src={
                                                                FormatService.formatStrapiMedia(
                                                                    displayedService.banner as any,
                                                                    'small',
                                                                ) ||
                                                                displayedService
                                                                    .banner.url
                                                            }
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-4 sm:p-5">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                        Treatment
                                                    </p>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <p className="text-sm sm:text-base font-black text-slate-900">
                                                                {
                                                                    displayedService?.name
                                                                }
                                                            </p>
                                                            {displayedService?.baseRate !==
                                                                undefined && (
                                                                <div className="flex items-center gap-0.5 text-xs font-semibold text-slate-500 mt-1">
                                                                    <DollarSign
                                                                        size={
                                                                            12
                                                                        }
                                                                    />{' '}
                                                                    {displayedService.baseRate.toFixed(
                                                                        2,
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                                                            {
                                                                displayedService?.durationMinutes
                                                            }{' '}
                                                            min
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* MOBILE ACTION BAR */}
                    {step >= 4 && (
                        <div className="md:hidden absolute bottom-0 left-0 w-full p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-30 pb-safe">
                            <Button
                                type="button"
                                className={cn(
                                    'w-full h-11 font-bold rounded-lg text-sm transition-all',
                                    isBookReady && !isConfirmDisabled
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'bg-slate-100 text-slate-400',
                                )}
                                onClick={() => {
                                    if (step < 5) setStep(5);
                                    else handleSubmit(onSubmit)();
                                }}
                                disabled={isConfirmDisabled}
                            >
                                {isSubmitting ? (
                                    <Loader2
                                        className="animate-spin mr-2"
                                        size={16}
                                    />
                                ) : null}
                                {getButtonText()}
                            </Button>
                        </div>
                    )}
                </main>
            </DialogContent>
        </Dialog>
    );
};
