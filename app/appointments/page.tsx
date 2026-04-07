'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    useQuery,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Loader2,
    CalendarDays,
    Clock,
    UserCircle,
    Stethoscope,
    MoreVertical,
    CalendarClock,
    Ban,
    ChevronDown,
    Check,
    ChevronLeft,
    ChevronRight,
    LayoutList,
    LayoutGrid,
    TableProperties,
    FilterX,
    Filter,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster, toast } from 'sonner';

// Custom Components & Types
import { cn } from '@/lib/utils';
import { getAppointments, updateAppointment } from '@/api/appointment';
import { AppointmentResponse } from '@/types/appointment';
import { AppointmentSchedulingModal } from '@/components/AppointmentSchedulingModal';
import { FormatService } from '@/utils/helpers';
import { AppointmentStatus } from '@/types/clinical';

// --- Helpers ---
const getInitials = (
    firstName?: string,
    lastName?: string,
    username?: string,
) => {
    if (firstName && lastName)
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (username) return username.substring(0, 2).toUpperCase();
    return 'U';
};

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const formatApptTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const formatApptDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

const STATUS_CONFIG: Record<
    AppointmentStatus,
    { label: string; style: string }
> = {
    pending: {
        label: 'Scheduled',
        style: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200/60',
    },
    in_progress: {
        label: 'In Progress',
        style: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200/60',
    },
    completed: {
        label: 'Completed',
        style: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200/60',
    },
    cancelled: {
        label: 'Cancelled',
        style: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200/60',
    },
    no_show: {
        label: 'No Show',
        style: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/60',
    },
    reschedule: {
        label: 'Reschedule',
        style: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200/60',
    },
};

