'use client';

import React, { useMemo, useState } from 'react';
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
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    MoreHorizontal,
    Clock,
    Target,
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

export function LargeActivityCalendar({ sessions }: { sessions: any[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    return (
        <TooltipProvider delayDuration={0}>
            <div className="w-full bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                {/* --- COMPACT HEADER --- */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                            <CalendarIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-[1000] text-slate-900 tracking-tight leading-none">
                                {format(currentMonth, 'MMMM yyyy')}
                            </h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                                Monthly Caseload Review
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg h-8 w-8 hover:bg-white"
                            onClick={() =>
                                setCurrentMonth(subMonths(currentMonth, 1))
                            }
                        >
                            <ChevronLeft size={16} className="text-slate-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg h-8 w-8 hover:bg-white"
                            onClick={() =>
                                setCurrentMonth(addMonths(currentMonth, 1))
                            }
                        >
                            <ChevronRight
                                size={16}
                                className="text-slate-600"
                            />
                        </Button>
                    </div>
                </div>

                {/* --- DAY LABELS (Ultra Compact) --- */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                        (day) => (
                            <div
                                key={day}
                                className="py-2 text-center text-[8px] font-black uppercase tracking-[0.25em] text-slate-400"
                            >
                                {day}
                            </div>
                        ),
                    )}
                </div>

                {/* --- CALENDAR GRID (Tightened Rows) --- */}
                <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)] bg-white">
                    {days.map((day, idx) => {
                        const daySessions = sessions.filter(
                            (s) =>
                                s.startTime &&
                                isSameDay(parseISO(s.startTime), day),
                        );
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    'min-h-[100px] p-2 border-r border-b border-slate-100 transition-all relative flex flex-col gap-1.5',
                                    !isCurrentMonth
                                        ? 'bg-slate-50/40 opacity-30 pointer-events-none'
                                        : 'bg-white',
                                    idx % 7 === 6 && 'border-r-0',
                                )}
                            >
                                {/* Date Badge */}
                                <div className="flex justify-start">
                                    <span
                                        className={cn(
                                            'text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-md',
                                            isToday
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-400',
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {/* Compact Session Entries */}
                                <div className="flex flex-col gap-1 flex-grow overflow-hidden">
                                    {daySessions.slice(0, 3).map((session) => (
                                        <Tooltip key={session.id}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        'px-2 py-1 rounded-lg border flex flex-col cursor-help transition-all hover:translate-x-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
                                                        session.activityStatus ===
                                                            'completed'
                                                            ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800'
                                                            : 'bg-indigo-50/40 border-indigo-100 text-indigo-800',
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center gap-1">
                                                        <span className="text-[9px] font-black truncate tracking-tight">
                                                            {session.student
                                                                ?.username ||
                                                                'Learner'}
                                                        </span>
                                                        <span className="text-[8px] font-black opacity-50 shrink-0 uppercase tracking-tighter">
                                                            {
                                                                session.actualScore
                                                            }
                                                            p
                                                        </span>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white border-none p-3 rounded-xl shadow-xl">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                                                        <Clock
                                                            size={10}
                                                            className="text-indigo-400"
                                                        />
                                                        <p className="text-[10px] font-black">
                                                            {format(
                                                                parseISO(
                                                                    session.startTime,
                                                                ),
                                                                'p',
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Activity
                                                            size={10}
                                                            className="text-slate-400"
                                                        />
                                                        <p className="text-[10px] font-bold truncate max-w-[120px]">
                                                            {session.activity
                                                                ?.name ||
                                                                'Session'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Target
                                                            size={10}
                                                            className="text-emerald-400"
                                                        />
                                                        <p className="text-[10px] font-black">
                                                            {(
                                                                session.successRate *
                                                                100
                                                            ).toFixed(0)}
                                                            % Accuracy
                                                        </p>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}

                                    {daySessions.length > 3 && (
                                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center py-0.5 bg-slate-50/50 rounded-md border border-slate-100 mt-auto">
                                            + {daySessions.length - 3} Items
                                        </div>
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
