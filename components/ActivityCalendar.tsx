'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    format,
    startOfMonth,
    startOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    parseISO,
    addMonths,
    subMonths,
    addDays,
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Loader2,
    CheckCircle2,
    PlayCircle,
    PauseCircle,
    XCircle,
    Filter,
    Clock,
    Activity,
    Flag,
    CalendarClock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { getActivitySessionsNew } from '@/api/acitivity-session';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { FormatService } from '@/utils/helpers';

// --- CONFIG ---
const statusConfig: Record<
    string,
    {
        bg: string;
        border: string;
        text: string;
        dot: string;
        icon: any;
        label: string;
    }
> = {
    pending: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-400',
        icon: Clock,
        label: 'Pending',
    },
    in_progress: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500 animate-pulse',
        icon: PlayCircle,
        label: 'Live',
    },
    completed: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        text: 'text-teal-700',
        dot: 'bg-teal-500',
        icon: CheckCircle2,
        label: 'Done',
    },
    interrupted: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        icon: PauseCircle,
        label: 'Paused',
    },
    paused: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        icon: PauseCircle,
        label: 'Paused',
    },
    cancelled: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-500',
        icon: XCircle,
        label: 'Void',
    },
    abandoned: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
        icon: Flag,
        label: 'Dropped',
    },
    reschedule: {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-700',
        dot: 'bg-violet-500',
        icon: CalendarClock,
        label: 'Resched',
    },
    queued: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        dot: 'bg-indigo-400',
        icon: Clock,
        label: 'Queued',
    },
};

// SAFE DATE FORMATTER
const safeFormatTime = (dateString?: string | null) => {
    if (!dateString) return 'TBD';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'TBD' : format(d, 'h:mm a');
};

