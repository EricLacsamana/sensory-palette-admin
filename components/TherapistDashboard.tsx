'use client';

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    motion,
    AnimatePresence,
    useDragControls,
    useMotionValue,
    animate,
} from 'framer-motion';
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
    LayoutGrid,
    CalendarDays,
    Minimize2,
    Maximize2,
    Square,
    Loader2,
    ListTodo,
    PanelRightClose,
    PanelRightOpen,
    Flag,
    Play as PlayIcon,
    SkipForward,
    User,
    MonitorPlay,
    AlertCircle,
    CalendarClock,
    Trash2,
    PlayCircle,
    Lock,
    Unlock,
    Pause,
    Droplets,
    BrainCircuit,
    MonitorX,
    BatteryWarning,
    HelpCircle,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

import { me } from '@/api/users';
import {
    getActivitySessionsNew,
    updateActivitySession,
} from '@/api/acitivity-session';
import { getGlobalAnalytics } from '@/api/analytics';
import { cn } from '@/lib/utils';
import { FormatService, calculateElapsedSeconds } from '@/utils/helpers';
import {
    ActivitySessionEntry,
    ActivitySessionResponse,
    ActivitySessionStatus,
    TimeLog,
    PauseReason,
} from '@/types/activitiy-session';

import { ScheduleQueue } from '@/components/ScheduleQueue';
import ActivitySequenceLauncher from '@/components/ActivitySequenceLauncher';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { ActivitySessionLogsTable } from '@/components/ActivitySessionLogsTable';