// --- Sub-component: Clickable Status Dropdown ---
const StatusDropdown = ({
    appointment,
    onRequestStatusChange,
}: {
    appointment: AppointmentResponse;
    onRequestStatusChange: (id: string, newStatus: AppointmentStatus) => void;
}) => {
    const currentConfig =
        STATUS_CONFIG[appointment.appointmentStatus] || STATUS_CONFIG.pending;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors outline-none ring-offset-1 focus-visible:ring-2 focus-visible:ring-indigo-500',
                    currentConfig.style,
                )}
            >
                {currentConfig.label}
                <ChevronDown size={14} className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-48 rounded-xl shadow-xl z-50"
            >
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-1 pb-2">
                    Update Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map(
                    (statusKey) => (
                        <DropdownMenuItem
                            key={statusKey}
                            onClick={() =>
                                onRequestStatusChange(
                                    appointment.documentId,
                                    statusKey,
                                )
                            }
                            className="flex items-center justify-between text-xs font-bold cursor-pointer py-2"
                            disabled={
                                appointment.appointmentStatus === statusKey
                            }
                        >
                            {STATUS_CONFIG[statusKey].label}
                            {appointment.appointmentStatus === statusKey && (
                                <Check size={14} className="text-indigo-600" />
                            )}
                        </DropdownMenuItem>
                    ),
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default function MultiViewAppointmentsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    // --- STATE ---
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [direction, setDirection] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>(
        'all',
    );
    const [viewMode, setViewMode] = useState<'agenda' | 'grid' | 'table'>(
        'agenda',
    );

    // Action Confirmation State
    const [pendingAction, setPendingAction] = useState<{
        documentId: string;
        appointmentStatus: AppointmentStatus;
    } | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 300);
    const isModalOpen =
        searchParams.has('isAppointmentModalOpen') ||
        searchParams.has('appointmentId');
    const urlDate = searchParams.get('selectedDate');

    // --- URL TO STATE SYNC ---
    useEffect(() => {
        if (urlDate) {
            const parsedDate = new Date(urlDate + 'T12:00:00');
            if (currentDate.toDateString() !== parsedDate.toDateString()) {
                setDirection(parsedDate > currentDate ? 1 : -1);
                setCurrentDate(parsedDate);
            }
        }
    }, [urlDate]);

    // --- DATE NAVIGATION LOGIC ---
    const updateDateAndURL = (newDate: Date, dir: number) => {
        setDirection(dir);
        setCurrentDate(newDate);
        const p = new URLSearchParams(searchParams.toString());
        p.set('selectedDate', newDate.toISOString().split('T')[0]);
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    };

    const handlePrevDay = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        updateDateAndURL(prev, -1);
    };

    const handleNextDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        updateDateAndURL(next, 1);
    };

    const handleToday = () => {
        const today = new Date();
        updateDateAndURL(today, today > currentDate ? 1 : -1);
    };

    const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const newDate = new Date(e.target.value + 'T12:00:00');
        updateDateAndURL(newDate, newDate > currentDate ? 1 : -1);
    };

    // --- ANIMATION VARIANTS ---
    const dateTextVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir < 0 ? 20 : -20, opacity: 0 }),
    };

    const contentVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    // Generate Start/End of current date for API filtering
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // --- DATA FETCHING ---
    const {
        data: appointments = [],
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: [
            'appointments',
            {
                startAt: startOfDay.toISOString(),
                endAt: endOfDay.toISOString(),
                populate: '*',
            },
        ],
        queryFn: getAppointments,
        placeholderData: keepPreviousData,
    });

    // --- DATA PROCESSING & GROUPING ---
    const { filteredAppointments, groupedAppointments, stats } = useMemo(() => {
        const filtered = (appointments as AppointmentResponse[]).filter(
            (app) => {
                const searchLower = debouncedSearch.toLowerCase();
                const matchesSearch =
                    !debouncedSearch ||
                    [
                        app.student?.firstName,
                        app.student?.lastName,
                        app.therapist?.firstName,
                        app.therapist?.lastName,
                        app.service?.name,
                    ]
                        .filter(Boolean)
                        .some((field) =>
                            field!.toLowerCase().includes(searchLower),
                        );

                const matchesStatus =
                    statusFilter === 'all' ||
                    app.appointmentStatus === statusFilter;

                return matchesSearch && matchesStatus;
            },
        );

        const sorted = filtered.sort(
            (a, b) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );

        const grouped: Record<string, AppointmentResponse[]> = {};
        let completedCount = 0;
        let pendingCount = 0;

        sorted.forEach((app) => {
            const timeKey = formatApptTime(app.startAt);
            if (!grouped[timeKey]) grouped[timeKey] = [];
            grouped[timeKey].push(app);

            if (app.appointmentStatus === 'completed') completedCount++;
            if (app.appointmentStatus === 'pending') pendingCount++;
        });

        return {
            filteredAppointments: sorted,
            groupedAppointments: grouped,
            stats: {
                total: sorted.length,
                completed: completedCount,
                pending: pendingCount,
            },
        };
    }, [appointments, debouncedSearch, statusFilter]);

    // --- HANDLERS ---
    const handleOpenBookModal = () => {
        const p = new URLSearchParams(searchParams.toString());
        p.set('isAppointmentModalOpen', 'true');
        p.set('selectedDate', currentDate.toISOString().split('T')[0]);
        router.push(`${pathname}?${p.toString()}`);
    };

    const handleReschedule = (appointmentId: number | string) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set('appointmentId', appointmentId.toString());
        router.push(`${pathname}?${p.toString()}`);
    };

    // Prepares the action and opens the confirmation modal
    const requestStatusChange = (
        documentId: string,
        newStatus: AppointmentStatus,
    ) => {
        setPendingAction({ documentId, appointmentStatus: newStatus });
    };

    // Executes the action once confirmed
    const executeStatusChange = async () => {
        if (!pendingAction) return;
        setIsUpdatingStatus(true);
        try {
            await updateAppointment(pendingAction.documentId, {
                appointmentStatus: pendingAction.appointmentStatus,
            } as any);
            toast.success(
                `Status successfully changed to ${STATUS_CONFIG[pendingAction.appointmentStatus].label}!`,
            );
            await queryClient.invalidateQueries({ queryKey: ['appointments'] });
        } catch (error) {
            toast.error('Failed to update status.');
        } finally {
            setIsUpdatingStatus(false);
            setPendingAction(null);
        }
    };

    const isInitialLoading = isLoading && appointments.length === 0;

    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">
                        Loading Schedule...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Toaster position="top-right" richColors closeButton />

            {/* ACTION CONFIRMATION MODAL */}
            <AnimatePresence>
                {pendingAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-slate-200 max-w-sm w-full text-center"
                        >
                            <div
                                className={cn(
                                    'h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner',
                                    pendingAction.appointmentStatus ===
                                        'cancelled'
                                        ? 'bg-rose-100 text-rose-600'
                                        : pendingAction.appointmentStatus ===
                                            'completed'
                                          ? 'bg-emerald-100 text-emerald-600'
                                          : 'bg-indigo-100 text-indigo-600',
                                )}
                            >
                                {pendingAction.appointmentStatus ===
                                'cancelled' ? (
                                    <Ban className="w-7 h-7" />
                                ) : pendingAction.appointmentStatus ===
                                  'completed' ? (
                                    <CheckCircle2 className="w-7 h-7" />
                                ) : (
                                    <AlertCircle className="w-7 h-7" />
                                )}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                                {pendingAction.appointmentStatus === 'cancelled'
                                    ? 'Cancel Appointment?'
                                    : pendingAction.appointmentStatus ===
                                        'completed'
                                      ? 'Mark as Completed?'
                                      : 'Update Status?'}
                            </h3>

                            <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                                Are you sure you want to change the status to{' '}
                                <span className="font-bold text-slate-900">
                                    {
                                        STATUS_CONFIG[
                                            pendingAction.appointmentStatus
                                        ]?.label
                                    }
                                </span>
                                ?
                                {pendingAction.appointmentStatus ===
                                    'cancelled' &&
                                    ' This action is destructive and removes it from the active schedule.'}
                            </p>

                            <div className="flex gap-3 justify-center w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 font-bold rounded-xl h-12"
                                    onClick={() => setPendingAction(null)}
                                    disabled={isUpdatingStatus}
                                >
                                    Go Back
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        pendingAction.appointmentStatus ===
                                        'cancelled'
                                            ? 'destructive'
                                            : 'default'
                                    }
                                    className={cn(
                                        'flex-1 font-bold rounded-xl h-12 shadow-md',
                                        pendingAction.appointmentStatus !==
                                            'cancelled' &&
                                            'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
                                    )}
                                    onClick={executeStatusChange}
                                    disabled={isUpdatingStatus}
                                >
                                    {isUpdatingStatus ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Confirm Action
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className="fixed inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage:
                        'linear-gradient(to bottom, black 40%, transparent 100%)',
                }}
            />

            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 relative z-10 flex flex-col gap-6 pb-24">
                {/* --- HEADER --- */}
                <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5 mb-2">
                            <CalendarDays
                                size={14}
                                className="text-indigo-600"
                            />{' '}
                            Daily Manifest
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">
                            Appointments
                        </h1>
                        <div className="flex items-center gap-4 mt-4 text-sm font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-400" />{' '}
                                {stats.total} Total
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />{' '}
                                {stats.pending} Pending
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />{' '}
                                {stats.completed} Completed
                            </span>
                        </div>
                    </div>

                    <div className="w-full xl:w-auto flex flex-col sm:flex-row items-center gap-3">
                        {/* Interactive Date Navigator */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToday}
                                className="hidden sm:flex h-12 px-4 rounded-xl border-slate-200 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                            >
                                Today
                            </Button>

                            <div className="flex items-center w-full sm:w-auto bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-inner">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrevDay}
                                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm text-slate-500 shrink-0"
                                >
                                    <ChevronLeft size={20} />
                                </Button>

                                <div className="relative flex items-center justify-center min-w-[180px] h-10 overflow-hidden cursor-pointer group">
                                    {/* FIX: Date Picker Clickability */}
                                    <input
                                        type="date"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        value={
                                            currentDate
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                        onChange={handleDatePickerChange}
                                        onClick={(e) => {
                                            try {
                                                if (
                                                    'showPicker' in
                                                    HTMLInputElement.prototype
                                                ) {
                                                    (
                                                        e.target as HTMLInputElement
                                                    ).showPicker();
                                                }
                                            } catch (err) {}
                                        }}
                                    />

                                    <AnimatePresence
                                        mode="popLayout"
                                        initial={false}
                                        custom={direction}
                                    >
                                        <motion.div
                                            key={currentDate.toISOString()}
                                            custom={direction}
                                            variants={dateTextVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                duration: 0.3,
                                                ease: 'easeInOut',
                                            }}
                                            className="font-black text-sm text-slate-800 flex items-center gap-2 group-hover:text-indigo-600 transition-colors pointer-events-none relative z-10"
                                        >
                                            <CalendarDays
                                                size={16}
                                                className="text-indigo-400 group-hover:text-indigo-600 transition-colors"
                                            />
                                            {currentDate.toLocaleDateString(
                                                'en-US',
                                                {
                                                    weekday: 'short',
                                                    month: 'long',
                                                    day: 'numeric',
                                                },
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleNextDay}
                                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm text-slate-500 shrink-0"
                                >
                                    <ChevronRight size={20} />
                                </Button>
                            </div>
                        </div>

                        <Button
                            onClick={handleOpenBookModal}
                            className="h-12 w-full sm:w-auto px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shrink-0"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Book Appt
                        </Button>
                    </div>
                </header>

                {/* --- SEARCH & VIEW CONTROLS --- */}
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0">
                    <div className="relative w-full lg:w-[320px] group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            {isFetching && !isLoading ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            )}
                        </div>
                        <Input
                            className="pl-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all rounded-xl h-11 text-sm font-medium placeholder:text-slate-400 shadow-inner"
                            placeholder="Search patients, providers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        {(searchTerm || statusFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-11 px-4 rounded-xl"
                            >
                                <FilterX size={14} className="mr-1.5" /> Clear
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'h-11 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm',
                                        statusFilter !== 'all'
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-600',
                                    )}
                                >
                                    <Filter size={14} className="mr-2" />{' '}
                                    Status:{' '}
                                    {statusFilter === 'all'
                                        ? 'All'
                                        : STATUS_CONFIG[
                                              statusFilter as AppointmentStatus
                                          ]?.label}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-xl z-50"
                            >
                                <DropdownMenuRadioGroup
                                    value={statusFilter}
                                    onValueChange={(val) =>
                                        setStatusFilter(
                                            val as AppointmentStatus | 'all',
                                        )
                                    }
                                >
                                    <DropdownMenuRadioItem
                                        value="all"
                                        className="text-xs font-bold"
                                    >
                                        All Statuses
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuSeparator />
                                    {Object.keys(STATUS_CONFIG).map((key) => (
                                        <DropdownMenuRadioItem
                                            key={key}
                                            value={key}
                                            className={cn(
                                                'text-xs font-bold',
                                                STATUS_CONFIG[
                                                    key as AppointmentStatus
                                                ].style.split(' ')[1],
                                            )}
                                        >
                                            {
                                                STATUS_CONFIG[
                                                    key as AppointmentStatus
                                                ].label
                                            }
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

                        {/* View Mode Tabs */}
                        <Tabs
                            value={viewMode}
                            onValueChange={(v: any) => setViewMode(v)}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="h-11 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50 w-full sm:w-auto grid grid-cols-3 sm:flex">
                                <TabsTrigger
                                    value="agenda"
                                    className="h-8 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm flex items-center gap-2 text-xs font-bold"
                                >
                                    <LayoutList size={14} />{' '}
                                    <span className="hidden sm:inline">
                                        Agenda
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="grid"
                                    className="h-8 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm flex items-center gap-2 text-xs font-bold"
                                >
                                    <LayoutGrid size={14} />{' '}
                                    <span className="hidden sm:inline">
                                        Grid
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="table"
                                    className="h-8 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm flex items-center gap-2 text-xs font-bold"
                                >
                                    <TableProperties size={14} />{' '}
                                    <span className="hidden sm:inline">
                                        Table
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA WITH SLIDE ANIMATION --- */}
                <main className="flex flex-col w-full mt-2 relative min-h-[50vh] overflow-x-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        {filteredAppointments.length > 0 ? (
                            <motion.div
                                key={`${viewMode}-${currentDate.toISOString()}`}
                                custom={direction}
                                variants={contentVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    duration: 0.3,
                                    ease: 'easeInOut',
                                }}
                                className="w-full"
                            >
                                {/* VIEW 1: AGENDA */}
                                {viewMode === 'agenda' && (
                                    <div className="flex flex-col gap-8 relative mt-4">
                                        <div className="absolute top-4 bottom-0 left-[50px] w-0.5 bg-slate-200/60 hidden sm:block" />

                                        {Object.entries(
                                            groupedAppointments,
                                        ).map(([time, appts]) => (
                                            <div
                                                key={time}
                                                className="flex flex-col sm:flex-row gap-4 sm:gap-8 relative"
                                            >
                                                <div className="sm:w-[100px] shrink-0 flex sm:justify-center self-start sm:self-center relative z-10 pl-2 sm:pl-0">
                                                    <div className="bg-white border-2 border-slate-200 text-slate-700 font-black text-xs px-3 py-1.5 rounded-full shadow-sm w-fit">
                                                        {time}
                                                    </div>
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {appts.map((app) => (
                                                        <AppointmentCard
                                                            key={app.id}
                                                            app={app}
                                                            handleReschedule={
                                                                handleReschedule
                                                            }
                                                            onRequestStatusChange={
                                                                requestStatusChange
                                                            }
                                                            showDate={false}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* VIEW 2: GRID */}
                                {viewMode === 'grid' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch content-start w-full">
                                        {filteredAppointments.map((app) => (
                                            <AppointmentCard
                                                key={app.id}
                                                app={app}
                                                handleReschedule={
                                                    handleReschedule
                                                }
                                                onRequestStatusChange={
                                                    requestStatusChange
                                                }
                                                showDate={true}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* VIEW 3: TABLE */}
                                {viewMode === 'table' && (
                                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden w-full overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                                                    <th className="p-4 pl-6">
                                                        Time
                                                    </th>
                                                    <th className="p-4">
                                                        Patient
                                                    </th>
                                                    <th className="p-4">
                                                        Provider
                                                    </th>
                                                    <th className="p-4">
                                                        Service
                                                    </th>
                                                    <th className="p-4">
                                                        Status
                                                    </th>
                                                    <th className="p-4 pr-6 text-right">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {filteredAppointments.map(
                                                    (app) => (
                                                        <tr
                                                            key={app.id}
                                                            className="hover:bg-slate-50/50 transition-colors group"
                                                        >
                                                            <td className="p-4 pl-6 whitespace-nowrap">
                                                                <div className="font-bold text-slate-900">
                                                                    {formatApptTime(
                                                                        app.startAt,
                                                                    )}
                                                                </div>
                                                                <div className="text-xs font-medium text-slate-500 mt-0.5">
                                                                    {formatApptTime(
                                                                        app.endAt,
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 font-bold text-slate-800">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8 rounded-lg">
                                                                        <AvatarImage
                                                                            src={FormatService.formatStrapiMedia(
                                                                                app
                                                                                    .student
                                                                                    ?.profilePicture,
                                                                                'thumbnail',
                                                                            )}
                                                                            className="object-cover"
                                                                        />
                                                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-[10px]">
                                                                            {getInitials(
                                                                                app
                                                                                    .student
                                                                                    ?.firstName,
                                                                                app
                                                                                    .student
                                                                                    ?.lastName,
                                                                                app
                                                                                    .student
                                                                                    ?.username,
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>
                                                                        {app
                                                                            .student
                                                                            ?.fullName ||
                                                                            `${app.student?.firstName || ''} ${app.student?.lastName || ''}` ||
                                                                            'Unknown'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8 rounded-lg">
                                                                        <AvatarImage
                                                                            src={FormatService.formatStrapiMedia(
                                                                                app
                                                                                    .therapist
                                                                                    ?.profilePicture,
                                                                                'thumbnail',
                                                                            )}
                                                                            className="object-cover"
                                                                        />
                                                                        <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px]">
                                                                            <Stethoscope
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-semibold text-slate-700">
                                                                        {app
                                                                            .therapist
                                                                            ?.fullName ||
                                                                            `${app.therapist?.firstName || ''} ${app.therapist?.lastName || ''}` ||
                                                                            'Unassigned'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="font-bold text-slate-900 truncate max-w-[200px]">
                                                                    {
                                                                        app
                                                                            .service
                                                                            ?.name
                                                                    }
                                                                </div>
                                                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                                    {
                                                                        app
                                                                            .service
                                                                            ?.category
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <StatusDropdown
                                                                    appointment={
                                                                        app
                                                                    }
                                                                    onRequestStatusChange={
                                                                        requestStatusChange
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="p-4 pr-6 text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100"
                                                                        >
                                                                            <MoreVertical
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent
                                                                        align="end"
                                                                        className="w-40 rounded-xl z-50"
                                                                    >
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleReschedule(
                                                                                    app.documentId,
                                                                                )
                                                                            }
                                                                            className="text-xs font-bold text-slate-700 cursor-pointer py-2"
                                                                        >
                                                                            <CalendarClock className="mr-2 h-4 w-4 text-indigo-500" />{' '}
                                                                            Reschedule
                                                                        </DropdownMenuItem>
                                                                        {app.appointmentStatus !==
                                                                            'cancelled' && (
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    requestStatusChange(
                                                                                        app.documentId,
                                                                                        'cancelled',
                                                                                    )
                                                                                }
                                                                                className="text-xs font-bold text-rose-600 focus:text-rose-700 cursor-pointer py-2"
                                                                            >
                                                                                <Ban className="mr-2 h-4 w-4" />{' '}
                                                                                Cancel
                                                                                Booking
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`empty-${currentDate.toISOString()}`}
                                custom={direction}
                                variants={contentVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    duration: 0.3,
                                    ease: 'easeInOut',
                                }}
                                className="flex flex-col items-center justify-center min-h-[40vh] text-center w-full border-2 border-dashed border-slate-200 rounded-[32px] bg-white"
                            >
                                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                    <CalendarDays
                                        size={24}
                                        className="text-slate-300"
                                    />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">
                                    No appointments found
                                </h3>
                                <p className="text-sm font-medium text-slate-500 mt-2 max-w-[320px]">
                                    {searchTerm || statusFilter !== 'all'
                                        ? `We couldn't find any appointments matching your exact filters.`
                                        : `There are currently no appointments booked for this day.`}
                                </p>
                                {searchTerm || statusFilter !== 'all' ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setStatusFilter('all');
                                        }}
                                        className="mt-6 h-11 px-8 rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50"
                                    >
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleOpenBookModal}
                                        className="mt-6 h-11 px-8 rounded-xl bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                    >
                                        Book First Appointment
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                <div className="h-16 w-full shrink-0" aria-hidden="true" />
            </div>

            {isModalOpen && <AppointmentSchedulingModal />}
        </div>
    );
}

// --- Reusable Card Component for Agenda & Grid Views ---
function AppointmentCard({
    app,
    handleReschedule,
    onRequestStatusChange,
    showDate = false,
}: {
    app: AppointmentResponse;
    handleReschedule: (id: string) => void;
    onRequestStatusChange: (id: string, s: AppointmentStatus) => void;
    showDate?: boolean;
}) {
    return (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 flex flex-col hover:border-indigo-200 hover:shadow-md transition-all group relative overflow-hidden h-full">
            <div className="flex justify-between items-start mb-2">
                {showDate ? (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm">
                            <CalendarDays size={16} />
                            {formatApptDate(app.startAt)}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
                            <Clock size={14} />
                            {formatApptTime(app.startAt)}
                        </div>
                    </div>
                ) : (
                    <div /> // Spacer if date is hidden
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 absolute top-4 right-4"
                        >
                            <MoreVertical size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-40 rounded-xl z-50"
                    >
                        <DropdownMenuItem
                            onClick={() => handleReschedule(app.documentId)}
                            className="text-xs font-bold text-slate-700 cursor-pointer py-2"
                        >
                            <CalendarClock className="mr-2 h-4 w-4 text-indigo-500" />{' '}
                            Reschedule
                        </DropdownMenuItem>
                        {app.appointmentStatus !== 'cancelled' && (
                            <DropdownMenuItem
                                onClick={() =>
                                    onRequestStatusChange(
                                        app.documentId,
                                        'cancelled',
                                    )
                                }
                                className="text-xs font-bold text-rose-600 focus:text-rose-700 cursor-pointer py-2"
                            >
                                <Ban className="mr-2 h-4 w-4" /> Cancel Booking
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-4 flex-1 mt-2">
                <div className="flex items-center gap-3 pr-8">
                    <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-100 shrink-0">
                        <AvatarImage
                            src={FormatService.formatStrapiMedia(
                                app.student?.profilePicture,
                                'thumbnail',
                            )}
                            alt={app.student?.fullName || ''}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                            {getInitials(
                                app.student?.firstName,
                                app.student?.lastName,
                                app.student?.username,
                            )}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Patient
                        </p>
                        <p className="text-base font-black text-slate-900 truncate">
                            {app.student?.fullName ||
                                `${app.student?.firstName || ''} ${app.student?.lastName || ''}` ||
                                'Unknown'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                        <AvatarImage
                            src={FormatService.formatStrapiMedia(
                                app.therapist?.profilePicture,
                                'thumbnail',
                            )}
                            alt={app.therapist?.fullName || ''}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-slate-200 text-slate-500">
                            <Stethoscope size={14} />
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Provider
                        </p>
                        <p className="text-xs font-bold text-slate-700 truncate">
                            {app.therapist?.fullName ||
                                `${app.therapist?.firstName || ''} ${app.therapist?.lastName || ''}` ||
                                'Unassigned'}
                        </p>
                    </div>
                </div>

                <div className="pt-1">
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">
                        {app.service?.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-1">
                        <Clock size={12} /> {app.service?.durationMinutes} min •{' '}
                        {app.service?.category}
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <StatusDropdown
                    appointment={app}
                    onRequestStatusChange={onRequestStatusChange}
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {formatApptTime(app.endAt)}
                </p>
            </div>
        </div>
    );
}
