'use client';

import React, { useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ArrowUpRight,
    Coffee,
    MoreHorizontal,
    CheckCircle2,
    Timer,
    MapPin,
    ChevronRight,
    Gamepad2,
    Play,
    Clock,
} from 'lucide-react';
import {
    format,
    parseISO,
    isPast,
    isWithinInterval,
    addMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormatService } from '@/utils/helpers';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { Activity as ActivityType } from '@/types/actitivity';

interface ScheduleAgendaProps {
    sessions: ActivitySessionResponse[];
    onSessionClick: (
        s: ActivitySessionResponse,
        activities: ActivityType[],
    ) => void;
}

export function ScheduleAgenda({
    sessions,
    onSessionClick,
}: ScheduleAgendaProps) {
    // --- DATA LOGIC ---
    const aggregatedLearnerDays = useMemo(() => {
        const groups: Record<string, any> = {};
        const sortedSessions = [...sessions].sort(
            (a, b) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );

        sortedSessions.forEach((session) => {
            if (!session.startAt) return;
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
        return Object.values(groups);
    }, [sessions]);

    const getGroupStatus = (group: any) => {
        const now = new Date();
        const start = group.sessions[0].startAt
            ? parseISO(group.sessions[0].startAt)
            : null;
        const totalDuration = group.sessions.reduce(
            (acc: number, s: any) => acc + (s.durationMinutes || 30),
            0,
        );
        const end = start ? addMinutes(start, totalDuration) : null;

        if (!start || !end) return 'upcoming';
        if (isWithinInterval(now, { start, end })) return 'active';
        if (isPast(end)) return 'completed';
        return 'upcoming';
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* --- HEADER --- */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <CalendarIcon size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-none">
                            Daily Manifest
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mt-1">
                            {format(new Date(), 'MMMM do')} •{' '}
                            {aggregatedLearnerDays.length} Blocks
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                    <MoreHorizontal size={16} />
                </Button>
            </div>

            {/* --- SCROLLABLE TIMELINE --- */}
            <div className="flex-1 min-h-0 relative bg-slate-50/40">
                {/* --- BACKGROUND (Technical Dots) --- */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.6]"
                    style={{
                        backgroundImage:
                            'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                <ScrollArea className="h-full w-full">
                    <div className="p-6 pb-32 relative">
                        {/* Continuous Spine */}
                        <div className="absolute left-[70px] top-6 bottom-0 w-px bg-slate-200 z-0" />

                        <div className="space-y-6 relative z-10">
                            {aggregatedLearnerDays.length > 0 ? (
                                aggregatedLearnerDays.map((group: any) => {
                                    const status = getGroupStatus(group);
                                    const startTime = format(
                                        group.date,
                                        'h:mm',
                                    );
                                    const ampm = format(group.date, 'a');
                                    const totalMin = group.sessions.reduce(
                                        (acc: number, s: any) =>
                                            acc + (s.durationMinutes || 30),
                                        0,
                                    );
                                    const isBreak =
                                        group.sessions[0].activity?.name
                                            ?.toLowerCase()
                                            .includes('break');

                                    return (
                                        <div
                                            key={group.id}
                                            className="group flex gap-4 w-full items-stretch"
                                        >
                                            {/* 1. Time Column */}
                                            <div className="w-[50px] flex flex-col items-end pt-[18px] shrink-0">
                                                <span
                                                    className={cn(
                                                        'text-xs font-bold tabular-nums leading-none tracking-tight',
                                                        status === 'active'
                                                            ? 'text-indigo-600'
                                                            : 'text-slate-500',
                                                    )}
                                                >
                                                    {startTime}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                                    {ampm}
                                                </span>
                                            </div>

                                            {/* 2. Spine Node */}
                                            <div className="relative flex flex-col items-center shrink-0 w-4">
                                                <div
                                                    className={cn(
                                                        'w-3 h-3 rounded-full border-[2px] z-20 mt-[20px] transition-all duration-300 relative bg-white',
                                                        status === 'active'
                                                            ? 'bg-indigo-600 border-indigo-100 ring-4 ring-indigo-50 scale-110'
                                                            : status ===
                                                                'completed'
                                                              ? 'bg-slate-200 border-slate-300'
                                                              : 'border-slate-300 group-hover:border-indigo-400',
                                                    )}
                                                >
                                                    {status === 'active' && (
                                                        <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-75" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* 3. The Card (RICH / BUSY Design) */}
                                            <button
                                                onClick={() =>
                                                    onSessionClick(
                                                        group.sessions[0],
                                                        group.sessions,
                                                    )
                                                }
                                                className={cn(
                                                    'flex-1 text-left rounded-xl border transition-all duration-200 overflow-hidden relative group/card',
                                                    // Status Styling
                                                    status === 'active'
                                                        ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-100/50 ring-1 ring-indigo-50'
                                                        : isBreak
                                                          ? 'bg-amber-50/40 border-amber-200/50 border-dashed'
                                                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/50',
                                                    status === 'completed' &&
                                                        'opacity-70 grayscale-[0.3] bg-slate-50/50 border-slate-200',
                                                )}
                                            >
                                                {/* Left Status Strip */}
                                                <div
                                                    className={cn(
                                                        'absolute left-0 top-0 bottom-0 w-1',
                                                        status === 'active'
                                                            ? 'bg-indigo-500'
                                                            : isBreak
                                                              ? 'bg-amber-400'
                                                              : 'bg-transparent',
                                                    )}
                                                />

                                                {/* Card Content */}
                                                <div className="p-3 pl-4 flex flex-col gap-3">
                                                    {/* Row 1: Identity & Metadata */}
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={cn(
                                                                    'h-9 w-9 rounded-lg border shrink-0 flex items-center justify-center overflow-hidden',
                                                                    isBreak
                                                                        ? 'bg-amber-100 border-amber-200 text-amber-700'
                                                                        : 'bg-slate-50 border-slate-100',
                                                                )}
                                                            >
                                                                {isBreak ? (
                                                                    <Coffee
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <Avatar className="h-full w-full rounded-none">
                                                                        <AvatarImage
                                                                            src={FormatService.formatStrapiMedia(
                                                                                group
                                                                                    .student
                                                                                    ?.profilePicture,
                                                                                'thumbnail',
                                                                            )}
                                                                            className="object-cover"
                                                                        />
                                                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold w-full h-full flex items-center justify-center">
                                                                            {group.student?.firstName?.charAt(
                                                                                0,
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4
                                                                    className={cn(
                                                                        'text-sm font-bold leading-none mb-1',
                                                                        status ===
                                                                            'completed'
                                                                            ? 'text-slate-500 line-through decoration-slate-300'
                                                                            : 'text-slate-900',
                                                                    )}
                                                                >
                                                                    {isBreak
                                                                        ? 'Scheduled Break'
                                                                        : `${group.student?.firstName} ${group.student?.lastName}`}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="h-4 px-1.5 text-[9px] border-slate-200 text-slate-500 font-mono bg-slate-50/50"
                                                                    >
                                                                        {
                                                                            totalMin
                                                                        }
                                                                        m
                                                                    </Badge>
                                                                    {!isBreak && (
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                                                            <MapPin
                                                                                size={
                                                                                    10
                                                                                }
                                                                            />{' '}
                                                                            Room
                                                                            A
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Icon */}
                                                        {status === 'active' ? (
                                                            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200 animate-pulse">
                                                                <Play
                                                                    size={10}
                                                                    className="text-white fill-current"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover/card:text-indigo-500 group-hover/card:bg-indigo-50 transition-colors border border-transparent group-hover/card:border-indigo-100">
                                                                {status ===
                                                                'completed' ? (
                                                                    <CheckCircle2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <ChevronRight
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Row 2: Visual Activity Sequence (The "Busy" Part) */}
                                                    {!isBreak && (
                                                        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest shrink-0 writing-mode-vertical rotate-180 select-none">
                                                                SEQ
                                                            </span>
                                                            {group.sessions.map(
                                                                (
                                                                    s: any,
                                                                    i: number,
                                                                ) => (
                                                                    <div
                                                                        key={i}
                                                                        className="group/item flex items-center gap-2 bg-white border border-slate-200 rounded-md p-1 pr-2 shadow-sm shrink-0 transition-all hover:border-indigo-200"
                                                                    >
                                                                        <div className="h-5 w-5 rounded-sm bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100/50">
                                                                            {s
                                                                                .activity
                                                                                ?.banner ? (
                                                                                <img
                                                                                    src={FormatService.formatStrapiMedia(
                                                                                        s
                                                                                            .activity
                                                                                            .banner,
                                                                                        'thumbnail',
                                                                                    )}
                                                                                    className="h-full w-full object-cover"
                                                                                    alt=""
                                                                                />
                                                                            ) : (
                                                                                <Gamepad2
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                    className="text-slate-400"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[9px] font-semibold text-slate-600 truncate max-w-[60px] group-hover/item:text-indigo-700">
                                                                            {
                                                                                s
                                                                                    .activity
                                                                                    ?.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                                    <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                                        <CalendarIcon
                                            size={18}
                                            className="opacity-50"
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                        No sessions today
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
