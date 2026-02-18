'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Ensure useQueryClient is here
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    Presentation,
    TrendingUp,
    Sparkles,
    Calendar as CalendarIcon,
    Activity as ActivityIcon,
    Zap,
    Target,
    SmilePlus,
    Clock,
    ArrowRight,
    MoreHorizontal,
    LayoutGrid,
    CalendarDays,
    Minimize2,
    Maximize2,
    Square,
    Loader2,
    GripHorizontal,
    ListTodo,
    PanelRightClose,
    PanelRightOpen,
    Flag,
    Play as PlayIcon,
    SkipForward,
    User,
    IdCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { me } from '@/api/users';
import {
    getActivitySessionsNew,
    updateActivitySession,
} from '@/api/acitivity-session';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { ActivitySessionResponse } from '@/types/activitiy-session';

import { ScheduleAgenda } from '@/components/ScheduleAgenda';
import ActivitySessionModal from '@/components/ActivitySessionModal';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { ActivitySessionLogsTable } from '@/components/ActivitySessionLogs';

// --- SUB-COMPONENT: Stat Card ---
const DashboardStatCard = ({ title, value, trend, icon, colorClass }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group h-full">
        <div
            className={cn(
                'absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:opacity-[0.07]',
                colorClass,
            )}
        >
            {React.cloneElement(icon as React.ReactElement, { size: 80 })}
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div
                className={cn(
                    'p-2 rounded-lg',
                    colorClass
                        .replace('text-', 'bg-')
                        .replace('600', '50')
                        .replace('500', '50'),
                )}
            >
                {React.cloneElement(icon as React.ReactElement, {
                    size: 18,
                    className: colorClass,
                })}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                {title}
            </span>
        </div>
        <div className="relative z-10">
            <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {value}
            </div>
            {trend && (
                <div className="text-[10px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp size={10} />
                    {trend}
                </div>
            )}
        </div>
    </div>
);

