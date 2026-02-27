'use client';

import React, { useMemo } from 'react';
import {
    Clock,
    User,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Coffee,
    Gamepad2,
    Radio,
    Lock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    ActivitySessionResponse,
    ActivitySessionStatus,
} from '@/types/activitiy-session';
import { Activity as ActivityType } from '@/types/actitivity';

interface ScheduleQueueProps {
    sessions: ActivitySessionResponse[];
    onSessionClick: (
        s: ActivitySessionResponse,
        activities: ActivityType[],
    ) => void;
}

export function ScheduleQueue({
    sessions,
    onSessionClick,
}: ScheduleQueueProps) {
    const hasGlobalActiveSession = useMemo(() => {
        return sessions.some(
            (s) => s.activitySessionStatus === ActivitySessionStatus.InProgress,
        );
    }, [sessions]);

    const aggregatedLearnerDays = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groups: Record<string, any> = {};

        const activeAndPendingSessions = sessions.filter((session) => {
            const status =
                session.activitySessionStatus?.toLowerCase() ||
                ActivitySessionStatus.Pending;
            return (
                status === ActivitySessionStatus.Pending ||
                status === ActivitySessionStatus.Queued ||
                // status === 'scheduled' ||
                status === ActivitySessionStatus.InProgress
            );
        });

        activeAndPendingSessions.forEach((session) => {
            if (!session.startAt) return;

            const dateStr = format(parseISO(session.startAt), 'yyyy-MM-dd');
            const studentId = session.student?.id || 'unassigned';
            const groupKey = `${studentId}-${dateStr}`;

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

        return Object.values(groups).sort((a, b) => {
            const aIsActive = a.sessions.some(
                (s: ActivitySessionResponse) =>
                    s.activitySessionStatus ===
                    ActivitySessionStatus.InProgress,
            );
            const bIsActive = b.sessions.some(
                (s: ActivitySessionResponse) =>
                    s.activitySessionStatus ===
                    ActivitySessionStatus.InProgress,
            );

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;

            return a.date.getTime() - b.date.getTime();
        });
    }, [sessions]);

    const handleLockedClick = () => {
        toast.error('Session in Progress', {
            description:
                'You must finish or cancel the active session before launching another sequence.',
            icon: <Lock className="text-rose-500" size={16} />,
        });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm relative">
            {/* --- FIXED HEADER --- */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center text-white transition-colors',
                            hasGlobalActiveSession
                                ? 'bg-rose-500'
                                : 'bg-indigo-600',
                        )}
                    >
                        {hasGlobalActiveSession ? (
                            <Radio size={18} className="animate-pulse" />
                        ) : (
                            <CalendarIcon size={18} />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 tracking-tight leading-tight">
                            {hasGlobalActiveSession
                                ? 'Active Monitoring'
                                : 'Upcoming Agenda'}
                        </h3>
                        <p
                            className={cn(
                                'text-xs font-medium',
                                hasGlobalActiveSession
                                    ? 'text-rose-500'
                                    : 'text-slate-500',
                            )}
                        >
                            {hasGlobalActiveSession
                                ? 'Other Blocks Locked'
                                : 'Live & Pending Blocks'}
                        </p>
                    </div>
                </div>

                <Badge
                    variant="secondary"
                    className="h-7 px-3 rounded-lg text-slate-600 font-medium text-xs bg-slate-100 border-none hover:bg-slate-100"
                >
                    {aggregatedLearnerDays.length} Block
                    {aggregatedLearnerDays.length !== 1 && 's'}
                </Badge>
            </div>

            {/* --- SCROLLABLE TIMELINE --- */}
            <div className="flex-1 min-h-0 relative bg-slate-50/50 overflow-y-auto custom-scrollbar">
                <div className="p-6 relative z-10 min-h-full">
                    {aggregatedLearnerDays.length > 0 && (
                        <div className="absolute left-[44px] top-6 bottom-6 w-[2px] bg-slate-200 -translate-x-1/2 rounded-full" />
                    )}

                    <div className="space-y-6">
                        {aggregatedLearnerDays.length > 0 ? (
                            aggregatedLearnerDays.map((group) => {
                                const sorted = [...group.sessions].sort(
                                    (a, b) =>
                                        new Date(a.startAt).getTime() -
                                        new Date(b.startAt).getTime(),
                                );
                                const dayStart = format(
                                    parseISO(sorted[0].startAt),
                                    'h:mm a',
                                );
                                const dayEnd = format(
                                    parseISO(sorted[sorted.length - 1].endAt),
                                    'h:mm a',
                                );
                                const totalMin = group.sessions.reduce(
                                    (acc: number, s: ActivitySessionResponse) =>
                                        acc +
                                        (s.activity?.durationMinutes || 0),
                                    0,
                                );

                                const firstActivityName = (
                                    sorted[0].activity?.name ||
                                    sorted[0].name ||
                                    ''
                                ).toLowerCase();
                                const isBreak =
                                    firstActivityName.includes('break');
                                const isUnassigned = !group.student;
                                const isGroupActive = group.sessions.some(
                                    (s: ActivitySessionResponse) =>
                                        s.activitySessionStatus ===
                                        ActivitySessionStatus.InProgress,
                                );
                                const isLockedByOtherSession =
                                    hasGlobalActiveSession && !isGroupActive;

                                return (
                                    <div
                                        key={group.id}
                                        className="flex gap-4 relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
                                    >
                                        {/* Timeline Dot */}
                                        <div className="w-10 relative flex flex-col top-10 items-center pt-2 shrink-0">
                                            <div
                                                className={cn(
                                                    'w-3 h-3 rounded-full z-10 transition-all duration-300 ring-4',
                                                    isGroupActive
                                                        ? 'bg-indigo-500 ring-indigo-100 animate-pulse'
                                                        : isLockedByOtherSession
                                                          ? 'bg-slate-300 ring-slate-50'
                                                          : isBreak
                                                            ? 'bg-amber-400 ring-amber-50'
                                                            : 'bg-indigo-400 ring-indigo-50 group-hover:bg-indigo-600',
                                                )}
                                            />
                                        </div>

                                        {/* Interactive Card */}
                                        <button
                                            onClick={() =>
                                                isLockedByOtherSession
                                                    ? handleLockedClick()
                                                    : onSessionClick(
                                                          group.sessions[0],
                                                          group.sessions,
                                                      )
                                            }
                                            className={cn(
                                                'flex-1 p-5 rounded-2xl border transition-all duration-200 text-left group/card relative overflow-hidden',
                                                isLockedByOtherSession
                                                    ? 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'
                                                    : 'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
                                                isGroupActive
                                                    ? 'bg-indigo-50 border-indigo-200'
                                                    : !isLockedByOtherSession &&
                                                        isBreak
                                                      ? 'bg-amber-50/50 border-amber-100 hover:border-amber-300'
                                                      : !isLockedByOtherSession
                                                        ? 'bg-white border-slate-200 hover:border-indigo-200'
                                                        : '',
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={cn(
                                                            'h-10 w-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
                                                            isGroupActive
                                                                ? 'bg-indigo-600 text-white'
                                                                : isLockedByOtherSession
                                                                  ? 'bg-slate-100 text-slate-400'
                                                                  : isBreak
                                                                    ? 'bg-amber-100 text-amber-600'
                                                                    : 'bg-slate-100 text-slate-500 group-hover/card:bg-indigo-100 group-hover/card:text-indigo-600',
                                                        )}
                                                    >
                                                        {isLockedByOtherSession ? (
                                                            <Lock size={18} />
                                                        ) : isBreak ? (
                                                            <Coffee size={18} />
                                                        ) : (
                                                            <User size={18} />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4
                                                                className={cn(
                                                                    'text-base font-semibold truncate',
                                                                    isGroupActive
                                                                        ? 'text-indigo-900'
                                                                        : isLockedByOtherSession
                                                                          ? 'text-slate-500'
                                                                          : 'text-slate-900',
                                                                )}
                                                            >
                                                                {isUnassigned
                                                                    ? 'Unassigned Block'
                                                                    : `${group.student?.firstName} ${group.student?.lastName}`}
                                                            </h4>
                                                            {isGroupActive && (
                                                                <span className="flex items-center gap-1 bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider animate-pulse">
                                                                    <Radio
                                                                        size={
                                                                            10
                                                                        }
                                                                    />{' '}
                                                                    Live
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                            <div className="flex items-center gap-1">
                                                                <Gamepad2
                                                                    size={12}
                                                                />
                                                                {
                                                                    group
                                                                        .sessions
                                                                        .length
                                                                }{' '}
                                                                Task
                                                                {group.sessions
                                                                    .length !==
                                                                    1 && 's'}
                                                            </div>
                                                            <span>•</span>
                                                            <span>
                                                                {format(
                                                                    group.date,
                                                                    'MMM do',
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className={cn(
                                                        'h-8 w-8 rounded-full flex items-center justify-center transition-colors shrink-0',
                                                        isLockedByOtherSession
                                                            ? 'text-slate-300'
                                                            : 'text-slate-400 group-hover/card:bg-indigo-50 group-hover/card:text-indigo-600',
                                                    )}
                                                >
                                                    {isLockedByOtherSession ? (
                                                        <Lock size={16} />
                                                    ) : (
                                                        <ArrowUpRight
                                                            size={18}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100/60">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                                                        Start
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {dayStart}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
                                                    <Clock size={12} />
                                                    <span className="text-xs font-medium">
                                                        {totalMin}m
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                                                        End
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {dayEnd}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                                    <CalendarIcon size={24} />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900 mb-1">
                                    No Scheduled Blocks
                                </h3>
                                <p className="text-sm text-slate-500 max-w-[200px]">
                                    All activity blocks are either completed or
                                    unassigned.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
