'use client';

import React, { useMemo } from 'react';
import {
    Clock,
    User,
    Calendar as CalendarIcon,
    ArrowUpRight,
    LayoutGrid,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivitySessionResponse } from '@/types/activitiy-session';

interface ScheduleAgendaProps {
    activitySessions: ActivitySessionResponse[];
    onSessionClick?: (session: ActivitySessionResponse) => void;
}

export function ScheduleAgenda({
    activitySessions,
    onSessionClick,
}: ScheduleAgendaProps) {
    const aggregatedLearnerDays = useMemo(() => {
        const groups: Record<string, any> = {};

        activitySessions.forEach((session) => {
            const dateStr = format(parseISO(session.startAt), 'yyyy-MM-dd');
            const studentId = session.student?.id;
            const groupKey = `${studentId}-${dateStr}`;

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    id: groupKey,
                    student: session.student,
                    date: parseISO(session.startAt),
                    activitySessions: [],
                    rawSession: session,
                };
            }
            groups[groupKey].activitySessions.push(session);
        });

        return Object.values(groups).sort(
            (a, b) => b.date.getTime() - a.date.getTime(),
        );
    }, [activitySessions]);

    return (
        <div className="flex flex-col h-full bg-white rounded-[40px] border border-slate-200/60 overflow-hidden shadow-2xl shadow-slate-200/40">
            {/* --- HEADER --- */}
            <div className="p-7 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <LayoutGrid size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-base font-[1000] text-slate-900 tracking-tight leading-none">
                            Daily Agenda
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                            {format(new Date(), 'EEEE, MMM do')}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- SCROLLABLE AREA --- */}
            {/* flex-1 and overflow-hidden here ensure the ScrollArea works correctly */}
            <ScrollArea className="flex-1 overflow-hidden bg-slate-50/30">
                <div className="p-7 relative">
                    {/* The Clean Timeline Path */}
                    <div className="absolute left-[39px] top-0 bottom-0 w-px bg-slate-200/70" />

                    <div className="space-y-8">
                        {aggregatedLearnerDays.length > 0 ? (
                            aggregatedLearnerDays.map((group) => (
                                <LearnerSummaryCard
                                    key={group.id}
                                    group={group}
                                    onClick={() =>
                                        onSessionClick?.(group.rawSession)
                                    }
                                />
                            ))
                        ) : (
                            <div className="py-32 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                    No records found
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

function LearnerSummaryCard({
    group,
    onClick,
}: {
    group: any;
    onClick: () => void;
}) {
    const sortedTimes = group.activitySessions.sort(
        (a: any, b: any) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    const dayStart = format(parseISO(sortedTimes[0].startAt), 'p');
    const dayEnd = format(
        parseISO(
            sortedTimes[sortedTimes.length - 1].endAt ||
                sortedTimes[sortedTimes.length - 1].startAt,
        ),
        'p',
    );
    const totalMinutes = group.activitySessions.reduce(
        (acc: number, s: any) =>
            acc + Math.floor((s.durationSeconds || 0) / 60),
        0,
    );

    return (
        <div className="flex gap-6 relative group">
            {/* Timeline Dot (Node) */}
            <div className="h-4 w-4 rounded-full border-4 border-white bg-indigo-600 z-10 mt-3 shrink-0 shadow-md shadow-indigo-200 transition-transform group-hover:scale-125" />

            <button
                onClick={onClick}
                className="flex-1 p-6 rounded-[32px] border border-slate-200/60 bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-100/40 hover:border-indigo-200 transition-all duration-500 text-left group/card relative overflow-hidden"
            >
                {/* Subtle Gradient Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover/card:from-indigo-50/20 group-hover/card:to-indigo-50/50 transition-all" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-[22px] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/card:bg-white group-hover/card:border-indigo-100 transition-all">
                                <User
                                    size={24}
                                    className="text-slate-400 group-hover/card:text-indigo-600"
                                    strokeWidth={2.5}
                                />
                            </div>
                            <div>
                                <h4 className="text-lg font-[1000] text-slate-900 tracking-tight leading-none mb-2">
                                    {group.student?.firstName}{' '}
                                    {group.student?.lastName}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1">
                                        {group.activitySessions.length} Session
                                        Blocks
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all shadow-inner">
                            <ArrowUpRight size={20} />
                        </div>
                    </div>

                    {/* --- THE TIME HUD (The "Gutter" look) --- */}
                    <div className="flex items-center justify-between bg-slate-50/80 backdrop-blur-sm rounded-[24px] p-5 border border-slate-100/50">
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Arrival
                            </span>
                            <span className="text-xs font-[1000] text-slate-800 tabular-nums tracking-tight">
                                {dayStart}
                            </span>
                        </div>

                        <div className="h-8 w-px bg-slate-200/60" />

                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Intensity
                            </span>
                            <div className="flex items-center gap-1.5 text-indigo-600">
                                <Clock size={12} strokeWidth={3} />
                                <span className="text-xs font-[1000] tabular-nums tracking-tight">
                                    {totalMinutes}m
                                </span>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200/60" />

                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Departure
                            </span>
                            <span className="text-xs font-[1000] text-slate-800 tabular-nums tracking-tight">
                                {dayEnd}
                            </span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
}
