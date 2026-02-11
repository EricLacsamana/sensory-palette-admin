'use client';

import React, { useMemo } from 'react';
import {
    Clock,
    User,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Coffee,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScheduleAgendaProps {
    sessions: any[];
    onSessionClick: (s: any, activities: any[]) => void;
}

export function ScheduleAgenda({
    sessions,
    onSessionClick,
}: ScheduleAgendaProps) {
    const aggregatedLearnerDays = useMemo(() => {
        const groups: Record<string, any> = {};
        sessions.forEach((session) => {
            const dateStr = format(parseISO(session.startAt), 'yyyy-MM-dd');
            const groupKey = `${session.student?.id}-${dateStr}`;
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    id: groupKey,
                    student: session.student,
                    date: parseISO(session.startAt),
                    sessions: [],
                };
            }
            groups[groupKey].sessions.push(session);
        });
        return Object.values(groups).sort(
            (a: any, b: any) => b.date.getTime() - a.date.getTime(),
        );
    }, [sessions]);

    return (
        <div className="flex flex-col h-full bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            {/* --- FIXED HEADER --- */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                        <CalendarIcon size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-[1000] text-slate-900 tracking-tight">
                            Daily Agenda
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Chronological Sequence
                        </p>
                    </div>
                </div>
            </div>

            {/* --- SCROLLABLE TIMELINE --- */}
            {/* FIX: added flex-1 and min-h-0 to allow this container to scroll within the parent flexbox */}
            <div className="flex-1 min-h-0 relative bg-slate-50/30">
                <ScrollArea className="h-full w-full">
                    <div className="p-6 relative">
                        {/* Vertical Timeline Path */}
                        <div className="absolute left-[31px] top-0 bottom-0 w-px bg-slate-300/60" />

                        <div className="space-y-6">
                            {aggregatedLearnerDays.length > 0 ? (
                                aggregatedLearnerDays.map((group: any) => {
                                    const sorted = [...group.sessions].sort(
                                        (a, b) =>
                                            new Date(a.startAt).getTime() -
                                            new Date(b.startAt).getTime(),
                                    );

                                    const dayStart = format(
                                        parseISO(sorted[0].startAt),
                                        'p',
                                    );
                                    const dayEnd = format(
                                        parseISO(
                                            sorted[sorted.length - 1].startAt,
                                        ),
                                        'p',
                                    );
                                    const totalMin = group.sessions.reduce(
                                        (acc: number, s: any) =>
                                            acc +
                                            Math.floor(
                                                (s.durationSeconds || 0) / 60,
                                            ),
                                        0,
                                    );

                                    const isBreak =
                                        sorted[0].activity?.name
                                            ?.toLowerCase()
                                            .includes('break') ||
                                        sorted[0].name
                                            ?.toLowerCase()
                                            .includes('break');

                                    return (
                                        <div
                                            key={group.id}
                                            className="flex gap-2 relative group animate-in fade-in slide-in-from-right-10 duration-1000"
                                        >
                                            <div
                                                className={cn(
                                                    'h-4 w-4 rounded-full border-2 z-10 mt-16 shrink-0 transition-transform group-hover:scale-125',
                                                    'border-indigo-600 bg-white',
                                                )}
                                            />

                                            <button
                                                onClick={() =>
                                                    onSessionClick(
                                                        group.sessions[0],
                                                        group.sessions,
                                                    )
                                                }
                                                className={cn(
                                                    'flex-1 p-5 rounded-[24px] border transition-all text-left shadow-sm group/card active:scale-[0.98]',
                                                    isBreak
                                                        ? 'bg-amber-50/40 border-amber-100 hover:border-amber-300'
                                                        : 'bg-white border-slate-100 hover:border-indigo-200',
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'h-10 w-10 rounded-xl flex items-center justify-center border transition-colors',
                                                                isBreak
                                                                    ? 'bg-amber-100 border-amber-200 text-amber-600'
                                                                    : 'bg-slate-50 border-slate-100 text-slate-400 group-hover/card:text-indigo-600 group-hover/card:bg-indigo-50',
                                                            )}
                                                        >
                                                            {isBreak ? (
                                                                <Coffee
                                                                    size={18}
                                                                />
                                                            ) : (
                                                                <User
                                                                    size={18}
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[13px] font-[1000] text-slate-900 leading-none mb-1">
                                                                {
                                                                    group
                                                                        .student
                                                                        ?.firstName
                                                                }{' '}
                                                                {
                                                                    group
                                                                        .student
                                                                        ?.lastName
                                                                }
                                                            </h4>
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    className={cn(
                                                                        'border-none font-black text-[8px] uppercase px-1.5 py-0.5',
                                                                        isBreak
                                                                            ? 'bg-amber-100 text-amber-700'
                                                                            : 'bg-slate-100 text-slate-500',
                                                                    )}
                                                                >
                                                                    {
                                                                        group
                                                                            .sessions
                                                                            .length
                                                                    }{' '}
                                                                    Blocks
                                                                </Badge>
                                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                                                    {format(
                                                                        group.date,
                                                                        'MMM do',
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight
                                                        size={16}
                                                        className="text-slate-200 group-hover/card:text-indigo-500 transition-colors"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-300 uppercase mb-1">
                                                            Start
                                                        </span>
                                                        <span className="text-[11px] font-[1000] text-slate-700 tabular-nums">
                                                            {dayStart}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-slate-300 uppercase mb-1">
                                                            Time
                                                        </span>
                                                        <div
                                                            className={cn(
                                                                'flex items-center gap-1',
                                                                isBreak
                                                                    ? 'text-amber-600'
                                                                    : 'text-indigo-600',
                                                            )}
                                                        >
                                                            <Clock
                                                                size={10}
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                            <span className="text-[11px] font-black tabular-nums">
                                                                {totalMin}m
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] font-black text-slate-300 uppercase mb-1">
                                                            End
                                                        </span>
                                                        <span className="text-[11px] font-[1000] text-slate-700 tabular-nums">
                                                            {dayEnd}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-24 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        No activities found
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