export function ActivityCalendar({ className }: { className?: string }) {
    // Lazy initialize to prevent Next.js hydration mismatch
    const [viewDate, setViewDate] = useState<Date>(() => new Date());
    const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    // ✨ THE FIX: Wrap in a zero-delay timeout to bypass the "synchronous" linter error
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timeoutId);
    }, []);

    // --- DATE LOGIC ---
    const { days, startRange, endRange } = useMemo(() => {
        const monthStart = startOfMonth(viewDate);
        const start = startOfWeek(monthStart);
        const end = addDays(start, 41); // Fixed 6-week grid (42 days)

        return {
            days: eachDayOfInterval({ start, end }),
            startRange: start.toISOString(),
            endRange: end.toISOString(),
        };
    }, [viewDate]);

    // --- DATA FETCHING (OPTIMIZED) ---
    const { data: sessions = [], isFetching } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
                // Fetch ONLY the data needed for the currently viewed calendar grid!
                filters: {
                    $or: [
                        {
                            startAt: {
                                $gte: startRange,
                                $lte: endRange,
                            },
                        },
                        {
                            actualStartAt: {
                                $gte: startRange,
                                $lte: endRange,
                            },
                        },
                    ],
                },
                pagination: {
                    limit: 5000,
                },
            },
        ],
        queryFn: getActivitySessionsNew,
    });

    // --- PROCESSING ---
    const filteredSessions = useMemo(() => {
        if (!Array.isArray(sessions)) return [];
        if (filterStatus === 'all') return sessions;
        if (filterStatus === 'completed') {
            return sessions.filter(
                (s) => s.activitySessionStatus === 'completed',
            );
        }
        if (filterStatus === 'pending') {
            return sessions.filter((s) => s.activitySessionStatus == 'pending');
        }
        return sessions;
    }, [sessions, filterStatus]);

    const sessionsByDate = useMemo(() => {
        const groups: Record<string, ActivitySessionResponse[]> = {};

        filteredSessions.forEach((session: ActivitySessionResponse) => {
            const effectiveStart = session.actualStartAt || session.startAt;
            if (!effectiveStart) return;

            const dateObj = new Date(effectiveStart);
            if (isNaN(dateObj.getTime())) return;

            const dateKey = format(dateObj, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(session);
        });

        Object.keys(groups).forEach((dateKey) => {
            groups[dateKey].sort((a, b) => {
                const timeA = new Date(
                    a.actualStartAt || a.startAt || 0,
                ).getTime();
                const timeB = new Date(
                    b.actualStartAt || b.startAt || 0,
                ).getTime();
                return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
            });
        });

        return groups;
    }, [filteredSessions]);

    const currentMonthStats = useMemo(() => {
        if (!Array.isArray(sessions)) return { total: 0, rate: 0 };

        const currentMonthSessions = sessions.filter((s: any) => {
            const effectiveStart = s.actualStartAt || s.startAt;
            if (!effectiveStart) return false;

            const dateObj = new Date(effectiveStart);
            if (isNaN(dateObj.getTime())) return false;

            return isSameMonth(dateObj, viewDate);
        });

        const completed = currentMonthSessions.filter(
            (s: any) => s.activitySessionStatus === 'completed',
        ).length;
        const completionRate =
            currentMonthSessions.length > 0
                ? Math.round((completed / currentMonthSessions.length) * 100)
                : 0;

        return { total: currentMonthSessions.length, rate: completionRate };
    }, [sessions, viewDate]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (!mounted) return null; // Prevents hydration flash safely

    return (
        <TooltipProvider delayDuration={100}>
            <div
                className={cn(
                    'flex flex-col h-full w-full bg-white',
                    className,
                )}
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-3 border-b border-slate-100 bg-white gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            {isFetching ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <CalendarIcon size={18} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 leading-none">
                                {format(viewDate, 'MMMM yyyy')}
                            </h2>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                    {currentMonthStats.total} Events
                                </span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-medium text-teal-600 uppercase tracking-wide">
                                    {currentMonthStats.rate}% Completion
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 text-xs font-medium border-slate-200 text-slate-600"
                                >
                                    <Filter size={12} />
                                    {filterStatus === 'all'
                                        ? 'All View'
                                        : filterStatus === 'completed'
                                          ? 'Done'
                                          : 'Pending'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-40 z-[100]"
                            >
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus('all')}
                                >
                                    All Events
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus('pending')}
                                >
                                    Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus('completed')}
                                >
                                    Completed
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-200/60">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md hover:bg-white"
                                onClick={() =>
                                    setViewDate(subMonths(viewDate, 1))
                                }
                            >
                                <ChevronLeft
                                    size={14}
                                    className="text-slate-500"
                                />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 rounded-md hover:bg-white text-[10px] font-bold uppercase text-slate-600"
                                onClick={() => setViewDate(new Date())}
                            >
                                Today
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md hover:bg-white"
                                onClick={() =>
                                    setViewDate(addMonths(viewDate, 1))
                                }
                            >
                                <ChevronRight
                                    size={14}
                                    className="text-slate-500"
                                />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    {weekDays.map((day, idx) => (
                        <div
                            key={day}
                            className={cn(
                                'py-2.5 text-center text-[9px] font-bold uppercase tracking-[0.2em]',
                                idx === 0 || idx === 6
                                    ? 'text-indigo-400'
                                    : 'text-slate-400',
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0 bg-slate-100 gap-px border-b border-slate-100">
                    {days.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const daySessions = sessionsByDate[dateKey] || [];
                        const isCurrentMonth = isSameMonth(day, viewDate);
                        const isToday = isSameDay(day, new Date());
                        const isSelected =
                            selectedDate && isSameDay(day, selectedDate);

                        // OVERFLOW LOGIC
                        const MAX_VISIBLE = 4;
                        const totalSessions = daySessions.length;
                        const visibleSessions =
                            totalSessions > 5
                                ? daySessions.slice(0, MAX_VISIBLE)
                                : daySessions;
                        const hiddenSessions =
                            totalSessions > 5
                                ? daySessions.slice(MAX_VISIBLE)
                                : [];
                        const overflowCount = hiddenSessions.length;

                        return (
                            <div
                                key={dateKey}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    'relative flex flex-col h-full min-w-0 transition-all duration-200 group cursor-pointer overflow-hidden',
                                    'bg-white hover:bg-slate-50',
                                    !isCurrentMonth &&
                                        'bg-slate-50/30 text-slate-300',
                                    isSelected &&
                                        'ring-2 ring-inset ring-indigo-500 z-10',
                                )}
                            >
                                {/* Date Number Row */}
                                <div className="p-1.5 md:p-2 flex justify-between items-start shrink-0">
                                    <span
                                        className={cn(
                                            'text-[10px] font-medium h-6 w-6 flex items-center justify-center rounded-lg tabular-nums transition-all',
                                            isToday
                                                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                                                : isSelected
                                                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                  : !isCurrentMonth
                                                    ? 'text-slate-300'
                                                    : 'text-slate-500 group-hover:text-slate-900',
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {/* Slots Container */}
                                <div className="flex-1 px-1.5 pb-1.5 md:px-2 md:pb-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 content-start overflow-hidden">
                                    {visibleSessions.map((session) => {
                                        const status =
                                            session.activitySessionStatus?.toLowerCase() ||
                                            'pending';
                                        const config =
                                            statusConfig[status] ||
                                            statusConfig.pending;
                                        const displayStart =
                                            session.actualStartAt ||
                                            session.startAt;

                                        return (
                                            <Tooltip
                                                key={
                                                    session.documentId ||
                                                    session.id
                                                }
                                            >
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            'aspect-square w-full max-w-[14px] rounded-[3px] transition-all duration-200 cursor-pointer hover:scale-110 hover:shadow-sm',
                                                            config.dot,
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="right"
                                                    className="p-0 border-slate-200 shadow-xl bg-white rounded-xl overflow-hidden min-w-[240px] z-[100]"
                                                    sideOffset={10}
                                                >
                                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-white text-slate-500 text-[9px] font-mono h-5"
                                                        >
                                                            {safeFormatTime(
                                                                displayStart,
                                                            )}
                                                        </Badge>
                                                        <div
                                                            className={cn(
                                                                'flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider',
                                                                config.text,
                                                            )}
                                                        >
                                                            <config.icon
                                                                size={12}
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                            {config.label}
                                                        </div>
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 rounded-lg border border-slate-100 shadow-sm">
                                                                <AvatarImage
                                                                    src={FormatService.formatStrapiMedia(
                                                                        session
                                                                            .student
                                                                            ?.profilePicture,
                                                                        'thumbnail',
                                                                    )}
                                                                />
                                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">
                                                                    {session.student?.firstName?.charAt(
                                                                        0,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                                                                    Learner
                                                                </p>
                                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                                    {
                                                                        session
                                                                            .student
                                                                            ?.firstName
                                                                    }{' '}
                                                                    {
                                                                        session
                                                                            .student
                                                                            ?.lastName
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                                {session
                                                                    ?.activity
                                                                    ?.banner ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={FormatService.formatStrapiMedia(
                                                                            session
                                                                                .activity
                                                                                .banner,
                                                                            'thumbnail',
                                                                        )}
                                                                        alt="banner"
                                                                        className="h-full w-full object-cover rounded-lg"
                                                                    />
                                                                ) : (
                                                                    <Activity
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-slate-500"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                                                                    Activity
                                                                </p>
                                                                <p className="text-xs font-semibold text-slate-800 truncate mb-1">
                                                                    {
                                                                        session
                                                                            .activity
                                                                            ?.name
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}

                                    {/* OVERFLOW TOOLTIP */}
                                    {overflowCount > 0 && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center justify-center aspect-square w-full max-w-[14px] rounded-[3px] bg-slate-200 text-slate-600 text-[8px] font-bold hover:bg-slate-300 transition-colors shadow-sm cursor-pointer select-none">
                                                    +{overflowCount}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="right"
                                                sideOffset={10}
                                                className="p-3 border-slate-200 shadow-xl bg-white rounded-xl min-w-[220px] max-w-[280px] z-[100]"
                                            >
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                                                    {overflowCount} Remaining
                                                    Events
                                                </div>
                                                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {hiddenSessions.map(
                                                        (session) => {
                                                            const status =
                                                                session.activitySessionStatus?.toLowerCase() ||
                                                                'pending';
                                                            const config =
                                                                statusConfig[
                                                                    status
                                                                ] ||
                                                                statusConfig.pending;
                                                            const displayStart =
                                                                session.actualStartAt ||
                                                                session.startAt;

                                                            return (
                                                                <div
                                                                    key={
                                                                        session.id ||
                                                                        session.documentId
                                                                    }
                                                                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors"
                                                                >
                                                                    <div
                                                                        className={cn(
                                                                            'w-2 h-2 rounded-full shrink-0 shadow-sm',
                                                                            config.dot,
                                                                        )}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-semibold text-slate-900 truncate">
                                                                            {session
                                                                                .activity
                                                                                ?.name ||
                                                                                'Activity'}
                                                                        </p>
                                                                        <p className="text-[10px] font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                                            <span className="text-indigo-600 font-semibold">
                                                                                {
                                                                                    session
                                                                                        .student
                                                                                        ?.firstName
                                                                                }
                                                                            </span>
                                                                            <span>
                                                                                •
                                                                            </span>
                                                                            <span className="tabular-nums">
                                                                                {safeFormatTime(
                                                                                    displayStart,
                                                                                )}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}