// --- SUB-COMPONENT: Stat Card ---
const DashboardStatCard = ({
    title,
    value,
    trend,
    icon,
    colorClass,
    isLoading,
}: any) => (
    <div className="bg-white rounded-[24px] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group h-full">
        <div
            className={cn(
                'absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:opacity-[0.07]',
                colorClass,
            )}
        >
            {React.cloneElement(icon as React.ReactElement, { size: 90 })}
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div
                className={cn(
                    'p-2.5 rounded-xl',
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
            {isLoading ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-xl mb-1" />
            ) : (
                <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    {value}
                </div>
            )}
            {trend && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-500" />
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
}) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
        [ActivitySessionStatus.Completed]: {
            label: 'Done',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        },
        [ActivitySessionStatus.InProgress]: {
            label: 'Live',
            className:
                'bg-indigo-50 text-indigo-700 border-indigo-200/60 animate-pulse',
        },
        [ActivitySessionStatus.Queued]: {
            label: 'Queued',
            className: 'bg-blue-50 text-blue-700 border-blue-200/60',
        },
        [ActivitySessionStatus.Pending]: {
            label: 'Pending',
            className: 'bg-amber-50 text-amber-700 border-amber-200/60',
        },
        [ActivitySessionStatus.Cancelled]: {
            label: 'Void',
            className: 'bg-rose-50 text-rose-700 border-rose-200/60',
        },
        [ActivitySessionStatus.Paused]: {
            label: 'Paused',
            className: 'bg-orange-50 text-orange-700 border-orange-200/60',
        },
        [ActivitySessionStatus.Abandoned]: {
            label: 'Dropped',
            className: 'bg-slate-50 text-slate-600 border-slate-200/60',
        },
        [ActivitySessionStatus.Reschedule]: {
            label: 'Resched',
            className: 'bg-violet-50 text-violet-700 border-violet-200/60',
        },
    };

    const statusKey =
        session.activitySessionStatus || ActivitySessionStatus.Pending;
    const { label, className } =
        statusConfig[statusKey] || statusConfig[ActivitySessionStatus.Pending];

    return (
        <div className="flex gap-4 relative group">
            <div className="flex flex-col items-center shrink-0 w-10">
                <div className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 z-10 group-hover:border-indigo-200 group-hover:shadow-sm transition-all overflow-hidden">
                    <Avatar className="h-full w-full rounded-xl">
                        <AvatarImage
                            src={FormatService.formatStrapiMedia(
                                session.activity?.banner,
                                'thumbnail',
                            )}
                            className="object-cover"
                        />
                        <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600 font-black uppercase">
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
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                            {session.activity?.name || 'Unnamed Activity'}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="text-indigo-600">
                                {session.student?.firstName}{' '}
                                {session.student?.lastName?.charAt(0)}.
                            </span>
                            <span className="opacity-40">•</span>
                            <span className="tabular-nums flex items-center gap-1">
                                <Clock size={10} />{' '}
                                {session.startAt
                                    ? format(
                                          new Date(session.startAt),
                                          'h:mm a',
                                      )
                                    : '--:--'}
                            </span>
                        </p>
                    </div>
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-[9px] h-5 px-2 font-black uppercase tracking-widest border',
                            className,
                        )}
                    >
                        {label}
                    </Badge>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function Dashboard() {
    const router = useRouter();
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
                sort: ['updatedAt:desc'],
            },
        ],
        queryFn: getActivitySessionsNew,
    });

    const dateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, []);

    const { data: globalAnalytics, isLoading: isLoadingAnalytics } = useQuery({
        queryKey: ['global-analytics', dateRange],
        queryFn: getGlobalAnalytics,
    });

    const pendingQueue = activitySessions
        .filter(
            (s: any) =>
                s.activitySessionStatus === ActivitySessionStatus.Pending ||
                s.activitySessionStatus === ActivitySessionStatus.Queued ||
                s.activitySessionStatus === ActivitySessionStatus.Reschedule,
        )
        .sort(
            (a: any, b: any) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );

    const strictlyQueuedSessions = pendingQueue
        .filter(
            (s: any) =>
                s.activitySessionStatus === ActivitySessionStatus.Queued,
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
                    $or: [
                        {
                            activitySessionStatus: {
                                $eq: ActivitySessionStatus.InProgress,
                            },
                        },
                        {
                            activitySessionStatus: {
                                $eq: ActivitySessionStatus.Paused,
                            },
                        },
                    ],
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

    const handleLaunchSingleGame = async (session: ActivitySessionResponse) => {
        if (activeSession) {
            toast.error('Session in Progress', {
                description:
                    'Complete current activity before starting a new block.',
            });
            return;
        }

        setIsSheetOpen(false);
        setIsModalOpen(false);

        const toastId = toast.loading('Initiating secure handshake...');

        try {
            await updateActivitySession(session.documentId, {
                activitySessionStatus: ActivitySessionStatus.InProgress,
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            toast.success('Activity Activated', { id: toastId });
        } catch (error) {
            toast.error('Failed to launch session. Check connection.', {
                id: toastId,
            });
        }
    };

    const handleLaunchSequence = async (
        selectedSessions: ActivitySessionResponse[],
    ) => {
        if (activeSession) {
            toast.error('Session in Progress', {
                description:
                    'Complete current activity before starting a new block.',
            });
            return;
        }

        if (!selectedSessions || selectedSessions.length === 0) return;

        setIsSheetOpen(false);
        setIsModalOpen(false);

        const toastId = toast.loading('Initiating Sequence...', {
            description: 'Queueing activities in the database.',
        });

        try {
            const firstSession = selectedSessions[0];
            const queuedSessions = selectedSessions.slice(1);

            await updateActivitySession(firstSession.documentId, {
                activitySessionStatus: ActivitySessionStatus.InProgress,
            });

            if (queuedSessions.length > 0) {
                await Promise.all(
                    queuedSessions.map((session) =>
                        updateActivitySession(session.documentId, {
                            activitySessionStatus: ActivitySessionStatus.Queued,
                        }),
                    ),
                );
            }

            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            toast.success('Sequence Activated & Queued', { id: toastId });
        } catch (error) {
            console.error('ERROR:', error);
            toast.error('Failed to process sequence.', { id: toastId });
        }
    };

    const handleRemoveQueueItem = async (documentId: string) => {
        try {
            await updateActivitySession(documentId, {
                activitySessionStatus: ActivitySessionStatus.Pending,
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            toast.success('Removed from sequence queue');
        } catch (e) {
            toast.error('Failed to remove item from queue');
        }
    };

    const { overviewMetrics } = globalAnalytics || {};

    const widgetSession = activeSession || strictlyQueuedSessions[0];
    const widgetQueued = activeSession
        ? strictlyQueuedSessions
        : strictlyQueuedSessions.slice(1);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden relative">
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.2]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-10">
                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                            <Zap size={14} className="fill-indigo-600" />{' '}
                            Command Center
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                            Good day, {user?.firstName || 'Therapist'}
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2">
                            You have{' '}
                            <span className="text-slate-900 font-bold">
                                {pendingQueue.length} pending sessions
                            </span>{' '}
                            scheduled for today.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-2xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 font-bold text-[10px] uppercase tracking-widest px-6 transition-all shadow-sm"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />{' '}
                                    Agenda Queue
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
                                <ScheduleQueue
                                    sessions={activitySessions}
                                    onSessionClick={handleViewSession}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                {/* --- DYNAMIC GLOBAL STATS GRID --- */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardStatCard
                        title="Total Sessions"
                        value={overviewMetrics?.totalSessionsCompleted || 0}
                        trend="Completed 30d"
                        icon={<Presentation />}
                        colorClass="text-indigo-600"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Global Avg Accuracy"
                        value={`${overviewMetrics?.averageAccuracy || 0}%`}
                        trend="Overall Network"
                        icon={<Target />}
                        colorClass="text-emerald-600"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Total Therapy Time"
                        value={`${overviewMetrics?.totalTherapyHours || 0}h`}
                        trend="Hours Logged 30d"
                        icon={<Clock />}
                        colorClass="text-blue-500"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Active Learners"
                        value={overviewMetrics?.totalActiveStudents || 0}
                        trend="Total Engaged"
                        icon={<SmilePlus />}
                        colorClass="text-amber-500"
                        isLoading={isLoadingAnalytics}
                    />
                </section>

                {/* --- CALENDAR & UP NEXT ROW --- */}
                <section className="grid grid-cols-12 gap-6 items-start">
                    <div className="col-span-12 lg:col-span-8">
                        <Card className="rounded-[32px] border border-slate-200 shadow-sm overflow-hidden bg-white h-[650px] flex flex-col">
                            <CardHeader className="border-b border-slate-50 px-8 py-6 bg-white flex flex-row items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                                        <CalendarIcon
                                            size={18}
                                            className="text-indigo-600"
                                        />{' '}
                                        Clinical Schedule
                                    </CardTitle>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                        Timeline view of all assigned activities
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 min-h-0 bg-slate-50/30">
                                <ActivityCalendar />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12 lg:col-span-4">
                        <Card className="rounded-[32px] border border-slate-200 shadow-sm bg-white h-[650px] flex flex-col">
                            <CardHeader className="border-b border-slate-50 px-8 py-6 flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Sparkles
                                        size={16}
                                        className="text-indigo-500 fill-indigo-500"
                                    />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Up Next / Pending
                                    </span>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="bg-slate-50 text-slate-500 hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest"
                                >
                                    {pendingQueue.length} Queue
                                </Badge>
                            </CardHeader>
                            <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
                                {pendingQueue.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                                        <CalendarIcon
                                            size={40}
                                            className="mb-4 opacity-20 text-indigo-600"
                                        />
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                                            No pending sessions
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        {pendingQueue
                                            .slice(0, 8)
                                            .map(
                                                (
                                                    session: ActivitySessionResponse,
                                                    i: number,
                                                ) => (
                                                    <ActivityFeedItem
                                                        key={
                                                            session.id ||
                                                            session.documentId
                                                        }
                                                        session={session}
                                                        isLast={
                                                            i === 7 ||
                                                            i ===
                                                                pendingQueue.length -
                                                                    1
                                                        }
                                                    />
                                                ),
                                            )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* --- RECENT ACTIVITY LOGS --- */}
                <section>
                    <Card className="rounded-[32px] border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-50 px-8 py-6 flex flex-row items-center justify-between bg-white">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <ActivityIcon
                                        size={18}
                                        className="text-emerald-600"
                                    />{' '}
                                    Recent Activity Logs
                                </CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-slate-50 shadow-sm"
                            >
                                Export Registry
                            </Button>
                        </CardHeader>
                        <div className="p-4">
                            <ActivitySessionLogsTable
                                data={activitySessions.slice(0, 8)}
                            />
                        </div>
                    </Card>
                </section>

                <div className="h-24 w-full shrink-0" aria-hidden="true" />
            </div>

            {selectedSessionData && (
                <ActivitySequenceLauncher
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    learnerName={`${selectedSessionData.primary.student?.firstName} ${selectedSessionData.primary.student?.lastName}`}
                    existingSession={selectedSessionData.primary}
                    activities={selectedSessionData.allDay}
                    onLaunchActivity={handleLaunchSingleGame}
                    onLaunchFullSession={handleLaunchSequence}
                />
            )}

            <AnimatePresence>
                {widgetSession && (
                    <LiveSessionWidget
                        key="live-session-widget"
                        session={widgetSession}
                        queuedSessions={widgetQueued}
                        onLaunchNext={handleLaunchSingleGame}
                        onRemoveQueueItem={handleRemoveQueueItem}
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
    onRemoveQueueItem,
}: {
    session: any;
    queuedSessions: any[];
    onLaunchNext: (session: any) => void;
    onRemoveQueueItem: (documentId: string) => void;
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- FEATURE STATES ---
    const [autoStartEnabled, setAutoStartEnabled] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [isLearnerControlEnabled, setIsLearnerControlEnabled] = useState(
        session.enableLearnerControls || false,
    );

    // PERSISTED HANDS-FREE STATE (UI Level)
    const [isHandsFree, setIsHandsFree] = useState(
        session.isHandsFree || false,
    );

    const queryClient = useQueryClient();

    // 🔥 NEW: LOAD PREFERENCES FROM LOCAL STORAGE ON MOUNT 🔥
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedHandsFree = localStorage.getItem(
                'therapist_hands_free',
            );
            if (storedHandsFree !== null) {
                setIsHandsFree(storedHandsFree === 'true');
            }

            const storedAutoStart = localStorage.getItem(
                'therapist_auto_start',
            );
            if (storedAutoStart !== null) {
                setAutoStartEnabled(storedAutoStart === 'true');
            }
        }
    }, []);

    const updateSessionMutation = useMutation({
        mutationFn: (data: Partial<ActivitySessionEntry>) =>
            updateActivitySession(session.documentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            queryClient.invalidateQueries({ queryKey: ['activity-sessions'] });
        },
    });

    const { mutateAsync } = updateSessionMutation;

    // --- 🔥 UPDATED: TOGGLE HANDS-FREE (Saves to Browser & DB) 🔥 ---
    const toggleHandsFree = async (checked: boolean) => {
        setIsHandsFree(checked);
        if (typeof window !== 'undefined') {
            localStorage.setItem('therapist_hands_free', String(checked));
        }

        try {
            await mutateAsync({ isHandsFree: checked });
            toast.success(
                checked
                    ? 'Hands-Free Mode Active'
                    : 'Manual Handshake Restored',
            );
        } catch (e) {
            toast.error('Failed to update Flow Mode');
        }
    };

    // --- TOGGLE AUTO START (Saves to Browser) ---
    const toggleAutoStart = (checked: boolean) => {
        setAutoStartEnabled(checked);
        if (typeof window !== 'undefined') {
            localStorage.setItem('therapist_auto_start', String(checked));
        }
    };

    // --- STUDENT CONTROLS TOGGLE ---
    const toggleStudentControls = async (checked: boolean) => {
        setIsLearnerControlEnabled(checked);
        try {
            await mutateAsync({ enableLearnerControls: checked });
            toast.success(
                checked
                    ? 'Learner self-regulation enabled'
                    : 'Learner controls locked',
            );
        } catch (e) {
            toast.error('Failed to update settings');
        }
    };

    // Drag and Drop Visual States
    const [dragOverLive, setDragOverLive] = useState(false);
    const [dragOverQueueId, setDragOverQueueId] = useState<string | null>(null);

    // Dialog State
    type ConfirmType =
        | 'stop_unstarted'
        | 'next_unstarted'
        | 'stop_active'
        | 'next_active'
        | null;
    const [confirmType, setConfirmType] = useState<ConfirmType>(null);

    const constraintsRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const isQueuedSession =
        session.activitySessionStatus === ActivitySessionStatus.Queued;
    const isPaused =
        session.activitySessionStatus === ActivitySessionStatus.Paused;

    const durationMinutes = session.activity?.durationMinutes;
    const hasTimer =
        durationMinutes !== null &&
        durationMinutes !== undefined &&
        durationMinutes > 0;
    const durationSeconds = hasTimer ? durationMinutes * 60 : 0;

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timeLeft = hasTimer
        ? Math.max(0, durationSeconds - elapsedSeconds)
        : 0;

    // --- DRAG AND DROP HANDLERS ---
    const handleSwapWithLive = async (droppedDocId: string) => {
        setDragOverLive(false);
        if (isLocked || session.actualStartAt) return;
        if (droppedDocId === session.documentId) return;

        const droppedItem = queuedSessions.find(
            (q) => q.documentId === droppedDocId,
        );
        if (!droppedItem) return;

        const toastId = toast.loading('Swapping sessions...');
        try {
            await updateActivitySession(session.documentId, {
                activitySessionStatus: ActivitySessionStatus.Queued,
                startAt: droppedItem.startAt,
            });
            await updateActivitySession(droppedDocId, {
                activitySessionStatus: session.activitySessionStatus,
                actualStartAt: null,
                startAt: session.startAt,
            });

            queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            queryClient.invalidateQueries({ queryKey: ['activity-sessions'] });
            toast.success('Switched dramatically!', { id: toastId });
        } catch (e) {
            toast.error('Failed to swap sessions', { id: toastId });
        }
    };

    const handleReorderQueue = async (
        droppedDocId: string,
        targetDocId: string,
    ) => {
        setDragOverQueueId(null);
        if (isLocked || droppedDocId === targetDocId) return;

        const droppedItem = queuedSessions.find(
            (q) => q.documentId === droppedDocId,
        );
        const targetItem = queuedSessions.find(
            (q) => q.documentId === targetDocId,
        );
        if (!droppedItem || !targetItem) return;

        const toastId = toast.loading('Reordering queue...');
        try {
            await updateActivitySession(droppedDocId, {
                startAt: targetItem.startAt,
            });
            await updateActivitySession(targetDocId, {
                startAt: droppedItem.startAt,
            });

            queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            queryClient.invalidateQueries({ queryKey: ['activity-sessions'] });
            toast.success('Queue updated', { id: toastId });
        } catch (e) {
            toast.error('Failed to reorder', { id: toastId });
        }
    };

    // --- PAUSE / RESUME HANDLERS ---
    const handlePause = async (reason: PauseReason) => {
        try {
            const newLog: TimeLog = {
                status: 'pause',
                timestamp: new Date().toISOString(),
                reason,
            };
            const updatedLogs = [...(session.timeLogs || []), newLog];

            await mutateAsync({
                activitySessionStatus: ActivitySessionStatus.Paused,
                timeLogs: updatedLogs,
            });
            toast.success(`Session Paused: ${reason}`);
        } catch (e) {
            toast.error('Failed to pause session.');
        }
    };

    const handleResume = async () => {
        try {
            const newLog: TimeLog = {
                status: 'resume',
                timestamp: new Date().toISOString(),
            };
            const updatedLogs = [...(session.timeLogs || []), newLog];

            await mutateAsync({
                activitySessionStatus: ActivitySessionStatus.InProgress,
                timeLogs: updatedLogs,
            });
            toast.success('Session Resumed');
        } catch (e) {
            toast.error('Failed to resume session.');
        }
    };

    const handleStartQueued = async (e?: any) => {
        if (e) e.stopPropagation();
        try {
            await mutateAsync({
                activitySessionStatus: ActivitySessionStatus.InProgress,
            });
            toast.success(
                `Launched ${session.activity?.name}. Awaiting learner.`,
            );
        } catch (err) {
            toast.error('Failed to start queued session.');
        }
    };

    // --- STOP / NEXT WITH CORRECT HANDS-FREE TIMING LOGIC ---
    const handleStop = useCallback(
        async (isAuto = false, confirmed = false) => {
            if (!isAuto && !confirmed) {
                if (!session.actualStartAt) {
                    setConfirmType('stop_unstarted');
                } else {
                    setConfirmType('stop_active');
                }
                return;
            }

            try {
                await mutateAsync({
                    activitySessionStatus: ActivitySessionStatus.Completed,
                    actualEndAt: new Date().toISOString(),
                });
                if (isAuto) toast.info('Time limit reached. Auto-completed.');
                else toast.success('Session Concluded.');
                setConfirmType(null);
            } catch (e) {
                toast.error('Failed to update session status.');
            }
        },
        [mutateAsync, session.actualStartAt],
    );

    const handleNext = useCallback(
        async (isAuto = false, confirmed = false) => {
            if (!isAuto && !confirmed && !isQueuedSession) {
                if (!session.actualStartAt) {
                    setConfirmType('next_unstarted');
                } else {
                    setConfirmType('next_active');
                }
                return;
            }

            try {
                // 1. End Current Session safely
                if (!isQueuedSession) {
                    await mutateAsync({
                        activitySessionStatus: ActivitySessionStatus.Completed,
                        actualEndAt: new Date().toISOString(),
                    });
                }

                // 2. Launch the Next Session in Queue
                if (queuedSessions.length > 0) {
                    const next = queuedSessions[0];

                    const handsFreePayload = isHandsFree
                        ? { isHandsFree: true }
                        : { isHandsFree: false };

                    await updateActivitySession(next.documentId, {
                        activitySessionStatus: ActivitySessionStatus.InProgress,
                        ...handsFreePayload,
                    });

                    await queryClient.invalidateQueries({
                        queryKey: ['live-activity-sessions'],
                    });
                    await queryClient.invalidateQueries({
                        queryKey: ['activity-sessions'],
                    });

                    if (isAuto || isHandsFree)
                        toast.success(
                            `Flowing to Next Activity: ${next.activity?.name}`,
                        );
                    else
                        toast.success(
                            `Launched Next Activity: ${next.activity?.name}`,
                        );
                } else if (isAuto) {
                    toast.info('Time limit reached. Session Auto-completed.');
                }
                setConfirmType(null);
            } catch (e) {
                toast.error('Failed to process next session.');
            }
        },
        [
            mutateAsync,
            session.actualStartAt,
            isQueuedSession,
            queuedSessions,
            queryClient,
            isHandsFree,
        ],
    );

    const resolveUnstarted = async (choice: 'reschedule' | 'abandon') => {
        const action = confirmType;
        setConfirmType(null);

        const newStatus =
            choice === 'reschedule'
                ? ActivitySessionStatus.Reschedule
                : ActivitySessionStatus.Abandoned;

        try {
            await mutateAsync({ activitySessionStatus: newStatus });
            toast.success(
                `Session marked as ${choice === 'reschedule' ? 'Rescheduled' : 'Abandoned'}.`,
            );

            if (action === 'next_unstarted' && queuedSessions.length > 0) {
                const next = queuedSessions[0];

                const handsFreePayload = isHandsFree
                    ? { isHandsFree: true }
                    : {};

                await updateActivitySession(next.documentId, {
                    activitySessionStatus: ActivitySessionStatus.InProgress,
                    ...handsFreePayload,
                });
                queryClient.invalidateQueries({
                    queryKey: ['live-activity-sessions'],
                });
                queryClient.invalidateQueries({
                    queryKey: ['activity-sessions'],
                });
                toast.success(`Launched Next Activity: ${next.activity?.name}`);
            }
        } catch (e) {
            toast.error('Failed to process session update.');
        }
    };

    // AUTO-SNAP EFFECT
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const widgetHeight = isMinimized ? 72 : 420;
        const widgetWidth = isMinimized ? 280 : isSidebarOpen ? 720 : 380;

        const minAllowedY = widgetHeight + 48 - window.innerHeight;
        const minAllowedX = widgetWidth + 48 - window.innerWidth;

        let targetY = y.get();
        let targetX = x.get();

        if (targetY < minAllowedY) targetY = minAllowedY;
        if (targetX < minAllowedX) targetX = minAllowedX;
        if (targetY > 0) targetY = 0;
        if (targetX > 0) targetX = 0;

        if (targetY !== y.get())
            animate(y, targetY, { type: 'spring', bounce: 0, duration: 0.4 });
        if (targetX !== x.get())
            animate(x, targetX, { type: 'spring', bounce: 0, duration: 0.4 });
    }, [isMinimized, isSidebarOpen, y, x]);

    // --- TIMER EFFECT ---
    const isReady =
        !session.actualStartAt ||
        elapsedSeconds > 0 ||
        timeLeft < durationSeconds;

    useEffect(() => {
        if (!session.actualStartAt || isQueuedSession) return;

        let isAutoStopping = false;

        const tick = () => {
            if (isAutoStopping) return false;

            const elapsed = calculateElapsedSeconds(
                session.timeLogs,
                session.actualStartAt,
                session.activitySessionStatus,
            );
            setElapsedSeconds(elapsed);

            if (hasTimer) {
                const remaining = durationSeconds - elapsed;

                if (
                    remaining <= 0 &&
                    session.activitySessionStatus ===
                        ActivitySessionStatus.InProgress
                ) {
                    isAutoStopping = true;

                    if (autoStartEnabled && queuedSessions.length > 0) {
                        handleNext(true);
                    } else {
                        handleStop(true);
                    }

                    return false;
                }
            }
            return true;
        };

        tick();

        if (
            session.activitySessionStatus === ActivitySessionStatus.InProgress
        ) {
            const interval = setInterval(() => {
                const shouldContinue = tick();
                if (!shouldContinue) clearInterval(interval);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [
        session.actualStartAt,
        session.activitySessionStatus,
        session.timeLogs,
        hasTimer,
        durationSeconds,
        handleStop,
        isQueuedSession,
        autoStartEnabled,
        queuedSessions.length,
        handleNext,
    ]);

    const formatTimeDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isCritical =
        hasTimer && timeLeft <= 60 && !isQueuedSession && !isPaused;
    const progressPercentage =
        hasTimer && !isQueuedSession
            ? Math.min(100, (elapsedSeconds / durationSeconds) * 100)
            : isQueuedSession
              ? 0
              : 100;

    return (
        <>
            {/* Modal Animate Presence Code stays exactly the same */}
            <AnimatePresence>
                {confirmType && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    >
                        {/* ... (Keep existing Modal code here) ... */}
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            transition={{
                                type: 'spring',
                                bounce: 0,
                                duration: 0.3,
                            }}
                            className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-6"
                        >
                            {(confirmType === 'stop_unstarted' ||
                                confirmType === 'next_unstarted') && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
                                            <AlertCircle size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            Session Not Started
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            The learner has not initiated the
                                            handshake for this activity yet.
                                            Would you like to reschedule this
                                            for later or abandon it entirely?
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                resolveUnstarted('reschedule')
                                            }
                                            className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            <CalendarClock className="mr-2 h-4 w-4" />{' '}
                                            Reschedule for Later
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                resolveUnstarted('abandon')
                                            }
                                            variant="outline"
                                            className="h-12 w-full rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />{' '}
                                            End Now (Abandon)
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}

                            {confirmType === 'stop_active' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
                                            <Square
                                                size={28}
                                                className="fill-current"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            End Activity?
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            Are you sure you want to conclude
                                            the current activity early? This
                                            will save the current progress and
                                            log the telemetry.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                handleStop(false, true)
                                            }
                                            className="h-12 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Yes, End Activity
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}

                            {confirmType === 'next_active' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
                                            <SkipForward
                                                size={32}
                                                className="fill-current"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            Start Next Activity?
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            This will safely end the current
                                            activity, log the progress, and
                                            immediately launch the next one in
                                            the sequence.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                handleNext(false, true)
                                            }
                                            className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Yes, Start Next
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                ref={constraintsRef}
                className="fixed inset-6 pointer-events-none z-40"
            />

            <motion.div
                drag
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={cn(
                    'fixed bottom-6 right-6 z-50 flex shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/80 ring-1 ring-slate-900/5',
                    isMinimized
                        ? 'rounded-full bg-white/95 backdrop-blur-2xl'
                        : 'rounded-[2.5rem] bg-white/90 backdrop-blur-3xl',
                )}
                style={{ x, y, touchAction: 'none' }}
                layout
            >
                {isMinimized ? (
                    <motion.div
                        layout
                        className="relative group cursor-grab active:cursor-grabbing p-2 pr-3.5 flex items-center gap-3 transition-colors hover:bg-white/50"
                        onPointerDown={(e) => dragControls.start(e)}
                    >
                        <div className="relative shrink-0">
                            <Avatar className="h-10 w-10 rounded-full border-2 border-white shadow-sm">
                                <AvatarImage
                                    src={FormatService.formatStrapiMedia(
                                        session.student?.profilePicture,
                                        'thumbnail',
                                    )}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                    {session.student?.firstName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                                <span
                                    className={cn(
                                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                        isPaused
                                            ? 'bg-amber-400'
                                            : isQueuedSession
                                              ? 'bg-blue-400'
                                              : isCritical
                                                ? 'bg-rose-400'
                                                : 'bg-indigo-400',
                                    )}
                                />
                                <span
                                    className={cn(
                                        'relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white',
                                        isPaused
                                            ? 'bg-amber-500'
                                            : isQueuedSession
                                              ? 'bg-blue-500'
                                              : isCritical
                                                ? 'bg-rose-500'
                                                : 'bg-indigo-500',
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
                                            'text-base font-black tabular-nums tracking-tighter leading-none',
                                            isPaused
                                                ? 'text-amber-500'
                                                : isQueuedSession
                                                  ? 'text-slate-700'
                                                  : isCritical
                                                    ? 'text-rose-500 animate-pulse'
                                                    : 'text-slate-900',
                                        )}
                                    >
                                        {!isQueuedSession
                                            ? !session.actualStartAt
                                                ? 'Waiting'
                                                : formatTimeDuration(
                                                      hasTimer
                                                          ? timeLeft
                                                          : elapsedSeconds,
                                                  )
                                            : 'Queued'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[100px] mt-0.5">
                                        {isPaused
                                            ? 'Paused'
                                            : session.activity?.name}
                                    </span>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="h-3 w-12 bg-slate-200 animate-pulse rounded" />
                                    <div className="h-1.5 w-16 bg-slate-100 animate-pulse rounded" />
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-slate-200/60 mx-0.5" />

                        <div className="flex items-center gap-0.5">
                            {isQueuedSession ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={updateSessionMutation.isPending}
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartQueued(e);
                                    }}
                                >
                                    {updateSessionMutation.isPending ? (
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <PlayIcon
                                            size={14}
                                            className="fill-current"
                                        />
                                    )}
                                </Button>
                            ) : isPaused ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={updateSessionMutation.isPending}
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleResume();
                                    }}
                                >
                                    {updateSessionMutation.isPending ? (
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <PlayIcon
                                            size={14}
                                            className="fill-current"
                                        />
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={updateSessionMutation.isPending}
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    onPointerDown={(e) => e.stopPropagation()}
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
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMinimized(false);
                                }}
                            >
                                <Maximize2 size={14} />
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-row h-[420px]">
                        <motion.div
                            layout
                            className="w-[380px] flex flex-col relative z-10 h-full"
                        >
                            <div
                                onPointerDown={(e) => dragControls.start(e)}
                                className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing group shrink-0"
                            >
                                <div className="w-12 h-1.5 rounded-full bg-slate-300/60 group-hover:bg-slate-400 transition-colors" />
                            </div>

                            <div className="px-7 pb-7 flex-1 flex flex-col justify-between">
                                <div className="flex flex-row items-start justify-between">
                                    <div className="flex gap-3 items-center">
                                        <Avatar className="h-12 w-12 rounded-2xl shadow-sm border border-white/80">
                                            <AvatarImage
                                                src={FormatService.formatStrapiMedia(
                                                    session.student
                                                        ?.profilePicture,
                                                    'thumbnail',
                                                )}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-slate-100 text-indigo-600 font-bold text-base rounded-2xl">
                                                {session.student?.firstName?.charAt(
                                                    0,
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span
                                                        className={cn(
                                                            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                                            isPaused
                                                                ? 'bg-amber-400'
                                                                : isQueuedSession
                                                                  ? 'bg-blue-400'
                                                                  : 'bg-indigo-400',
                                                        )}
                                                    ></span>
                                                    <span
                                                        className={cn(
                                                            'relative inline-flex rounded-full h-1.5 w-1.5',
                                                            isPaused
                                                                ? 'bg-amber-500'
                                                                : isQueuedSession
                                                                  ? 'bg-blue-500'
                                                                  : 'bg-indigo-500',
                                                        )}
                                                    ></span>
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-[9px] font-bold uppercase tracking-widest',
                                                        isPaused
                                                            ? 'text-amber-600'
                                                            : 'text-indigo-600',
                                                    )}
                                                >
                                                    {isPaused
                                                        ? 'Session Paused'
                                                        : isQueuedSession
                                                          ? 'Queued Activity'
                                                          : 'Live Session'}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 leading-tight truncate max-w-[160px]">
                                                {session.activity?.name}
                                            </h3>
                                            <p className="text-xs font-medium text-slate-500">
                                                {session.student?.firstName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 bg-white/50 rounded-full p-1 shadow-sm border border-white">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'h-8 w-8 rounded-full transition-colors',
                                                isSidebarOpen
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white',
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsSidebarOpen(
                                                    !isSidebarOpen,
                                                );
                                            }}
                                            onPointerDown={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            {isSidebarOpen ? (
                                                <PanelRightClose size={15} />
                                            ) : (
                                                <PanelRightOpen size={15} />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMinimized(true);
                                            }}
                                            onPointerDown={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <Minimize2 size={15} />
                                        </Button>
                                    </div>
                                </div>

                                {/* DROP ZONE FOR REPLACING LIVE SESSION */}
                                <div
                                    className={cn(
                                        'flex flex-col items-center justify-center py-4 rounded-3xl transition-all duration-300',
                                        dragOverLive &&
                                            !session.actualStartAt &&
                                            !isLocked
                                            ? 'bg-indigo-50/80 ring-2 ring-indigo-400 scale-[1.02] shadow-inner'
                                            : 'bg-transparent ring-0',
                                    )}
                                    onDragOver={(e) => {
                                        if (
                                            !session.actualStartAt &&
                                            !isLocked
                                        ) {
                                            e.preventDefault();
                                            setDragOverLive(true);
                                        }
                                    }}
                                    onDragLeave={() => setDragOverLive(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const docId =
                                            e.dataTransfer.getData(
                                                'text/plain',
                                            );
                                        handleSwapWithLive(docId);
                                    }}
                                >
                                    <div className="relative mb-6 w-full flex justify-center pointer-events-none">
                                        {isQueuedSession ? (
                                            <div className="text-center">
                                                <PlayCircle
                                                    size={56}
                                                    className="text-indigo-400 mx-auto mb-4"
                                                />
                                                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest leading-none">
                                                    Ready to Start
                                                </span>
                                            </div>
                                        ) : isReady ? (
                                            !session.actualStartAt ? (
                                                <div className="text-center">
                                                    <MonitorPlay
                                                        size={56}
                                                        className={cn(
                                                            'text-indigo-400 mx-auto mb-4 transition-transform',
                                                            dragOverLive
                                                                ? 'scale-125 rotate-12'
                                                                : 'animate-pulse',
                                                        )}
                                                    />
                                                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest leading-none">
                                                        {dragOverLive
                                                            ? 'Drop to Swap'
                                                            : isHandsFree
                                                              ? 'Auto-mounting next activity...'
                                                              : 'Awaiting Learner Handshake'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div
                                                    className={cn(
                                                        'text-6xl font-black tabular-nums tracking-tighter leading-none transition-colors drop-shadow-md',
                                                        isPaused
                                                            ? 'text-amber-500'
                                                            : isCritical
                                                              ? 'text-rose-500 animate-pulse'
                                                              : 'text-slate-900',
                                                    )}
                                                >
                                                    {formatTimeDuration(
                                                        hasTimer
                                                            ? timeLeft
                                                            : elapsedSeconds,
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <div className="h-16 w-48 bg-slate-200/50 animate-pulse rounded-2xl" />
                                        )}
                                    </div>

                                    {session.actualStartAt &&
                                        !isQueuedSession && (
                                            <div className="w-full space-y-2.5 pointer-events-none px-4">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <PlayIcon size={10} />{' '}
                                                        {format(
                                                            new Date(
                                                                session.actualStartAt,
                                                            ),
                                                            'h:mm a',
                                                        )}
                                                    </span>
                                                    {hasTimer && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Flag size={10} />{' '}
                                                            {format(
                                                                new Date(
                                                                    new Date(
                                                                        session.actualStartAt,
                                                                    ).getTime() +
                                                                        durationMinutes *
                                                                            60000,
                                                                ),
                                                                'h:mm a',
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all duration-1000 shadow-sm',
                                                            isPaused
                                                                ? 'bg-amber-400'
                                                                : isCritical
                                                                  ? 'bg-rose-500'
                                                                  : 'bg-indigo-500',
                                                        )}
                                                        style={{
                                                            width: `${progressPercentage}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                </div>

                                <div
                                    className="flex flex-col gap-2 w-full"
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    {isHandsFree &&
                                        !isPaused &&
                                        !isQueuedSession && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full w-fit mx-auto mb-1">
                                                <Zap
                                                    size={12}
                                                    className="text-emerald-500 fill-emerald-500 animate-pulse"
                                                />
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                                                    Hands-Free Flow Active
                                                </span>
                                            </div>
                                        )}

                                    <div className="flex gap-2 w-full">
                                        {isQueuedSession ? (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartQueued(e);
                                                }}
                                                disabled={
                                                    updateSessionMutation.isPending
                                                }
                                                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all"
                                            >
                                                {updateSessionMutation.isPending ? (
                                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                                ) : (
                                                    <PlayIcon className="mr-2 h-4 w-4 fill-current" />
                                                )}
                                                Start Activity
                                            </Button>
                                        ) : (
                                            <>
                                                {/* Stop Button */}
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStop(false);
                                                    }}
                                                    disabled={
                                                        updateSessionMutation.isPending
                                                    }
                                                    variant="outline"
                                                    className="flex-1 h-12 rounded-xl border-slate-200/60 bg-white/50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all"
                                                >
                                                    {updateSessionMutation.isPending &&
                                                    queuedSessions.length ===
                                                        0 ? (
                                                        <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
                                                    ) : (
                                                        <Square className="mr-1.5 h-4 w-4 fill-current" />
                                                    )}
                                                    Stop
                                                </Button>

                                                {/* Pause / Resume Button */}
                                                {isPaused ? (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResume();
                                                        }}
                                                        disabled={
                                                            updateSessionMutation.isPending
                                                        }
                                                        className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all"
                                                    >
                                                        <PlayIcon className="mr-1.5 h-4 w-4 fill-current" />{' '}
                                                        Resume
                                                    </Button>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                disabled={
                                                                    updateSessionMutation.isPending
                                                                }
                                                                variant="outline"
                                                                className="flex-1 h-12 rounded-xl border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all"
                                                            >
                                                                <Pause className="mr-1.5 h-4 w-4 fill-current" />{' '}
                                                                Pause
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="center"
                                                            className="w-56 rounded-xl z-[100] shadow-xl border-slate-100"
                                                        >
                                                            <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
                                                                Select Reason
                                                            </div>
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    handlePause(
                                                                        'Bathroom Break',
                                                                    )
                                                                }
                                                                className="gap-2 cursor-pointer py-2"
                                                            >
                                                                <Droplets
                                                                    size={14}
                                                                    className="text-blue-500"
                                                                />{' '}
                                                                Bathroom Break
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    handlePause(
                                                                        'Behavioral Interruption',
                                                                    )
                                                                }
                                                                className="gap-2 cursor-pointer py-2"
                                                            >
                                                                <BrainCircuit
                                                                    size={14}
                                                                    className="text-indigo-500"
                                                                />{' '}
                                                                Behavioral Issue
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    handlePause(
                                                                        'Tech Issue',
                                                                    )
                                                                }
                                                                className="gap-2 cursor-pointer py-2"
                                                            >
                                                                <MonitorX
                                                                    size={14}
                                                                    className="text-rose-500"
                                                                />{' '}
                                                                Tech Issue
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    handlePause(
                                                                        'Fatigue / Break',
                                                                    )
                                                                }
                                                                className="gap-2 cursor-pointer py-2"
                                                            >
                                                                <BatteryWarning
                                                                    size={14}
                                                                    className="text-amber-500"
                                                                />{' '}
                                                                Fatigue / Break
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    handlePause(
                                                                        'Other',
                                                                    )
                                                                }
                                                                className="gap-2 cursor-pointer py-2 border-t mt-1 text-slate-600"
                                                            >
                                                                <HelpCircle
                                                                    size={14}
                                                                />{' '}
                                                                Other
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {queuedSessions.length > 0 &&
                                        !isQueuedSession && (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNext(false);
                                                }}
                                                disabled={
                                                    updateSessionMutation.isPending
                                                }
                                                className={cn(
                                                    'w-full h-12 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all border',
                                                    isHandsFree
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/20',
                                                )}
                                            >
                                                {updateSessionMutation.isPending ? (
                                                    <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
                                                ) : (
                                                    <SkipForward className="mr-1.5 h-4 w-4 fill-current" />
                                                )}
                                                {isHandsFree
                                                    ? 'Skip to Next (Auto-Mount)'
                                                    : 'Next Activity'}
                                            </Button>
                                        )}
                                </div>
                            </div>
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
                                    className="border-l border-slate-200/50 bg-slate-50/50 flex flex-col overflow-hidden h-full backdrop-blur-xl"
                                >
                                    <div className="p-5 pb-3 flex items-center justify-between w-[320px] shrink-0">
                                        <div className="flex items-center gap-2">
                                            <ListTodo
                                                size={16}
                                                className="text-indigo-600"
                                            />
                                            <span className="text-sm font-bold tracking-tight text-slate-900">
                                                Sequence (
                                                {queuedSessions.length})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    'h-7 w-7 rounded-md transition-colors',
                                                    isLocked
                                                        ? 'text-rose-500 bg-rose-50'
                                                        : 'text-slate-400 hover:bg-slate-200',
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsLocked(!isLocked);
                                                }}
                                                onPointerDown={(e) =>
                                                    e.stopPropagation()
                                                }
                                                title={
                                                    isLocked
                                                        ? 'Unlock drag & drop'
                                                        : 'Lock drag & drop'
                                                }
                                            >
                                                {isLocked ? (
                                                    <Lock size={14} />
                                                ) : (
                                                    <Unlock size={14} />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div
                                        className="px-5 pb-3 w-[320px] flex items-center justify-between border-b border-slate-200/40 mb-3"
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                    >
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={
                                                        isLearnerControlEnabled
                                                    }
                                                    onChange={(e) =>
                                                        toggleStudentControls(
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                                                Allow Learner Self-Pause
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer group ml-4">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={autoStartEnabled}
                                                    onChange={(e) =>
                                                        toggleAutoStart(
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-500"></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                                                Auto-Advance Queue
                                            </span>
                                        </label>
                                    </div>

                                    <div className="px-5 w-[320px] mb-4">
                                        <div
                                            className={cn(
                                                'p-3 rounded-2xl border transition-colors',
                                                isHandsFree
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-white border-slate-200',
                                            )}
                                            onPointerDown={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        Hands-Free Mode
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        Bypass student handshake
                                                    </span>
                                                </div>
                                                <Switch
                                                    checked={isHandsFree}
                                                    onCheckedChange={
                                                        toggleHandsFree
                                                    }
                                                />
                                            </div>

                                            {isHandsFree && (
                                                <div className="pt-2 mt-2 border-t border-emerald-100 flex items-start gap-2">
                                                    <Sparkles
                                                        size={14}
                                                        className="text-emerald-500 shrink-0 mt-0.5"
                                                    />
                                                    <p className="text-[9px] text-emerald-600 leading-relaxed font-bold uppercase tracking-wider">
                                                        Next activities will
                                                        auto-mount immediately
                                                        for the student.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 custom-scrollbar w-[320px]">
                                        {queuedSessions.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                <ListTodo
                                                    size={28}
                                                    className="mb-3"
                                                />
                                                <p className="text-sm font-medium text-center">
                                                    No pending sessions
                                                    <br />
                                                    in the queue.
                                                </p>
                                            </div>
                                        ) : (
                                            queuedSessions.map((qs) => (
                                                <motion.div
                                                    layout
                                                    key={qs.id || qs.documentId}
                                                    draggable={!isLocked}
                                                    onDragStart={(e: any) => {
                                                        e.dataTransfer.setData(
                                                            'text/plain',
                                                            qs.documentId,
                                                        );
                                                        e.dataTransfer.effectAllowed =
                                                            'move';
                                                    }}
                                                    onDragOver={(e: any) => {
                                                        if (isLocked) return;
                                                        e.preventDefault();
                                                        setDragOverQueueId(
                                                            qs.documentId,
                                                        );
                                                    }}
                                                    onDragLeave={() =>
                                                        setDragOverQueueId(null)
                                                    }
                                                    onDrop={(e: any) => {
                                                        e.preventDefault();
                                                        const droppedId =
                                                            e.dataTransfer.getData(
                                                                'text/plain',
                                                            );
                                                        handleReorderQueue(
                                                            droppedId,
                                                            qs.documentId,
                                                        );
                                                    }}
                                                    className={cn(
                                                        'group relative flex items-start gap-3 p-3 rounded-2xl border transition-all duration-300',
                                                        !isLocked
                                                            ? 'cursor-grab active:cursor-grabbing'
                                                            : 'cursor-default',
                                                        dragOverQueueId ===
                                                            qs.documentId
                                                            ? 'bg-indigo-50 border-indigo-300 shadow-md scale-[1.02] z-10'
                                                            : 'border-white bg-white/60 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5',
                                                    )}
                                                >
                                                    <Avatar className="h-10 w-10 rounded-xl shadow-sm shrink-0 pointer-events-none">
                                                        <AvatarImage
                                                            src={FormatService.formatStrapiMedia(
                                                                qs.activity
                                                                    ?.banner,
                                                                'thumbnail',
                                                            )}
                                                        />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold rounded-xl text-xs">
                                                            {qs.activity?.name?.charAt(
                                                                0,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0 pt-0.5 pointer-events-none">
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
                                                                        qs
                                                                            .student
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

                                                    <div className="shrink-0 flex items-center justify-center h-full">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                                                            onPointerDown={(
                                                                e,
                                                            ) =>
                                                                e.stopPropagation()
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRemoveQueueItem(
                                                                    qs.documentId,
                                                                );
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </>
    );
}
