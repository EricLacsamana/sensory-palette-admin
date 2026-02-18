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
    Lock, // Added Lock icon
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner'; // Ensure sonner is imported for alerts
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { Activity as ActivityType } from '@/types/actitivity';

interface ScheduleAgendaProps {
    sessions: ActivitySessionResponse[];
    onSessionClick: (
        s: ActivitySessionResponse,
        activities: ActivityType[],
    ) => void;
}

const TechnicalLabel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={cn(
            'text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]',
            className,
        )}
    >
        {children}
    </span>
);

export function ScheduleAgenda({
    sessions,
    onSessionClick,
}: ScheduleAgendaProps) {
    // 1. GLOBAL LOCK CHECK: Is there ANY session currently running?
    const hasGlobalActiveSession = useMemo(() => {
        return sessions.some((s) => s.activitySessionStatus === 'in_progress');
    }, [sessions]);

    const aggregatedLearnerDays = useMemo(() => {
        const groups: Record<string, any> = {};

        const activeAndPendingSessions = sessions.filter((session) => {
            const status =
                session.activitySessionStatus?.toLowerCase() || 'pending';
            return (
                status === 'pending' ||
                status === 'scheduled' ||
                status === 'in_progress'
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

        return Object.values(groups).sort((a: any, b: any) => {
            const aIsActive = a.sessions.some(
                (s: any) => s.activitySessionStatus === 'in_progress',
            );
            const bIsActive = b.sessions.some(
                (s: any) => s.activitySessionStatus === 'in_progress',
            );

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;

            return a.date.getTime() - b.date.getTime();
        });
    }, [sessions]);

    // Toast handler for locked clicks
    const handleLockedClick = () => {
        toast.error('Session in Progress', {
            description:
                'You must finish or cancel the active session before launching another sequence.',
            icon: <Lock className="text-rose-500" size={16} />,
        });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40 relative">
            {/* --- FIXED HEADER --- */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'h-12 w-12 rounded-[20px] flex items-center justify-center text-white shadow-md transition-colors',
                            hasGlobalActiveSession
                                ? 'bg-rose-500 shadow-rose-200'
                                : 'bg-indigo-600 shadow-indigo-200',
                        )}
                    >
                        {hasGlobalActiveSession ? (
                            <Radio size={20} className="animate-pulse" />
                        ) : (
                            <CalendarIcon size={20} />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                            {hasGlobalActiveSession
                                ? 'Active Monitoring'
                                : 'Upcoming Agenda'}
                        </h3>
                        <TechnicalLabel
                            className={
                                hasGlobalActiveSession ? 'text-rose-500' : ''
                            }
                        >
                            {hasGlobalActiveSession
                                ? 'Other Blocks Locked'
                                : 'Live & Pending Blocks'}
                        </TechnicalLabel>
                    </div>
                </div>

                <Badge
                    variant="outline"
                    className="h-8 px-3 rounded-xl border-slate-200 text-slate-500 font-bold text-xs font-mono bg-slate-50"
                >
                    {aggregatedLearnerDays.length} Block
                    {aggregatedLearnerDays.length !== 1 && 's'}
                </Badge>
            </div>

            {/* --- SCROLLABLE TIMELINE --- */}
            <div className="flex-1 min-h-0 relative bg-slate-50/50 overflow-y-auto custom-scrollbar">
                <div
                    className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply"
                    style={{
                        backgroundImage:
                            'radial-gradient(#cbd5e1 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                <div className="p-6 relative z-10 min-h-full">
                    {aggregatedLearnerDays.length > 0 && (
                        <div className="absolute left-[44px] top-6 bottom-6 w-0.5 bg-slate-200 -translate-x-1/2 rounded-full" />
                    )}

                    <div className="space-y-8">
                        {aggregatedLearnerDays.length > 0 ? (
                            aggregatedLearnerDays.map(
                                (group: any, index: number) => {
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
                                        parseISO(
                                            sorted[sorted.length - 1].startAt,
                                        ),
                                        'h:mm a',
                                    );

                                    const totalMin = group.sessions.reduce(
                                        (
                                            acc: number,
                                            s: ActivitySessionResponse,
                                        ) =>
                                            acc +
                                            (s.activity?.durationMinutes ||
                                                s.durationMinutes ||
                                                0),
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

                                    // Is this specific group active?
                                    const isGroupActive = group.sessions.some(
                                        (s: any) =>
                                            s.activitySessionStatus ===
                                            'in_progress',
                                    );

                                    // THE LOCK: If ANY session is active globally, and it's NOT this group, lock it.
                                    const isLockedByOtherSession =
                                        hasGlobalActiveSession &&
                                        !isGroupActive;

                                    return (
                                        <div
                                            key={group.id}
                                            className="flex gap-4 relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
                                            style={{
                                                animationDelay: `${index * 50}ms`,
                                                animationFillMode: 'both',
                                            }}
                                        >
                                            {/* PERFECTLY ALIGNED SPINE NODE */}
                                            <div className="w-10 relative flex flex-col items-center pt-8 shrink-0">
                                                <div
                                                    className={cn(
                                                        'w-[14px] h-[14px] rounded-full border-[3px] z-10 transition-all duration-300',
                                                        isGroupActive
                                                            ? 'border-indigo-600 ring-4 ring-indigo-200 scale-125 bg-indigo-50 animate-pulse'
                                                            : isLockedByOtherSession
                                                              ? 'bg-slate-200 border-slate-300' // Locked dot
                                                              : isBreak
                                                                ? 'bg-white border-amber-400 ring-4 ring-transparent group-hover:ring-amber-50 group-hover:bg-amber-100'
                                                                : 'bg-white border-slate-300 ring-4 ring-transparent group-hover:border-indigo-600 group-hover:ring-indigo-50 group-hover:scale-110',
                                                    )}
                                                >
                                                    {isGroupActive && (
                                                        <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-50" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* INTERACTIVE CARD */}
                                            <button
                                                // THE LOGIC FIX: Prevent opening modal if locked
                                                onClick={() =>
                                                    isLockedByOtherSession
                                                        ? handleLockedClick()
                                                        : onSessionClick(
                                                              group.sessions[0],
                                                              group.sessions,
                                                          )
                                                }
                                                className={cn(
                                                    'flex-1 p-6 rounded-[28px] border transition-all duration-300 text-left group/card relative overflow-hidden',
                                                    isLockedByOtherSession
                                                        ? 'bg-slate-50/50 border-slate-200 opacity-60 cursor-not-allowed' // Locked Card State
                                                        : 'hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]',
                                                    isGroupActive
                                                        ? 'bg-indigo-50/80 border-indigo-400 shadow-lg shadow-indigo-200/50'
                                                        : !isLockedByOtherSession &&
                                                            isBreak
                                                          ? 'bg-amber-50/80 border-amber-200 hover:border-amber-400 hover:shadow-amber-100'
                                                          : !isLockedByOtherSession
                                                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-indigo-100/50'
                                                            : '',
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={cn(
                                                                'h-12 w-12 rounded-[18px] flex items-center justify-center border-2 transition-colors shrink-0',
                                                                isGroupActive
                                                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-200'
                                                                    : isLockedByOtherSession
                                                                      ? 'bg-slate-100 border-slate-200 text-slate-300'
                                                                      : isBreak
                                                                        ? 'bg-amber-100 border-amber-50 text-amber-600'
                                                                        : 'bg-slate-50 border-white text-slate-400 shadow-sm group-hover/card:text-indigo-600 group-hover/card:bg-indigo-50 group-hover/card:border-indigo-100',
                                                            )}
                                                        >
                                                            {isLockedByOtherSession ? (
                                                                <Lock
                                                                    size={20}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            ) : isBreak ? (
                                                                <Coffee
                                                                    size={20}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            ) : (
                                                                <User
                                                                    size={20}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <h4
                                                                    className={cn(
                                                                        'text-base font-black leading-tight truncate',
                                                                        isGroupActive
                                                                            ? 'text-indigo-950'
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
                                                                    <span className="flex items-center gap-1 bg-indigo-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 animate-pulse shadow-sm">
                                                                        <Radio
                                                                            size={
                                                                                8
                                                                            }
                                                                        />{' '}
                                                                        LIVE
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={cn(
                                                                        'flex items-center gap-1.5 px-2 py-0.5 rounded-md border',
                                                                        isGroupActive
                                                                            ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                                                                            : isLockedByOtherSession
                                                                              ? 'bg-slate-100 border-transparent text-slate-400'
                                                                              : isBreak
                                                                                ? 'bg-amber-100 border-amber-200 text-amber-700'
                                                                                : 'bg-slate-100 border-slate-200 text-slate-600',
                                                                    )}
                                                                >
                                                                    {isLockedByOtherSession ? (
                                                                        <Lock
                                                                            size={
                                                                                10
                                                                            }
                                                                        />
                                                                    ) : isBreak ? (
                                                                        <Coffee
                                                                            size={
                                                                                10
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <Gamepad2
                                                                            size={
                                                                                10
                                                                            }
                                                                        />
                                                                    )}
                                                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">
                                                                        {
                                                                            group
                                                                                .sessions
                                                                                .length
                                                                        }{' '}
                                                                        {group
                                                                            .sessions
                                                                            .length ===
                                                                        1
                                                                            ? 'Task'
                                                                            : 'Tasks'}
                                                                    </span>
                                                                </div>
                                                                <TechnicalLabel
                                                                    className={cn(
                                                                        '!text-[9px] !tracking-wider',
                                                                        isGroupActive
                                                                            ? 'text-indigo-500'
                                                                            : isLockedByOtherSession
                                                                              ? 'text-slate-300'
                                                                              : '',
                                                                    )}
                                                                >
                                                                    {format(
                                                                        group.date,
                                                                        'MMM do',
                                                                    )}
                                                                </TechnicalLabel>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={cn(
                                                            'h-8 w-8 rounded-full flex items-center justify-center transition-colors shrink-0',
                                                            isGroupActive
                                                                ? 'bg-indigo-600 text-white'
                                                                : isLockedByOtherSession
                                                                  ? 'bg-slate-100 text-slate-300'
                                                                  : isBreak
                                                                    ? 'bg-amber-100 text-amber-600'
                                                                    : 'bg-slate-50 text-slate-300 group-hover/card:bg-indigo-600 group-hover/card:text-white',
                                                        )}
                                                    >
                                                        {isLockedByOtherSession ? (
                                                            <Lock
                                                                size={14}
                                                                strokeWidth={3}
                                                            />
                                                        ) : (
                                                            <ArrowUpRight
                                                                size={16}
                                                                strokeWidth={3}
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                <div
                                                    className={cn(
                                                        'flex items-center justify-between pt-4 border-t',
                                                        isGroupActive
                                                            ? 'border-indigo-200/50'
                                                            : isLockedByOtherSession
                                                              ? 'border-slate-200/50'
                                                              : isBreak
                                                                ? 'border-amber-200/50'
                                                                : 'border-slate-100',
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <TechnicalLabel
                                                            className={cn(
                                                                'mb-1',
                                                                isGroupActive
                                                                    ? 'text-indigo-400'
                                                                    : isLockedByOtherSession
                                                                      ? 'text-slate-300'
                                                                      : '',
                                                            )}
                                                        >
                                                            Start
                                                        </TechnicalLabel>
                                                        <span
                                                            className={cn(
                                                                'text-xs font-black tabular-nums',
                                                                isGroupActive
                                                                    ? 'text-indigo-950'
                                                                    : isLockedByOtherSession
                                                                      ? 'text-slate-400'
                                                                      : 'text-slate-700',
                                                            )}
                                                        >
                                                            {dayStart}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col items-center px-4">
                                                        <TechnicalLabel
                                                            className={cn(
                                                                'mb-1',
                                                                isGroupActive
                                                                    ? 'text-indigo-400'
                                                                    : isLockedByOtherSession
                                                                      ? 'text-slate-300'
                                                                      : '',
                                                            )}
                                                        >
                                                            Duration
                                                        </TechnicalLabel>
                                                        <div
                                                            className={cn(
                                                                'flex items-center gap-1.5 px-3 py-1 rounded-full',
                                                                isGroupActive
                                                                    ? 'bg-indigo-600 text-white shadow-inner'
                                                                    : isLockedByOtherSession
                                                                      ? 'bg-slate-100 text-slate-400'
                                                                      : isBreak
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'bg-indigo-50 text-indigo-700',
                                                            )}
                                                        >
                                                            <Clock
                                                                size={12}
                                                                strokeWidth={3}
                                                            />
                                                            <span className="text-xs font-black tabular-nums tracking-tight">
                                                                {totalMin}m
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end">
                                                        <TechnicalLabel
                                                            className={cn(
                                                                'mb-1',
                                                                isGroupActive
                                                                    ? 'text-indigo-400'
                                                                    : isLockedByOtherSession
                                                                      ? 'text-slate-300'
                                                                      : '',
                                                            )}
                                                        >
                                                            End
                                                        </TechnicalLabel>
                                                        <span
                                                            className={cn(
                                                                'text-xs font-black tabular-nums',
                                                                isGroupActive
                                                                    ? 'text-indigo-950'
                                                                    : isLockedByOtherSession
                                                                      ? 'text-slate-400'
                                                                      : 'text-slate-700',
                                                            )}
                                                        >
                                                            {dayEnd}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    );
                                },
                            )
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
                                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
                                    <CalendarIcon size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">
                                    No Scheduled Blocks
                                </h3>
                                <p className="text-xs font-bold text-slate-400 max-w-[200px]">
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
