'use client';

import React, { useMemo, useState } from 'react';
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
        dot: string; // Added for solid dot color
        icon: any;
        label: string;
    }
> = {
    completed: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        label: 'Done',
    },
    'in-progress': {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        dot: 'bg-indigo-500',
        icon: PlayCircle,
        label: 'Live',
    },
    interrupted: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        icon: PauseCircle,
        label: 'Paused',
    },
    upcoming: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
        icon: Clock,
        label: 'Scheduled',
    },
    abandoned: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
        icon: XCircle,
        label: 'Dropped',
    },
};

export function ActivityCalendar({ className }: { className?: string }) {
    const [viewDate, setViewDate] = useState(new Date());
    const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // --- DATE LOGIC ---
    const { startRange, endRange, days } = useMemo(() => {
        const monthStart = startOfMonth(viewDate);
        const start = startOfWeek(monthStart);
        const end = addDays(start, 41); // Fixed 6-week grid

        return {
            startRange: start.toISOString(),
            endRange: end.toISOString(),
            days: eachDayOfInterval({ start, end }),
        };
    }, [viewDate]);

    // --- DATA ---
    const { data: sessions = [], isFetching } = useQuery({
        queryKey: ['activity-sessions', { populate: '*' }],
        queryFn: getActivitySessionsNew,
    });

    // --- PROCESSING ---
    const filteredSessions = useMemo(() => {
        if (!Array.isArray(sessions)) return [];
        if (filterStatus === 'all') return sessions;
        if (filterStatus === 'completed')
            return sessions.filter(
                (s: any) => s.activitySessionStatus === 'completed',
            );
        if (filterStatus === 'pending')
            return sessions.filter(
                (s: any) => s.activitySessionStatus !== 'completed',
            );
        return sessions;
    }, [sessions, filterStatus]);

    const sessionsByDate = useMemo(() => {
        const groups: Record<string, ActivitySessionResponse[]> = {};
        filteredSessions.forEach((session: ActivitySessionResponse) => {
            if (!session.startAt) return;
            const dateKey = format(parseISO(session.startAt), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(session);
        });
        return groups;
    }, [filteredSessions]);

    const currentMonthStats = useMemo(() => {
        if (!Array.isArray(sessions)) return { total: 0, rate: 0 };
        const currentMonthSessions = sessions.filter((s: any) =>
            isSameMonth(parseISO(s.startAt), viewDate),
        );
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
                                <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">
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
                            <DropdownMenuContent align="end" className="w-40">
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

                        return (
                            <div
                                key={dateKey}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    'relative flex flex-col min-w-0 transition-all duration-200 group cursor-default',
                                    'bg-white hover:bg-slate-50',
                                    !isCurrentMonth &&
                                        'bg-slate-50/30 text-slate-300',
                                    isSelected &&
                                        'ring-2 ring-inset ring-indigo-500 z-10',
                                )}
                            >
                                {/* Date Number Row */}
                                <div className="p-2 flex justify-between items-start shrink-0">
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

                                {/* Dots Container */}
                                <div className="flex-1 px-2 pb-2 flex flex-wrap content-start gap-1.5 overflow-y-auto scrollbar-none">
                                    {daySessions.map((session) => {
                                        const status =
                                            session.activitySessionStatus ||
                                            'upcoming';
                                        const config =
                                            statusConfig[status] ||
                                            statusConfig.upcoming;

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
                                                            'h-2 w-2 rounded-full transition-all duration-200 cursor-pointer hover:scale-125 hover:ring-2 ring-offset-1 ring-slate-100',
                                                            config.dot,
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="right"
                                                    className="p-0 border-slate-200 shadow-xl bg-white rounded-xl overflow-hidden min-w-[240px] z-50"
                                                    sideOffset={10}
                                                >
                                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-white text-slate-500 text-[9px] font-mono h-5"
                                                        >
                                                            {session.startAt
                                                                ? format(
                                                                      parseISO(
                                                                          session.startAt,
                                                                      ),
                                                                      'h:mm a',
                                                                  )
                                                                : 'TBD'}
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
                                                                <Activity
                                                                    size={14}
                                                                    className="text-slate-500"
                                                                />
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}
