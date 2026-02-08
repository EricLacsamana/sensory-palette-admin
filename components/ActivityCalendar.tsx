'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    parseISO,
    addMonths,
    subMonths,
    isWeekend,
    addDays,
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Activity,
    Loader2,
    Check,
    Play,
    Pause,
    X as CloseIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { getActivitySessions } from '@/api/acitivity-session';
import { ActivitySessionResponse } from '@/types/activitiy-session';

// --- Types ---

// --- Configuration ---
const statusConfig: Record<
    string,
    { color: string; badge: string; icon: any }
> = {
    completed: {
        color: 'bg-emerald-500 text-white shadow-emerald-100',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
        icon: Check,
    },
    live: {
        color: 'bg-emerald-500 text-white shadow-emerald-200 animate-pulse ring-2 ring-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
        icon: Play,
    },
    started: {
        color: 'bg-indigo-500 text-white shadow-indigo-100',
        badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
        icon: Play,
    },
    interrupted: {
        color: 'bg-amber-500 text-white shadow-amber-100',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
        icon: Pause,
    },
    abandoned: {
        color: 'bg-slate-500 text-white shadow-slate-100',
        badge: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
        icon: CloseIcon,
    },
};

export function ActivityCalendar() {
    const [viewDate, setViewDate] = useState(new Date());

    const { startRange, endRange, days } = useMemo(() => {
        const monthStart = startOfMonth(viewDate);
        const monthEnd = endOfMonth(viewDate);
        const start = startOfWeek(monthStart);
        // Ensure we always render exactly 6 weeks (42 days) to keep grid stable
        const end = addDays(start, 41);

        return {
            startRange: start.toISOString(),
            endRange: endOfWeek(monthEnd).toISOString(),
            days: eachDayOfInterval({ start, end }),
        };
    }, [viewDate]);

    const { data: response, isFetching } = useQuery({
        queryKey: ['activity-sessions', '', startRange, endRange],
        queryFn: getActivitySessions,
        placeholderData: keepPreviousData,
    });

    const sessions: ActivitySessionResponse[] = useMemo(() => {
        return response?.data || [];
    }, [response]);

    const sessionsByDate = useMemo(() => {
        const groups: Record<string, ActivitySessionResponse[]> = {};

        sessions.forEach((session) => {
            if (!session.startTime) return;
            const dateKey = format(parseISO(session.startTime), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(session);
        });

        Object.keys(groups).forEach((key) => {
            groups[key].sort(
                (a, b) =>
                    parseISO(a.startTime).getTime() -
                    parseISO(b.startTime).getTime(),
            );
        });

        return groups;
    }, [sessions]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <TooltipProvider delayDuration={100}>
            {/* FIX 1: Removed `min-h-[500px]` and replaced with `min-h-0`. 
               This ensures the container allows itself to shrink if the parent is small.
               Ensure the parent of this component has a defined height (e.g., h-screen or h-[500px]).
            */}
            <div className="w-full h-full min-h-0 bg-white rounded-[40px] border border-slate-400/50 overflow-hidden flex flex-col transition-all duration-500 shadow-sm">
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between px-6 md:px-10 py-5 bg-white/50 backdrop-blur-xl border-b border-slate-300 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                            {isFetching ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <CalendarIcon size={20} strokeWidth={1.5} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 tracking-tight leading-none">
                                {format(viewDate, 'MMMM')}
                                <span className="text-slate-400 font-light ml-2">
                                    {format(viewDate, 'yyyy')}
                                </span>
                            </h2>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1.5">
                                {sessions.length} Sessions Loaded
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8 hover:bg-indigo-300 transition-all active:scale-90"
                            onClick={() => setViewDate(subMonths(viewDate, 1))}
                        >
                            <ChevronLeft size={16} className="text-slate-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8 hover:bg-indigo-300 transition-all active:scale-90"
                            onClick={() => setViewDate(addMonths(viewDate, 1))}
                        >
                            <ChevronRight
                                size={16}
                                className="text-slate-600"
                            />
                        </Button>
                    </div>
                </div>

                {/* --- DAY LABELS --- */}
                <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50/30 shrink-0">
                    {weekDays.map((day, idx) => (
                        <div
                            key={day}
                            className={cn(
                                'py-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em]',
                                idx === 0 || idx === 6
                                    ? 'text-rose-400'
                                    : 'text-slate-400',
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* FIX 2: Grid Layout
                    - Changed `grid-rows-6` to `grid-rows-[repeat(6,minmax(0,1fr))]`
                    - This forces strictly equal rows that fit in the container, preventing overflow.
                    - `minmax(0, 1fr)` is crucial here; it allows the row to shrink below its content size if needed.
                */}
                <div className="grid grid-cols-7 grid-rows-[repeat(6,minmax(0,1fr))] flex-1 overflow-hidden">
                    {days.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const daySessions = sessionsByDate[dateKey] || [];
                        const isCurrentMonth = isSameMonth(day, viewDate);
                        const isToday = isSameDay(day, new Date());
                        const isWeekendDay = isWeekend(day);

                        return (
                            <div
                                key={dateKey}
                                className={cn(
                                    'p-1 border-r border-b border-slate-100 transition-all duration-300 relative group flex flex-col min-w-0 min-h-0', // Added min-h-0 here as well
                                    !isCurrentMonth
                                        ? 'bg-slate-50/20 opacity-40'
                                        : 'bg-white',
                                    isWeekendDay &&
                                        isCurrentMonth &&
                                        'bg-rose-50/30',
                                    idx % 7 === 6 && 'border-r-0',
                                )}
                            >
                                <div className="flex justify-between items-center mb-1 shrink-0">
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold h-5 w-5 flex items-center justify-center rounded-lg transition-all',
                                            isToday
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'text-slate-400 group-hover:text-indigo-600',
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {/* FIX 3: Content Overflow
                                    - Changed `overflow-hidden` to `overflow-y-auto` (or scroll).
                                    - This ensures that if there are too many sessions, we scroll INSIDE the cell 
                                      instead of expanding the cell height and breaking the grid.
                                */}
                                <div
                                    className={cn(
                                        'flex flex-wrap content-start gap-1 p-0.5 overflow-y-auto flex-1 scrollbar-hide', // Added scrollbar-hide if you have the plugin, otherwise just remove it
                                        isFetching && 'opacity-50',
                                    )}
                                >
                                    {daySessions.map((session) => {
                                        const config =
                                            statusConfig[
                                                session.activityStatus
                                            ] || statusConfig.started;
                                        const StatusIcon = config.icon;

                                        return (
                                            <Tooltip key={session.documentId}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            'h-3.5 w-3.5 rounded-full cursor-pointer transition-all hover:scale-125 hover:z-10 flex items-center justify-center shrink-0',
                                                            config.color,
                                                        )}
                                                    >
                                                        <StatusIcon
                                                            size={8}
                                                            strokeWidth={3}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="right"
                                                    sideOffset={5}
                                                    className="bg-slate-900 text-white p-4 rounded-2xl border-none shadow-xl z-[100]"
                                                >
                                                    <div className="space-y-2 min-w-[180px]">
                                                        <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-1">
                                                            <div>
                                                                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                                                                    Student
                                                                </p>
                                                                <p className="text-[13px] font-bold text-white">
                                                                    {
                                                                        session
                                                                            .student
                                                                            .firstName
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div
                                                                className={cn(
                                                                    'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[7px] font-black uppercase',
                                                                    config.badge,
                                                                )}
                                                            >
                                                                {
                                                                    session.activityStatus
                                                                }
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-100">
                                                                <Activity
                                                                    size={12}
                                                                    className="text-indigo-400"
                                                                />
                                                                <span className="truncate max-w-[150px]">
                                                                    {session
                                                                        .activity
                                                                        ?.name ||
                                                                        'Game Instance'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                                                <Clock
                                                                    size={12}
                                                                    className="text-indigo-400"
                                                                />
                                                                <span>
                                                                    {session.startTime
                                                                        ? format(
                                                                              parseISO(
                                                                                  session.startTime,
                                                                              ),
                                                                              'p',
                                                                          )
                                                                        : 'No Time'}
                                                                </span>
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
