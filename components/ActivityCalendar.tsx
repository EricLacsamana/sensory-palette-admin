'use client';

import React, { useMemo, useState, useEffect } from 'react';
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

// Status Configuration: Colors and Icons
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
        icon: Play, // Live gets a Play icon
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
    const [debouncedDate, setDebouncedDate] = useState(viewDate);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedDate(viewDate), 300);
        return () => clearTimeout(handler);
    }, [viewDate]);

    const { startRange, endRange, days } = useMemo(() => {
        const monthStart = startOfMonth(debouncedDate);
        const monthEnd = endOfMonth(debouncedDate);
        const start = startOfWeek(monthStart);
        const end = endOfWeek(monthEnd);
        return {
            startRange: start.toISOString(),
            endRange: end.toISOString(),
            days: eachDayOfInterval({ start, end }),
        };
    }, [debouncedDate]);

    const { data: response, isFetching } = useQuery({
        queryKey: ['activity-sessions', '', startRange, endRange],
        queryFn: getActivitySessions,
        placeholderData: keepPreviousData,
    });

    const sessions = response?.data || [];
    const rowCount = Math.ceil(days.length / 7);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <TooltipProvider delayDuration={0}>
            <div className="w-full h-full bg-white rounded-[40px] border border-slate-400/50 overflow-hidden flex flex-col transition-all duration-500 shadow-sm">
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

                {/* --- CALENDAR GRID --- */}
                <div
                    className="grid grid-cols-7 flex-1 overflow-hidden"
                    style={{
                        gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
                    }}
                >
                    {days.map((day, idx) => {
                        const daySessions = sessions
                            .filter(
                                (s: any) =>
                                    s.startTime &&
                                    isSameDay(parseISO(s.startTime), day),
                            )
                            .sort(
                                (a: any, b: any) =>
                                    parseISO(a.startTime).getTime() -
                                    parseISO(b.startTime).getTime(),
                            );

                        const isCurrentMonth = isSameMonth(day, viewDate);
                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    'p-1 border-r border-b border-slate-100 transition-all duration-300 relative group flex flex-col min-w-0',
                                    !isCurrentMonth
                                        ? 'bg-slate-50/20 opacity-25'
                                        : 'bg-white',
                                    isWeekend(day) &&
                                        isCurrentMonth &&
                                        'bg-rose-50/30',
                                    idx % 7 === 6 && 'border-r-0',
                                )}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold h-4 w-4 flex items-center justify-center rounded-xl transition-all',
                                            isSameDay(day, new Date())
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'text-slate-400',
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div
                                    className={cn(
                                        'flex flex-wrap gap-1 p-0.5 mt-1 overflow-hidden flex-1 content-start transition-opacity',
                                        isFetching
                                            ? 'opacity-50'
                                            : 'opacity-100',
                                    )}
                                >
                                    {daySessions.map((session: any) => {
                                        const config =
                                            statusConfig[
                                                session.activityStatus
                                            ] || statusConfig.started;
                                        const StatusIcon = config.icon;

                                        return (
                                            <Tooltip key={session.id}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            'h-3.5 w-3.5 rounded-full cursor-pointer transition-all hover:scale-125 flex items-center justify-center',
                                                            config.color,
                                                        )}
                                                    >
                                                        {StatusIcon && (
                                                            <StatusIcon
                                                                size={8}
                                                                strokeWidth={3}
                                                            />
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-slate-900 text-white p-4 rounded-2xl border-none shadow-2xl z-[100]">
                                                    <div className="space-y-2 min-w-[180px]">
                                                        {/* Header: Student & Status */}
                                                        <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-1">
                                                            <div>
                                                                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                                                                    Student
                                                                </p>
                                                                <p className="text-[13px] font-bold text-white">
                                                                    {session
                                                                        .student
                                                                        ?.firstName ||
                                                                        'Guest'}
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

                                                        {/* Body: Activity & Time */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-100">
                                                                <Activity
                                                                    size={12}
                                                                    className="text-indigo-400"
                                                                />
                                                                <span className="truncate">
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
