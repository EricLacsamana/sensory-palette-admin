'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { format } from 'date-fns';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { me } from '@/api/users';
import { getActivitySessionsNew } from '@/api/acitivity-session';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { ActivitySessionResponse } from '@/types/activitiy-session';

import { ScheduleAgenda } from '@/components/ScheduleAgenda';
import ActivitySessionModal from '@/components/ActivitySessionModal';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { ActivitySessionLogsTable } from '@/components/ActivitySessionLogs';
import { InitializeSessionButton } from '@/components/SessionPlanningModal/components/InitializeSessionPlanningButton';

// --- SUB-COMPONENT: Stat Card ---
const DashboardStatCard = ({
    title,
    value,
    trend,
    icon,
    colorClass,
}: {
    title: string;
    value: string | number;
    trend?: string;
    icon: React.ReactNode;
    colorClass: string;
}) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group h-full">
        {/* Background Icon Decoration */}
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
}) => {
    return (
        <div className="flex gap-4 relative group">
            {/* Spine */}
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

            {/* Content */}
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
};

// --- MAIN COMPONENT ---

export default function Dashboard() {
    const router = useRouter();

    // State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSessionData, setSelectedSessionData] = useState<{
        primary: ActivitySessionResponse;
        allDay: ActivitySessionResponse[];
    } | null>(null);

    // Queries
    const { data: user } = useQuery({ queryKey: ['me'], queryFn: me });
    const { data: activitySessions = [], isFetching } = useQuery({
        queryKey: ['activity-sessions', { populate: '*' }],
        queryFn: getActivitySessionsNew,
    });

    // Handlers
    const handleViewSession = (
        session: ActivitySessionResponse,
        dayActivities: ActivitySessionResponse[],
    ) => {
        setIsSheetOpen(false);
        setSelectedSessionData({ primary: session, allDay: dayActivities });
        setIsModalOpen(true);
    };

    const handleLaunchGame = (session: ActivitySessionResponse) => {
        setIsSheetOpen(false);
        setIsModalOpen(false);
        const documentId = session.documentId || session.id;
        if (documentId) router.push(`/activity-session/${documentId}`);
    };

    // if (isFetching) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 font-sans text-slate-900 pb-20">
            {/* Background Grid Pattern */}
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

            <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                            <Zap size={14} className="fill-indigo-600" />
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
                        {/* Agenda Sheet - WIRED UP WITH NEW COMPONENT */}
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 font-semibold text-xs uppercase tracking-wide px-4"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Agenda
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-full sm:min-w-[550px] p-0 border-l border-slate-100 shadow-2xl flex flex-col h-full bg-slate-50/50"
                            >
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Daily Agenda</SheetTitle>
                                    <SheetDescription>
                                        Overview
                                    </SheetDescription>
                                </SheetHeader>

                                {/* Using the new ScheduleAgenda component here */}

                                <ScheduleAgenda
                                    sessions={activitySessions}
                                    onSessionClick={handleViewSession}
                                />
                            </SheetContent>
                        </Sheet>

                        {/* Initialize Button */}
                        <InitializeSessionButton />
                    </div>
                </header>

                {/* --- STATS GRID (Restored) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                </div>

                {/* --- MAIN CONTENT ROW --- */}
                <div className="grid grid-cols-12 gap-6 items-start">
                    {/* LEFT: CALENDAR (8/12) */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                            <CardHeader className="border-b border-slate-100 px-6 py-5 bg-slate-50/30 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <CalendarIcon
                                            size={18}
                                            className="text-indigo-600"
                                        />
                                        Clinical Schedule
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Timeline view of all assigned activities
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs font-semibold text-slate-500"
                                >
                                    <LayoutGrid size={14} className="mr-1" />
                                    Month View
                                </Button>
                            </CardHeader>
                            {/* Updated ActivityCalendar Container - No Double Borders */}
                            <CardContent className="p-0 min-h-[385px]">
                                <ActivityCalendar />
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT: UP NEXT FEED (4/12) */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white h-full max-h-[600px] flex flex-col">
                            <CardHeader className="border-b border-slate-100 px-5 py-4 flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Sparkles
                                        size={16}
                                        className="text-amber-500 fill-amber-500"
                                    />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Up Next
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400"
                                >
                                    <MoreHorizontal size={14} />
                                </Button>
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

                            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-9"
                                    onClick={() => setIsSheetOpen(true)}
                                >
                                    View Full Agenda{' '}
                                    <ArrowRight size={12} className="ml-1" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* --- BOTTOM: RECENT LOGS TABLE (Restored) --- */}
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
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-medium border-slate-200"
                            >
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <div className="p-2">
                        <ActivitySessionLogsTable data={activitySessions} />
                    </div>
                </Card>
            </div>

            {/* --- MODAL --- */}
            {selectedSessionData && (
                <ActivitySessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    learnerName={`${selectedSessionData.primary.student?.firstName} ${selectedSessionData.primary.student?.lastName}`}
                    existingSession={selectedSessionData.primary}
                    activities={selectedSessionData.allDay}
                    onLaunchActivity={handleLaunchGame}
                    onLaunchFullSession={(all: any[]) =>
                        handleLaunchGame(all[0])
                    }
                />
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8 min-h-screen bg-[#F8FAFC]">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-11 w-24 rounded-xl" />
                    <Skeleton className="h-11 w-32 rounded-xl" />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-12 gap-6">
                <Skeleton className="col-span-8 h-[500px] rounded-2xl" />
                <Skeleton className="col-span-4 h-[500px] rounded-2xl" />
            </div>
            <Skeleton className="h-[300px] rounded-2xl" />
        </div>
    );
}