// --- SUB-COMPONENT: Feed Item ---
const ActivityFeedItem = ({
    session,
    isLast,
}: {
    session: ActivitySessionResponse;
    isLast: boolean;
}) => (
    <div className="flex gap-4 relative group">
        <div className="flex flex-col items-center shrink-0 w-8">
            <div className="h-8 w-8 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 z-10 group-hover:border-indigo-200 group-hover:shadow-sm transition-all">
                <Avatar className="h-full w-full rounded-lg">
                    <AvatarImage
                        src={FormatService.formatStrapiMedia(
                            session.activity?.banner,
                            'thumbnail',
                        )}
                        className="object-cover"
                    />
                    <AvatarFallback className="text-[9px] bg-indigo-50 text-indigo-600 font-bold">
                        {session.activity?.name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            </div>
            {!isLast && (
                <div className="w-px flex-1 bg-slate-100 my-1 group-hover:bg-slate-200 transition-colors" />
            )}
        </div>
        <div className="flex-1 pb-6 pt-1 min-w-0">
            <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                        {session.activity?.name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                        <span className="text-indigo-600">
                            {session.student?.firstName}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">
                            {session.startAt
                                ? format(new Date(session.startAt), 'h:mm a')
                                : '--:--'}
                        </span>
                    </p>
                </div>
                <Badge
                    variant="secondary"
                    className={cn(
                        'text-[9px] h-5 px-1.5 font-bold uppercase tracking-wide border-0',
                        session.activitySessionStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600',
                    )}
                >
                    {session.activitySessionStatus === 'completed'
                        ? 'Done'
                        : 'Pending'}
                </Badge>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export default function Dashboard() {
    const router = useRouter();

    // 1. Initialize Query Client for manual cache busting
    const queryClient = useQueryClient();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSessionData, setSelectedSessionData] = useState<{
        primary: ActivitySessionResponse;
        allDay: ActivitySessionResponse[];
    } | null>(null);

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: me });

    const { data: activitySessions = [] } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                populate: {
                    student: { populate: '*' },
                    activity: { populate: '*' },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
    });

    const pendingQueue = activitySessions
        .filter(
            (s: any) =>
                s.activitySessionStatus === 'pending' ||
                s.activitySessionStatus === 'reschedule_requested',
        )
        .sort(
            (a: any, b: any) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );

    const { data: liveActivitySessionsRaw = [] } = useQuery({
        queryKey: [
            'live-activity-sessions',
            {
                populate: {
                    student: { populate: '*' },
                    activity: { populate: '*' },
                },
                filters: {
                    actualStartAt: { $notNull: true },
                    actualEndAt: { $null: true },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        refetchInterval: 3000,
    });

    const activeSession =
        Array.isArray(liveActivitySessionsRaw) &&
        liveActivitySessionsRaw.length > 0
            ? liveActivitySessionsRaw[0]
            : null;

    const handleViewSession = (
        session: ActivitySessionResponse,
        dayActivities: ActivitySessionResponse[],
    ) => {
        setIsSheetOpen(false);
        setSelectedSessionData({ primary: session, allDay: dayActivities });
        setIsModalOpen(true);
    };

    // 2. THE FIX: Update Launch Handler
    const handleLaunchGame = async (session: ActivitySessionResponse) => {
        setIsSheetOpen(false);
        setIsModalOpen(false);

        // Use a loading toast so the user knows something is happening
        const toastId = toast.loading('Initiating secure connection...');

        try {
            await updateActivitySession(session.documentId, {
                activitySessionStatus: 'in_progress',
                actualStartAt: new Date().toISOString(),
            });

            // 🔥 CRITICAL: Force React Query to re-fetch the data to update the Agenda
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });

            toast.success('Sequence Locked & Launched', { id: toastId });
        } catch (error) {
            console.error('Launch Error:', error);
            toast.error('Failed to launch session. Check connection.', {
                id: toastId,
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">
            {/* Background Grid Pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-10">
                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                            <Zap size={14} className="fill-indigo-600" />{' '}
                            Command Center
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                            Good day, {user?.firstName || 'Therapist'}
                        </h1>
                        <p className="text-sm font-medium text-slate-500">
                            You have{' '}
                            <span className="text-slate-900 font-bold">
                                {activitySessions.length} sessions
                            </span>{' '}
                            scheduled for today.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white hover:shadow-sm font-semibold text-xs uppercase tracking-wide px-4 transition-all"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />{' '}
                                    Agenda
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-full sm:min-w-[320px] p-0 border-l border-slate-100 shadow-2xl flex flex-col h-full bg-slate-50/50"
                            >
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Daily Agenda</SheetTitle>
                                    <SheetDescription>
                                        Overview
                                    </SheetDescription>
                                </SheetHeader>
                                <ScheduleAgenda
                                    sessions={activitySessions}
                                    onSessionClick={handleViewSession}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                {/* --- STATS GRID --- */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardStatCard
                        title="Total Sessions"
                        value={activitySessions.length}
                        trend="+12% vs last week"
                        icon={<Presentation />}
                        colorClass="text-indigo-600"
                    />
                    <DashboardStatCard
                        title="Avg. Accuracy"
                        value="84%"
                        trend="+2.4% improvement"
                        icon={<Target />}
                        colorClass="text-emerald-600"
                    />
                    <DashboardStatCard
                        title="Time Logged"
                        value="5h 20m"
                        trend="On track"
                        icon={<Clock />}
                        colorClass="text-blue-500"
                    />
                    <DashboardStatCard
                        title="Active Learners"
                        value="12"
                        trend="Stable"
                        icon={<SmilePlus />}
                        colorClass="text-amber-500"
                    />
                </section>

                {/* --- CALENDAR & UP NEXT ROW --- */}
                <section className="grid grid-cols-12 gap-6 items-start">
                    <div className="col-span-12 lg:col-span-8">
                        <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white h-[600px] flex flex-col">
                            <CardHeader className="border-b border-slate-100 px-6 py-5 bg-slate-50/30 flex flex-row items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                                        <CalendarIcon
                                            size={18}
                                            className="text-indigo-600"
                                        />{' '}
                                        Clinical Schedule
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Timeline view of all assigned activities
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 min-h-0">
                                <ActivityCalendar />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12 lg:col-span-4">
                        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white h-[600px] flex flex-col">
                            <CardHeader className="border-b border-slate-100 px-5 py-4 flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Sparkles
                                        size={16}
                                        className="text-indigo-500 fill-indigo-500"
                                    />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Up Next
                                    </span>
                                </div>
                            </CardHeader>
                            <div className="flex-1 overflow-y-auto p-5 relative">
                                {activitySessions.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                                        <CalendarIcon
                                            size={32}
                                            className="mb-2 opacity-20"
                                        />
                                        <p className="text-sm font-medium">
                                            No sessions scheduled
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        {activitySessions
                                            .slice(0, 6)
                                            .map((session: any, i: number) => (
                                                <ActivityFeedItem
                                                    key={
                                                        session.id ||
                                                        session.documentId
                                                    }
                                                    session={session}
                                                    isLast={i === 5}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* --- RECENT ACTIVITY LOGS --- */}
                <section>
                    <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-100 px-6 py-5 flex flex-row items-center justify-between bg-white">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <ActivityIcon
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    Recent Activity Logs
                                </CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-medium border-slate-200"
                            >
                                Export CSV
                            </Button>
                        </CardHeader>
                        <div className="p-2">
                            <ActivitySessionLogsTable
                                data={activitySessions.slice(0, 5)}
                            />
                        </div>
                    </Card>
                </section>

                <div className="h-24 w-full shrink-0" aria-hidden="true" />
            </div>

            {selectedSessionData && (
                <ActivitySessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    learnerName={`${selectedSessionData.primary.student?.firstName} ${selectedSessionData.primary.student?.lastName}`}
                    existingSession={selectedSessionData.primary}
                    activities={selectedSessionData.allDay}
                    onLaunchActivity={handleLaunchGame}
                    onLaunchFullSession={
                        (all: any[]) => handleLaunchGame(all[0]) // Starts the first sequence
                    }
                />
            )}

            {/* --- THE MOVABLE, INTERACTIVE WIDGET --- */}
            <AnimatePresence>
                {activeSession && (
                    <LiveSessionWidget
                        session={activeSession}
                        queuedSessions={pendingQueue}
                        onLaunchNext={handleLaunchGame}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUB-COMPONENT: Live Session Widget ---
function LiveSessionWidget({
    session,
    queuedSessions,
    onLaunchNext,
}: {
    session: any;
    queuedSessions: any[];
    onLaunchNext: (session: any) => void;
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isReady, setIsReady] = useState(false); // Added for loading state

    const dragControls = useDragControls();
    const queryClient = useQueryClient();

    const durationMinutes = session.activity?.durationMinutes || 15;
    const durationSeconds = durationMinutes * 60;
    const [timeLeft, setTimeLeft] = useState(durationSeconds);

    const updateSessionMutation = useMutation({
        mutationFn: (data: any) =>
            updateActivitySession(session.documentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            queryClient.invalidateQueries({ queryKey: ['activity-sessions'] });
        },
    });

    useEffect(() => {
        if (!session.actualStartAt) return;
        const startTime = new Date(session.actualStartAt).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remaining = durationSeconds - elapsedSeconds;

            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                handleStop(true);
            } else {
                setTimeLeft(remaining);
            }
            setIsReady(true); // Data is calculated and ready to show
        }, 1000);

        return () => clearInterval(interval);
    }, [session.actualStartAt, durationSeconds]);

    const handleStop = async (isAuto = false) => {
        try {
            await updateSessionMutation.mutateAsync({
                activitySessionStatus: 'completed',
                actualEndAt: new Date().toISOString(),
            });
            if (isAuto) toast.info('Time elapsed. Session auto-completed.');
            else toast.success('Session Concluded.');
        } catch (e) {
            toast.error('Failed to end session.');
        }
    };

    const handleNext = async () => {
        try {
            await updateSessionMutation.mutateAsync({
                activitySessionStatus: 'completed',
                actualEndAt: new Date().toISOString(),
            });
            toast.success('Session Concluded.');
            if (queuedSessions.length > 0) {
                onLaunchNext(queuedSessions[0]);
            }
        } catch (e) {
            toast.error('Failed to skip to next session.');
        }
    };

    const formatTimeDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isCritical = timeLeft <= 60;
    const progressPercentage =
        ((durationSeconds - timeLeft) / durationSeconds) * 100;
    const startDate = session.actualStartAt
        ? new Date(session.actualStartAt)
        : new Date();
    const estimatedEndDate = new Date(
        startDate.getTime() + durationMinutes * 60000,
    );

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={{ top: -800, left: -1200, right: 0, bottom: 0 }}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
                'fixed bottom-6 right-6 z-50 flex shadow-2xl',
                isMinimized ? 'rounded-full' : 'rounded-3xl',
            )}
            style={{ touchAction: 'none' }}
            layout
        >
            {isMinimized ? (
                <motion.div
                    layout
                    className="relative group cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <Card className="rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/80 p-1.5 pr-2 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] transition-all duration-300">
                        <div className="relative">
                            <Avatar className="h-10 w-10 rounded-full border border-slate-100 shadow-sm">
                                <AvatarImage
                                    src={FormatService.formatStrapiMedia(
                                        session.student?.profilePicture,
                                        'thumbnail',
                                    )}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-xs">
                                    {session.student?.firstName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                                <span
                                    className={cn(
                                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                        isCritical
                                            ? 'bg-rose-400'
                                            : 'bg-emerald-400',
                                    )}
                                />
                                <span
                                    className={cn(
                                        'relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white',
                                        isCritical
                                            ? 'bg-rose-500'
                                            : 'bg-emerald-500',
                                    )}
                                />
                            </span>
                        </div>
                        <div
                            className="flex flex-col justify-center min-w-[90px] cursor-pointer"
                            onPointerDownCapture={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(false);
                            }}
                        >
                            {isReady ? (
                                <>
                                    <span
                                        className={cn(
                                            'text-sm font-black tabular-nums tracking-tight leading-none',
                                            isCritical
                                                ? 'text-rose-500 animate-pulse'
                                                : 'text-slate-900',
                                        )}
                                    >
                                        {formatTimeDuration(timeLeft)}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[110px] leading-tight mt-1">
                                        {session.activity?.name}
                                    </span>
                                </>
                            ) : (
                                <div className="space-y-1">
                                    <div className="h-3 w-12 bg-slate-100 animate-pulse rounded" />
                                    <div className="h-2 w-16 bg-slate-50 animate-pulse rounded" />
                                </div>
                            )}
                        </div>
                        <div className="h-6 w-px bg-slate-100 mx-1" />
                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={updateSessionMutation.isPending}
                                className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                onPointerDownCapture={(e) =>
                                    e.stopPropagation()
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStop(false);
                                }}
                            >
                                {updateSessionMutation.isPending ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Square
                                        size={14}
                                        className={
                                            isCritical
                                                ? 'fill-rose-500 text-rose-500'
                                                : 'fill-current'
                                        }
                                    />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                onPointerDownCapture={(e) =>
                                    e.stopPropagation()
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMinimized(false);
                                }}
                            >
                                <Maximize2 size={14} />
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            ) : (
                <Card className="rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-row">
                    <motion.div
                        layout
                        className="w-[380px] flex flex-col relative bg-white z-10"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-teal-400 to-indigo-500 z-10" />
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="w-full h-8 flex items-center justify-center cursor-move hover:bg-slate-50 transition-colors pt-1"
                        >
                            <GripHorizontal
                                size={16}
                                className="text-slate-300"
                            />
                        </div>
                        <div className="px-6 pb-2 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100/50">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    Live Session
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'h-8 w-8 rounded-xl transition-colors',
                                        isSidebarOpen
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50',
                                    )}
                                    onClick={() =>
                                        setIsSidebarOpen(!isSidebarOpen)
                                    }
                                    onPointerDownCapture={(e) =>
                                        e.stopPropagation()
                                    }
                                >
                                    {isSidebarOpen ? (
                                        <PanelRightClose size={16} />
                                    ) : (
                                        <PanelRightOpen size={16} />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                                    onClick={() => setIsMinimized(true)}
                                    onPointerDownCapture={(e) =>
                                        e.stopPropagation()
                                    }
                                >
                                    <Minimize2 size={16} />
                                </Button>
                            </div>
                        </div>
                        <CardContent className="px-6 pb-6 pt-2 flex flex-col items-center text-center">
                            <div className="space-y-1 mb-5 min-h-[52px] flex flex-col justify-center">
                                {isReady ? (
                                    <>
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                                            {session.activity?.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-1.5 text-slate-500">
                                            <User size={12} />
                                            <span className="text-xs font-medium">
                                                Learner:{' '}
                                                {session.student?.firstName}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2 flex flex-col items-center">
                                        <div className="h-6 w-48 bg-slate-100 animate-pulse rounded-lg" />
                                        <div className="h-4 w-32 bg-slate-50 animate-pulse rounded-md" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 w-full gap-3 mb-6">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                        <PlayIcon
                                            size={12}
                                            className="fill-slate-400"
                                        />{' '}
                                        Started
                                    </span>
                                    <span className="text-sm font-mono font-semibold text-slate-700">
                                        {format(startDate, 'h:mm a')}
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                        <Flag
                                            size={12}
                                            className="text-slate-400"
                                        />{' '}
                                        Est. End
                                    </span>
                                    <span className="text-sm font-mono font-semibold text-slate-700">
                                        {format(estimatedEndDate, 'h:mm a')}
                                    </span>
                                </div>
                            </div>
                            <div className="relative mb-6 w-full h-[72px] flex items-center justify-center">
                                {isReady ? (
                                    <div
                                        className={cn(
                                            'text-7xl font-bold tabular-nums tracking-tight transition-colors',
                                            isCritical
                                                ? 'text-rose-500 animate-pulse'
                                                : 'text-slate-900',
                                        )}
                                    >
                                        {formatTimeDuration(timeLeft)}
                                    </div>
                                ) : (
                                    <div className="h-16 w-48 bg-slate-100 animate-pulse rounded-2xl" />
                                )}
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-1000',
                                        isCritical
                                            ? 'bg-rose-500'
                                            : 'bg-emerald-500',
                                    )}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <div
                                className="flex gap-3 w-full"
                                onPointerDownCapture={(e) =>
                                    e.stopPropagation()
                                }
                            >
                                <Button
                                    onClick={() => handleStop(false)}
                                    disabled={updateSessionMutation.isPending}
                                    variant="outline"
                                    className={cn(
                                        'h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95',
                                        queuedSessions.length > 0
                                            ? 'flex-1'
                                            : 'w-full bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-rose-200 hover:text-white',
                                    )}
                                >
                                    {updateSessionMutation.isPending &&
                                    queuedSessions.length === 0 ? (
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    ) : (
                                        <Square className="mr-2 h-4 w-4 fill-current" />
                                    )}
                                    End
                                </Button>
                                {queuedSessions.length > 0 && (
                                    <Button
                                        onClick={handleNext}
                                        disabled={
                                            updateSessionMutation.isPending
                                        }
                                        className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-md shadow-indigo-200 transition-all active:scale-95"
                                    >
                                        {updateSessionMutation.isPending ? (
                                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                        ) : (
                                            <>
                                                Next Activity{' '}
                                                <SkipForward className="ml-2 h-4 w-4 fill-current" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </motion.div>

                    <AnimatePresence initial={false}>
                        {isSidebarOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 320, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    ease: 'easeInOut',
                                }}
                                className="border-l border-slate-100 bg-slate-50 flex flex-col overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-200 bg-white flex items-center gap-2 w-[320px] shrink-0">
                                    <ListTodo
                                        size={18}
                                        className="text-indigo-600"
                                    />
                                    <span className="text-sm font-bold tracking-tight text-slate-900">
                                        Upcoming Queue ({queuedSessions.length})
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar w-[320px]">
                                    {queuedSessions.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 mt-10">
                                            <ListTodo
                                                size={32}
                                                className="mb-2"
                                            />
                                            <p className="text-sm font-medium text-center">
                                                No pending sessions
                                                <br />
                                                in the queue.
                                            </p>
                                        </div>
                                    ) : (
                                        queuedSessions.map((qs) => (
                                            <div
                                                key={qs.id}
                                                className="group relative flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md transition-all duration-200"
                                            >
                                                <Avatar className="h-10 w-10 rounded-lg border border-slate-100 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                                    <AvatarImage
                                                        src={FormatService.formatStrapiMedia(
                                                            qs.activity?.banner,
                                                            'thumbnail',
                                                        )}
                                                    />
                                                    <AvatarFallback className="bg-slate-50 text-slate-600 font-bold rounded-lg text-xs">
                                                        {qs.activity?.name?.charAt(
                                                            0,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors leading-tight">
                                                        {qs.activity?.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <User
                                                                size={12}
                                                                className="text-slate-400"
                                                            />
                                                            <span className="text-[10px] font-medium text-slate-500 truncate">
                                                                {
                                                                    qs.student
                                                                        ?.firstName
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock
                                                                size={12}
                                                                className="text-slate-400"
                                                            />
                                                            <span className="text-[10px] font-mono font-semibold text-slate-500">
                                                                {FormatService.formatTime(
                                                                    qs.startAt,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            )}
        </motion.div>
    );
}
