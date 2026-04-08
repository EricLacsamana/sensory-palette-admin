'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    CalendarDays,
    Clock,
    Plus,
    CalendarIcon,
    ChevronRight,
    Users,
} from 'lucide-react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster, toast } from 'sonner';
import { useSessionPlan } from '@/hooks/useSessionPlan';
import CapacityGauge from './components/CapacityGauge';
import { TimelineEndpoint, TimelineItem } from './components/TimelineItem';
import { Header } from './components/Header';
import { ActivitiesSiderbar } from './components/ActivitiesSidebar';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppointments } from '@/api/service-appointments';
import {
    createActivitySession,
    updateActivitySession,
    deleteActivitySession,
} from '@/api/activity-session';
import { FormatService } from '@/utils/helpers';
import { AppointmentResponse } from '@/types/appointment';
import { UserAvatar } from '@/components/UserAvatar';
import { ActivityResponse } from '@/types/actitivity';
import { cn } from '@/lib/utils';

const timelineVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 60 : -60, opacity: 0 }),
};

const listVariants = {
    enter: { opacity: 0, y: 15 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
};

// Helper for sleek time formatting in the timeline
const formatTimeSplit = (isoString: string) => {
    const formatted = FormatService.formatTime(isoString, '12h-simple'); // "10:00 AM"
    const [time, ampm] = formatted.split(' ');
    return { time, ampm };
};

const SessionPlanningModal = ({ onClose }: { onClose?: () => void }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const [pendingAppointmentId, setPendingAppointmentId] = useState<
        string | null
    >(null);
    const [isDragging, setIsDragging] = useState(false);
    const [slideDirection, setSlideDirection] = useState(0);

    const [mobileSelectedActivity, setMobileSelectedActivity] =
        useState<ActivityResponse | null>(null);

    const [activeAppointmentId, setActiveAppointmentId] = useState<
        string | null
    >(() => {
        return searchParams.get('planAppointmentId') || null;
    });

    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    const { data: appointmentsList = [] } = useQuery({
        queryKey: ['appointments', { populate: '*' }],
        queryFn: getAppointments,
    });

    // --- FORECASTING LOGIC (Grouped by Date) ---
    const groupedUpcomingAppointments = useMemo(() => {
        const list = appointmentsList as AppointmentResponse[];
        const targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);

        const filtered = list.filter((a) => {
            const apptDate = new Date(a.startAt);
            if (apptDate.getTime() < targetDate.getTime()) return false;
            return (
                a.appointmentStatus === 'pending' ||
                a.appointmentStatus === 'reschedule'
            );
        });

        filtered.sort(
            (a, b) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );

        const grouped: Record<string, AppointmentResponse[]> = {};
        filtered.forEach((app) => {
            const dateStr = new Date(app.startAt).toISOString().split('T')[0];
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(app);
        });

        return grouped;
    }, [appointmentsList]);

    const sortedDateStrings = useMemo(() => {
        return Object.keys(groupedUpcomingAppointments).sort();
    }, [groupedUpcomingAppointments]);

    const selectedDateStr = currentDate.toISOString().split('T')[0];

    const filteredAppointments = useMemo(() => {
        return groupedUpcomingAppointments[selectedDateStr] || [];
    }, [groupedUpcomingAppointments, selectedDateStr]);

    // --- Group strictly by Exact Time (for same-time stacking) ---
    const groupedByTime = useMemo(() => {
        const groups: Record<string, AppointmentResponse[]> = {};
        filteredAppointments.forEach((app) => {
            const timeKey = new Date(app.startAt).getTime().toString();
            if (!groups[timeKey]) groups[timeKey] = [];
            groups[timeKey].push(app);
        });

        return Object.keys(groups)
            .sort()
            .map((key) => ({
                timestamp: Number(key),
                timeString: groups[key][0].startAt,
                appointments: groups[key],
            }));
    }, [filteredAppointments]);

    const activeAppointment = useMemo(() => {
        return (appointmentsList as AppointmentResponse[]).find(
            (a) =>
                a.documentId === activeAppointmentId ||
                a.id.toString() === activeAppointmentId,
        );
    }, [appointmentsList, activeAppointmentId]);

    const sessionStudent = activeAppointment?.student;

    const defaultBounds = useMemo(() => {
        const d = new Date();
        d.setHours(8, 0, 0, 0);
        const start = d.toISOString();
        d.setHours(17, 0, 0, 0);
        const end = d.toISOString();
        return { start, end };
    }, []);

    const sessionStartAt = activeAppointment?.startAt || defaultBounds.start;
    const sessionEndAt = activeAppointment?.endAt || defaultBounds.end;

    const {
        timelineItems,
        draft,
        deletedDocumentIds,
        capacityMetrics,
        isDirty,
        addActivity,
        insertAtGap,
        removeActivity,
        toggleLock,
        reorderActivities,
        updateActivityStartTime,
        reset,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useSessionPlan({
        appointmentId: activeAppointment?.documentId,
        startAt: sessionStartAt,
        endAt: sessionEndAt,
        student: sessionStudent,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                e.shiftKey ? canRedo && redo() : canUndo && undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

    const performClose = () => {
        reset();
        setShowExitConfirm(false);
        const p = new URLSearchParams(searchParams.toString());
        p.delete('isActivitySessionPlanningOpen');
        p.delete('planAppointmentId');
        router.replace(`${pathname}?${p.toString()}`);
        if (onClose) onClose();
    };

    const handleRequestClose = () => {
        if (isDirty) {
            setPendingAppointmentId(null);
            setShowExitConfirm(true);
        } else {
            performClose();
        }
    };

    const performAppointmentSwitch = (newId: string | null) => {
        reset();
        setPendingAppointmentId(null);
        setShowExitConfirm(false);
        setActiveAppointmentId(newId);

        const p = new URLSearchParams(searchParams.toString());
        if (newId) {
            p.set('planAppointmentId', newId);
        } else {
            p.delete('planAppointmentId');
        }
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    };

    const handleAppointmentSwitchRequest = (newId: string) => {
        if (newId === activeAppointmentId) return;
        if (isDirty) {
            setPendingAppointmentId(newId);
            setShowExitConfirm(true);
        } else {
            performAppointmentSwitch(newId);
        }
    };

    const handleBackClick = () => {
        if (isDirty) {
            setPendingAppointmentId('BACK');
            setShowExitConfirm(true);
        } else {
            performAppointmentSwitch(null);
        }
    };

    const handleSubmit = async (closeAfter: boolean) => {
        if (isSubmitting || !sessionStudent || !activeAppointment) return;
        setIsSubmitting(true);
        try {
            for (const id of deletedDocumentIds) {
                await deleteActivitySession(id);
            }
            for (const session of draft) {
                const payload = {
                    startAt: session.startAt,
                    endAt: session.endAt,
                };
                if (session.documentId) {
                    await updateActivitySession(session.documentId, payload);
                } else if (session.activity?.documentId) {
                    await createActivitySession({
                        ...payload,
                        activity: session.activity.documentId,
                        student: sessionStudent.id,
                        appointment: activeAppointment.documentId,
                    });
                }
            }
            toast.success('Session plan synchronized successfully');

            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            if (closeAfter) {
                performClose();
            } else {
                reset();
                setPendingAppointmentId(null);
            }
        } catch (error) {
            console.error('Save Error:', error);
            toast.error('Failed to sync schedule. Check connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExternalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('newActivity');
        if (data) {
            try {
                addActivity(JSON.parse(data));
            } catch (err) {
                console.error('Drop error', err);
            }
        }
        setIsDragging(false);
    };

    const handleMobileAdd = () => {
        if (mobileSelectedActivity) {
            addActivity(mobileSelectedActivity);
            setMobileSelectedActivity(null);
        }
    };

    const renderMainContent = () => {
        return (
            <div
                className={cn(
                    'flex flex-col h-full relative w-full overflow-hidden transition-colors duration-200',
                    !activeAppointmentId ? 'bg-slate-50' : 'bg-white',
                )}
            >
                {!activeAppointmentId && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.4] z-0"
                        style={{
                            backgroundImage:
                                'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                )}

                <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
                    <Header
                        hasAppointment={!!activeAppointmentId}
                        activeAppointment={activeAppointment}
                        onBack={handleBackClick}
                        startAt={sessionStartAt}
                        endAt={sessionEndAt}
                        undo={undo}
                        redo={redo}
                        canRedo={canRedo}
                        canUndo={canUndo}
                        isDirty={isDirty}
                        onClose={handleRequestClose}
                    />

                    {!activeAppointmentId ? (
                        /* ==================================================
                            SELECT APPOINTMENT VIEW (Sidebar + Timeline)
                           ================================================== */
                        <div className="flex flex-1 h-full overflow-hidden relative z-10">
                            {/* DYNAMIC FORECASTING SIDEBAR */}
                            <aside
                                className={cn(
                                    'flex flex-col bg-slate-50 border-r border-slate-200 h-full shrink-0 z-40 transition-all duration-300',
                                    'w-[84px] lg:w-[320px]',
                                )}
                            >
                                {/* Header */}
                                <div className="h-14 p-2 lg:p-4 border-b border-slate-200 bg-white shrink-0 flex items-center justify-center lg:justify-start">
                                    <h3 className="hidden lg:block text-sm font-black text-slate-800 tracking-tight">
                                        Forecast
                                    </h3>
                                    <h3 className="lg:hidden text-[10px] font-black text-slate-800 tracking-widest uppercase">
                                        <CalendarIcon
                                            size={14}
                                            className="inline mb-0.5 mr-1"
                                        />
                                    </h3>
                                </div>

                                <div className="flex-1 min-h-0 relative w-full bg-slate-50/50">
                                    <ScrollArea className="h-full w-full">
                                        <div className="p-3 pr-3 lg:p-4 lg:pr-5 space-y-4 lg:space-y-6 w-full">
                                            <div className="w-full">
                                                <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between px-1 mb-2 lg:mb-3">
                                                    <h3 className="hidden lg:block text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate pr-2">
                                                        Active Dates
                                                    </h3>
                                                    <div className="h-px w-8 bg-slate-200 lg:hidden my-1 mx-auto" />
                                                </div>

                                                <div className="flex flex-col items-stretch gap-2.5 pb-20 w-full">
                                                    {sortedDateStrings.length >
                                                    0 ? (
                                                        sortedDateStrings.map(
                                                            (dateStr) => {
                                                                const count =
                                                                    groupedUpcomingAppointments[
                                                                        dateStr
                                                                    ].length;
                                                                const isSelected =
                                                                    selectedDateStr ===
                                                                    dateStr;
                                                                const d =
                                                                    new Date(
                                                                        dateStr +
                                                                            'T12:00:00',
                                                                    );
                                                                const isToday =
                                                                    new Date()
                                                                        .toISOString()
                                                                        .split(
                                                                            'T',
                                                                        )[0] ===
                                                                    dateStr;

                                                                return (
                                                                    <button
                                                                        key={
                                                                            dateStr
                                                                        }
                                                                        onClick={() =>
                                                                            setCurrentDate(
                                                                                d,
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            'group relative flex flex-col items-center lg:items-start p-2.5 lg:p-3 rounded-2xl transition-all duration-200 border text-left w-full',
                                                                            isSelected
                                                                                ? 'bg-white border-indigo-200 shadow-[0_2px_10px_-3px_rgba(99,102,241,0.2)]'
                                                                                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]',
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full gap-2">
                                                                            {/* Collapsed View */}
                                                                            <div className="lg:hidden flex flex-col items-center justify-center w-full gap-1">
                                                                                <span
                                                                                    className={cn(
                                                                                        'text-[9px] font-black uppercase tracking-widest',
                                                                                        isSelected
                                                                                            ? 'text-indigo-600'
                                                                                            : 'text-slate-400',
                                                                                    )}
                                                                                >
                                                                                    {isToday
                                                                                        ? 'TDY'
                                                                                        : d.toLocaleDateString(
                                                                                              'en-US',
                                                                                              {
                                                                                                  weekday:
                                                                                                      'short',
                                                                                              },
                                                                                          )}
                                                                                </span>
                                                                                <div
                                                                                    className={cn(
                                                                                        'h-10 w-10 rounded-full flex items-center justify-center font-black text-sm border-2',
                                                                                        isSelected
                                                                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                                                            : 'bg-slate-50 border-white text-slate-700',
                                                                                    )}
                                                                                >
                                                                                    {d.getDate()}
                                                                                </div>
                                                                            </div>

                                                                            {/* Expanded View Text */}
                                                                            <div className="hidden lg:flex items-center gap-3 w-full">
                                                                                <div
                                                                                    className={cn(
                                                                                        'flex flex-col items-center justify-center h-11 w-11 rounded-xl shrink-0 transition-colors border',
                                                                                        isSelected
                                                                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                                                                            : 'bg-white border-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-100',
                                                                                    )}
                                                                                >
                                                                                    <span className="text-[10px] font-black uppercase leading-none mt-1">
                                                                                        {d.toLocaleDateString(
                                                                                            'en-US',
                                                                                            {
                                                                                                month: 'short',
                                                                                            },
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-sm font-bold leading-none">
                                                                                        {d.getDate()}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-col flex-1 min-w-0">
                                                                                    <span
                                                                                        className={cn(
                                                                                            'text-[10px] font-black uppercase tracking-widest truncate',
                                                                                            isSelected
                                                                                                ? 'text-indigo-600'
                                                                                                : 'text-slate-400 group-hover:text-slate-500',
                                                                                        )}
                                                                                    >
                                                                                        {isToday
                                                                                            ? 'Today'
                                                                                            : d.toLocaleDateString(
                                                                                                  'en-US',
                                                                                                  {
                                                                                                      weekday:
                                                                                                          'long',
                                                                                                  },
                                                                                              )}
                                                                                    </span>
                                                                                    <span
                                                                                        className={cn(
                                                                                            'text-sm font-bold truncate',
                                                                                            isSelected
                                                                                                ? 'text-slate-900'
                                                                                                : 'text-slate-700',
                                                                                        )}
                                                                                    >
                                                                                        {d.toLocaleDateString(
                                                                                            'en-US',
                                                                                            {
                                                                                                month: 'short',
                                                                                                day: 'numeric',
                                                                                            },
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <div
                                                                                className={cn(
                                                                                    'hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0',
                                                                                    isSelected
                                                                                        ? 'bg-indigo-100 text-indigo-700'
                                                                                        : 'bg-slate-100 text-slate-500',
                                                                                )}
                                                                            >
                                                                                <Users
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />
                                                                                <span className="text-[10px] font-black">
                                                                                    {
                                                                                        count
                                                                                    }
                                                                                </span>
                                                                            </div>

                                                                            {/* Micro count for collapsed view */}
                                                                            <span
                                                                                className={cn(
                                                                                    'lg:hidden absolute -top-1 -right-1 h-5 w-5 rounded-full text-[9px] font-black flex items-center justify-center border-2 border-slate-50 shadow-sm',
                                                                                    isSelected
                                                                                        ? 'bg-indigo-600 text-white'
                                                                                        : 'bg-slate-700 text-white',
                                                                                )}
                                                                            >
                                                                                {
                                                                                    count
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            },
                                                        )
                                                    ) : (
                                                        <div className="text-center py-6 lg:py-8 text-slate-400 w-full bg-white rounded-xl border border-slate-100 border-dashed">
                                                            <CalendarDays
                                                                size={20}
                                                                className="opacity-30 mx-auto mb-2 hidden lg:block"
                                                            />
                                                            <p className="text-[9px] lg:text-xs font-bold text-slate-400 text-center px-1">
                                                                <span className="lg:hidden">
                                                                    Empty
                                                                </span>
                                                                <span className="hidden lg:inline">
                                                                    No dates
                                                                    found
                                                                </span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                                </div>
                            </aside>

                            {/* MAIN CONTENT (Perfectly Aligned Timeline Row List) */}
                            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
                                <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 custom-scrollbar relative">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={selectedDateStr}
                                            variants={listVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                duration: 0.25,
                                                ease: 'easeOut',
                                            }}
                                            className="w-full max-w-4xl mx-auto"
                                        >
                                            {/* Date Header for Selection Timeline */}
                                            <div className="flex flex-row items-center w-full relative z-10 pb-6 pt-2">
                                                <div className="w-[60px] sm:w-[88px] shrink-0" />
                                                <div className="flex flex-col items-center w-6 shrink-0 relative z-10">
                                                    <div className="h-2 w-2 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                                                </div>
                                                <div className="pl-3 sm:pl-5">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700">
                                                        <CalendarDays
                                                            size={14}
                                                            className="text-slate-400"
                                                        />
                                                        <span className="text-sm font-bold tracking-tight">
                                                            {new Date(
                                                                selectedDateStr +
                                                                    'T12:00:00',
                                                            ).toLocaleDateString(
                                                                'en-US',
                                                                {
                                                                    weekday:
                                                                        'long',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {groupedByTime.length > 0 ? (
                                                <div className="relative">
                                                    {/* Continuous Vertical Timeline Line */}
                                                    <div className="absolute left-[71px] sm:left-[99px] top-0 bottom-10 w-[2px] bg-slate-200/60 z-0" />

                                                    <div className="flex flex-col gap-6 relative z-10 pb-20">
                                                        {groupedByTime.map(
                                                            (slot) => {
                                                                const {
                                                                    time,
                                                                    ampm,
                                                                } =
                                                                    formatTimeSplit(
                                                                        slot.timeString,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            slot.timestamp
                                                                        }
                                                                        className="flex flex-row items-stretch w-full relative z-10"
                                                                    >
                                                                        {/* Time Column */}
                                                                        <div className="flex flex-col items-end w-[60px] sm:w-[88px] shrink-0 pr-3 sm:pr-4 pt-5">
                                                                            <span className="text-[13px] sm:text-[15px] font-medium sm:font-semibold text-slate-900 leading-none">
                                                                                {
                                                                                    time
                                                                                }
                                                                            </span>
                                                                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                                                                                {
                                                                                    ampm
                                                                                }
                                                                            </span>
                                                                        </div>

                                                                        {/* Node Column */}
                                                                        <div className="flex flex-col top-3.5 items-center w-6 shrink-0 relative z-10 pt-[24px]">
                                                                            <div className="h-3 w-3 rounded-full bg-white border-[3px] border-indigo-400 ring-4 ring-slate-50 shadow-sm z-10" />
                                                                        </div>

                                                                        {/* Cards Column */}
                                                                        <div className="flex-1 flex flex-col gap-2.5 sm:gap-3 pl-3 sm:pl-5 min-w-0 relative pb-4 sm:pb-6">
                                                                            {/* Connecting bracket line for multiple appointments */}
                                                                            {slot
                                                                                .appointments
                                                                                .length >
                                                                                1 && (
                                                                                <div className="absolute left-[5px] sm:left-[9px] top-[36px] bottom-[36px] w-[2px] bg-indigo-100 rounded-full z-0" />
                                                                            )}

                                                                            {slot.appointments.map(
                                                                                (
                                                                                    app: AppointmentResponse,
                                                                                ) => (
                                                                                    <button
                                                                                        key={
                                                                                            app.id
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleAppointmentSwitchRequest(
                                                                                                app.documentId,
                                                                                            )
                                                                                        }
                                                                                        className="group relative flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 text-left w-full z-10"
                                                                                    >
                                                                                        {/* Removed absolute accent hover line entirely */}

                                                                                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pl-2">
                                                                                            <UserAvatar
                                                                                                src={
                                                                                                    FormatService.formatStrapiMedia(
                                                                                                        app
                                                                                                            .student
                                                                                                            ?.profilePicture,
                                                                                                        'thumbnail',
                                                                                                    ) ||
                                                                                                    undefined
                                                                                                }
                                                                                                name={
                                                                                                    app
                                                                                                        .student
                                                                                                        ?.fullName
                                                                                                }
                                                                                                size="md"
                                                                                                className="shrink-0"
                                                                                            />
                                                                                            <div className="flex flex-col min-w-0">
                                                                                                <span className="text-sm font-semibold text-slate-900 truncate">
                                                                                                    {app
                                                                                                        .student
                                                                                                        ?.fullName ||
                                                                                                        app
                                                                                                            .student
                                                                                                            ?.firstName +
                                                                                                            ' ' +
                                                                                                            app
                                                                                                                .student
                                                                                                                ?.lastName ||
                                                                                                        'Unknown Learner'}
                                                                                                </span>
                                                                                                <span className="text-xs text-slate-500 truncate mt-0.5">
                                                                                                    {app
                                                                                                        .student
                                                                                                        ?.diagnosis ||
                                                                                                        'No Diagnosis Provided'}
                                                                                                </span>
                                                                                                <span className="text-xs text-slate-500 truncate mt-0.5">
                                                                                                    Age:{' '}
                                                                                                    {
                                                                                                        app
                                                                                                            .student
                                                                                                            ?.age
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-2">
                                                                                            <span className="text-xs font-medium text-slate-400">
                                                                                                {
                                                                                                    app
                                                                                                        .service
                                                                                                        ?.durationMinutes
                                                                                                }{' '}
                                                                                                min
                                                                                            </span>
                                                                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
                                                                                                <ChevronRight
                                                                                                    size={
                                                                                                        14
                                                                                                    }
                                                                                                    className="text-slate-400 group-hover:text-slate-600 transition-all"
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </button>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center text-slate-500 py-12">
                                                    <p className="text-sm font-medium mt-1">
                                                        No appointments found
                                                        for this date.
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Planner View */
                        <div className="flex-1 flex flex-row overflow-hidden relative bg-white">
                            <ActivitiesSiderbar
                                remainingMinutes={
                                    capacityMetrics.remainingMinutes
                                }
                                onDragStart={(e, a) => {
                                    e.dataTransfer.setData(
                                        'newActivity',
                                        JSON.stringify(a),
                                    );
                                    setIsDragging(true);
                                }}
                                onDragEnd={() => setIsDragging(false)}
                                onActivityTap={(act) =>
                                    setMobileSelectedActivity(act)
                                }
                            />

                            <main
                                className="flex-1 flex flex-col bg-white overflow-hidden relative min-w-0"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                }}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onDrop={handleExternalDrop}
                            >
                                {/* CAPACITY GAUGE ON TOP OF TIMELINE CANVAS */}
                                <div className="h-14 border-b border-slate-200 flex justify-between bg-white items-center shrink-0 px-4 sm:px-6 z-30 shadow-[0_4px_15px_-10px_rgba(0,0,0,0.05)]">
                                    <CapacityGauge
                                        percent={capacityMetrics.percentUsed}
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex-1 bg-slate-50/30 relative overflow-hidden">
                                    <AnimatePresence
                                        mode="popLayout"
                                        custom={slideDirection}
                                        initial={false}
                                    >
                                        <motion.div
                                            key={sessionStartAt}
                                            custom={slideDirection}
                                            variants={timelineVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                            className="w-full h-full overflow-y-auto touch-pan-y"
                                        >
                                            <div className="w-full max-w-4xl mx-auto pl-1 pr-2 sm:pr-4 lg:pr-6 py-4 sm:py-8 relative z-10">
                                                <AnimatePresence mode="popLayout">
                                                    <Reorder.Group
                                                        axis="y"
                                                        values={draft}
                                                        onReorder={
                                                            reorderActivities
                                                        }
                                                        className="space-y-0 relative"
                                                    >
                                                        {/* TIMELINE ENDPOINT FOR PLANNER VIEW */}
                                                        <TimelineEndpoint
                                                            type="start"
                                                            time={FormatService.formatTime(
                                                                sessionStartAt,
                                                                '12h-simple',
                                                            )}
                                                        />

                                                        <div className="my-2 relative">
                                                            {timelineItems.map(
                                                                (item) => (
                                                                    <TimelineItem
                                                                        key={
                                                                            item.instanceId
                                                                        }
                                                                        variant={
                                                                            item.type
                                                                        }
                                                                        data={
                                                                            item
                                                                        }
                                                                        currentStudentId={
                                                                            sessionStudent?.id ||
                                                                            null
                                                                        }
                                                                        isDraggingAny={
                                                                            isDragging
                                                                        }
                                                                        sessionStart={
                                                                            sessionStartAt
                                                                        }
                                                                        sessionEnd={
                                                                            sessionEndAt
                                                                        }
                                                                        onDragStart={() =>
                                                                            setIsDragging(
                                                                                true,
                                                                            )
                                                                        }
                                                                        onDragEnd={() =>
                                                                            setIsDragging(
                                                                                false,
                                                                            )
                                                                        }
                                                                        onRemove={() =>
                                                                            removeActivity(
                                                                                item.instanceId,
                                                                            )
                                                                        }
                                                                        onToggleLock={() =>
                                                                            toggleLock(
                                                                                item.instanceId,
                                                                            )
                                                                        }
                                                                        onGapDrop={(
                                                                            act,
                                                                        ) =>
                                                                            insertAtGap(
                                                                                item.instanceId,
                                                                                act,
                                                                            )
                                                                        }
                                                                        onTimeChange={(
                                                                            time,
                                                                        ) =>
                                                                            updateActivityStartTime(
                                                                                item.instanceId,
                                                                                time,
                                                                            )
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>

                                                        {/* TIMELINE ENDPOINT FOR PLANNER VIEW */}
                                                        <TimelineEndpoint
                                                            type="end"
                                                            time={FormatService.formatTime(
                                                                sessionEndAt,
                                                                '12h-simple',
                                                            )}
                                                        />
                                                    </Reorder.Group>
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="h-16 sm:h-20 border-t border-slate-100 flex items-center justify-end px-4 sm:px-8 bg-white shrink-0 z-50 gap-2 sm:gap-3">
                                    <Button
                                        variant="ghost"
                                        className="text-slate-500 hover:text-slate-700 font-semibold"
                                        onClick={handleRequestClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold shadow-sm"
                                        onClick={() => handleSubmit(false)}
                                        disabled={!isDirty || isSubmitting}
                                    >
                                        {isSubmitting
                                            ? 'Saving...'
                                            : 'Save Only'}
                                    </Button>
                                    <Button
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                                        onClick={() => handleSubmit(true)}
                                        disabled={!isDirty || isSubmitting}
                                    >
                                        Save & Close
                                    </Button>
                                </div>
                            </main>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <Toaster
                position="top-right"
                richColors
                toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }}
            />

            <Dialog open onOpenChange={(open) => !open && handleRequestClose()}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => {
                        if (isDirty) e.preventDefault();
                    }}
                    className="!max-w-[900px] w-full sm:!w-[95vw] h-[100dvh] sm:h-[92vh] p-0 flex flex-col bg-white overflow-hidden rounded-none sm:rounded-3xl shadow-2xl border-none [&>button]:hidden"
                >
                    <DialogTitle className="sr-only">
                        Session Planner
                    </DialogTitle>
                    {renderMainContent()}
                </DialogContent>
            </Dialog>

            {/* Mobile Adding Dialog */}
            <Dialog
                open={!!mobileSelectedActivity}
                onOpenChange={(o) => !o && setMobileSelectedActivity(null)}
            >
                <DialogContent className="w-[85vw] max-w-sm rounded-[24px] p-0 overflow-hidden bg-white border-none shadow-2xl gap-0 [&>button]:hidden">
                    <div className="w-full h-36 sm:h-40 bg-slate-100 relative shrink-0">
                        {mobileSelectedActivity?.banner ? (
                            <img
                                src={
                                    FormatService.formatStrapiMedia(
                                        mobileSelectedActivity.banner,
                                        'medium',
                                    ) || undefined
                                }
                                className="w-full h-full object-cover"
                                alt=""
                            />
                        ) : (
                            <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                                <Plus size={32} className="text-indigo-200" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>

                    <div className="px-5 pb-5 flex flex-col items-center text-center relative z-10 -mt-5">
                        <div className="bg-white p-1 rounded-full shadow-md mb-2">
                            <div className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} strokeWidth={3} />{' '}
                                {mobileSelectedActivity?.durationMinutes || 30}{' '}
                                Min
                            </div>
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-1">
                            {mobileSelectedActivity?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm font-medium text-slate-500 mt-2 px-2">
                            Tap below to insert this activity into the current
                            session timeline.
                        </DialogDescription>
                    </div>

                    <DialogFooter className="px-5 pb-5 flex flex-row gap-2 sm:gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1 rounded-xl h-12 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            onClick={() => setMobileSelectedActivity(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-[2] gap-2 rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            onClick={handleMobileAdd}
                        >
                            Add to Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Exit Confirm Dialog */}
            <AlertDialog
                open={showExitConfirm}
                onOpenChange={(open) => {
                    setShowExitConfirm(open);
                    if (!open) setPendingAppointmentId(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl w-[90vw] max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAppointmentId === 'BACK'
                                ? 'Discard changes and go back?'
                                : `Discard changes for ${sessionStudent?.firstName || sessionStudent?.fullName || 'this learner'}?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Your current draft has unsaved changes. If you
                            leave, these changes will be lost permanently.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="max-sm:flex-col gap-2">
                        <AlertDialogCancel
                            className="mt-0"
                            onClick={() => setPendingAppointmentId(null)}
                        >
                            Stay
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (pendingAppointmentId === 'BACK') {
                                    performAppointmentSwitch(null);
                                } else if (pendingAppointmentId) {
                                    performAppointmentSwitch(
                                        pendingAppointmentId,
                                    );
                                } else {
                                    performClose();
                                }
                            }}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SessionPlanningModal;
