'use client';

import React, { useMemo } from 'react';
import {
    Clock,
    User,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Gamepad2,
    Radio,
    Lock,
    PauseCircle,
    PlayCircle,
    ActivitySquare,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ActivitySessionResponse,
    ActivitySessionStatus,
} from '@/types/activitiy-session';
import { Activity, Activity as ActivityType } from '@/types/actitivity';
import { FormatService } from '@/utils/helpers';

interface ScheduleQueueProps {
    sessions: ActivitySessionResponse[];
    onSessionClick: (
        s: ActivitySessionResponse,
        activitySessions: ActivitySessionResponse[],
    ) => void;
}

export function ScheduleQueueHacked({
    sessions,
    onSessionClick,
}: ScheduleQueueProps) {
    // Check if ANY session in the entire database is currently live or paused
    const hasGlobalActiveSession = useMemo(() => {
        return sessions.some((s) => {
            const status = s.activitySessionStatus?.toLowerCase();
            return status === 'in_progress' || status === 'paused';
        });
    }, [sessions]);

    const aggregatedLearnerDays = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groups: Record<string, any> = {};

        // Grab the system's current date right now
        const systemToday = new Date();

        // ✨ THE FIX: Filter by status AND check if the session is scheduled for today
        const activeAndPendingSessions = sessions.filter((session) => {
            const status =
                session.activitySessionStatus?.toLowerCase() || 'pending';
            const isMatchingStatus = [
                'pending',
                'in_progress',
                'paused',
            ].includes(status);

            const effectiveStart = session.actualStartAt || session.startAt;
            if (!effectiveStart) return false;

            const sessionDate = new Date(effectiveStart);

            // Safety against bad dates
            if (isNaN(sessionDate.getTime())) return false;

            // Check if the session's date matches the computer's system date
            const isSessionToday = isSameDay(sessionDate, systemToday);

            return isMatchingStatus && isSessionToday;
        });

        activeAndPendingSessions.forEach((session) => {
            const effectiveStart = session.actualStartAt || session.startAt;
            const dateObj = new Date(effectiveStart);
            const dateStr = format(dateObj, 'yyyy-MM-dd');
            const studentId =
                session.student?.documentId ||
                session.student?.id ||
                'unassigned';
            const groupKey = `${studentId}-${dateStr}`;

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    id: groupKey,
                    student: session.student,
                    date: dateObj,
                    sessions: [],
                };
            }
            groups[groupKey].sessions.push(session);
        });

        return Object.values(groups).sort((a, b) => {
            const aIsActive = a.sessions.some((s: ActivitySessionResponse) => {
                const stat = s.activitySessionStatus?.toLowerCase();
                return stat === 'in_progress' || stat === 'paused';
            });
            const bIsActive = b.sessions.some((s: ActivitySessionResponse) => {
                const stat = s.activitySessionStatus?.toLowerCase();
                return stat === 'in_progress' || stat === 'paused';
            });

            // Always float active/paused blocks to the very top
            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;

            return a.date.getTime() - b.date.getTime();
        });
    }, [sessions]);

    const handleLockedClick = () => {
        toast.error('Session in Progress', {
            description:
                'You must finish or safely conclude the active session before launching another learner block.',
            icon: <Lock className="text-rose-500" size={16} />,
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden shadow-sm relative">
            {/* --- HEADER --- */}
            <div className="p-6 pb-5 border-b border-slate-200/60 flex items-center justify-between bg-white shrink-0 z-20">
                <div className="flex items-center gap-3.5">
                    <div
                        className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center text-white transition-all shadow-sm',
                            hasGlobalActiveSession
                                ? 'bg-rose-500 shadow-rose-200'
                                : 'bg-indigo-600 shadow-indigo-200',
                        )}
                    >
                        {hasGlobalActiveSession ? (
                            <Radio size={18} className="animate-pulse" />
                        ) : (
                            <CalendarIcon size={18} />
                        )}
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                            {hasGlobalActiveSession
                                ? 'Live Monitoring'
                                : 'Upcoming Activities'}
                        </h3>
                        <p
                            className={cn(
                                'text-[11px] font-bold uppercase tracking-widest mt-0.5',
                                hasGlobalActiveSession
                                    ? 'text-rose-500'
                                    : 'text-slate-400',
                            )}
                        >
                            {hasGlobalActiveSession
                                ? 'Other Blocks Locked'
                                : 'Pending Blocks'}
                        </p>
                    </div>
                </div>
                <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-500 hover:bg-slate-100 font-black px-2.5 shadow-inner"
                >
                    {aggregatedLearnerDays.length}
                </Badge>
            </div>

            {/* --- TIMELINE BODY --- */}
            <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="p-6 relative z-10 min-h-full">
                    {/* Spine Line */}
                    {aggregatedLearnerDays.length > 0 && (
                        <div className="absolute left-[44px] top-8 bottom-6 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent -translate-x-1/2 rounded-full" />
                    )}

                    <div className="space-y-6">
                        {aggregatedLearnerDays.length > 0 ? (
                            aggregatedLearnerDays.map((group) => {
                                const sorted = [...group.sessions].sort(
                                    (a, b) => {
                                        const timeA = new Date(
                                            a.actualStartAt || a.startAt,
                                        ).getTime();
                                        const timeB = new Date(
                                            b.actualStartAt || b.startAt,
                                        ).getTime();
                                        return (
                                            (isNaN(timeA) ? 0 : timeA) -
                                            (isNaN(timeB) ? 0 : timeB)
                                        );
                                    },
                                );

                                const dayStart = format(
                                    new Date(
                                        sorted[0].actualStartAt ||
                                            sorted[0].startAt,
                                    ),
                                    'h:mm a',
                                );
                                const totalMin = group.sessions.reduce(
                                    (acc: number, s: ActivitySessionResponse) =>
                                        acc +
                                        (s.activity?.durationMinutes || 0),
                                    0,
                                );

                                const isUnassigned = !group.student;

                                const isGroupLive = group.sessions.some(
                                    (s: ActivitySessionResponse) =>
                                        s.activitySessionStatus?.toLowerCase() ===
                                        'in_progress',
                                );
                                const isGroupPaused = group.sessions.some(
                                    (s: ActivitySessionResponse) =>
                                        s.activitySessionStatus?.toLowerCase() ===
                                        'paused',
                                );
                                const isGroupActive =
                                    isGroupLive || isGroupPaused;

                                const isLockedByOtherSession =
                                    hasGlobalActiveSession && !isGroupActive;

                                return (
                                    <div
                                        key={group.id}
                                        className="flex gap-4 relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
                                    >
                                        {/* Timeline Node */}
                                        <div className="w-10 relative flex flex-col pt-5 items-center shrink-0">
                                            <div
                                                className={cn(
                                                    'w-3.5 h-3.5 rounded-full z-10 transition-all duration-300 ring-4',
                                                    isGroupLive
                                                        ? 'bg-blue-500 ring-blue-100 animate-pulse'
                                                        : isGroupPaused
                                                          ? 'bg-orange-400 ring-orange-100'
                                                          : isLockedByOtherSession
                                                            ? 'bg-slate-200 ring-slate-100'
                                                            : 'bg-indigo-400 ring-indigo-50 group-hover:bg-indigo-500 group-hover:ring-indigo-100',
                                                )}
                                            />
                                        </div>

                                        {/* Interactive Block Card */}
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
                                                'flex-1 p-4 rounded-2xl border transition-all duration-200 text-left group/card relative overflow-hidden',
                                                isLockedByOtherSession
                                                    ? 'bg-slate-50/50 border-slate-200/60 opacity-60 cursor-not-allowed'
                                                    : 'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
                                                isGroupLive
                                                    ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                                    : isGroupPaused
                                                      ? 'bg-orange-50/50 border-orange-200 shadow-sm'
                                                      : !isLockedByOtherSession
                                                        ? 'bg-white border-slate-200 hover:border-indigo-200'
                                                        : '',
                                            )}
                                        >
                                            {/* Card Header */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        className={cn(
                                                            'h-10 w-10 rounded-xl border shadow-sm transition-colors',
                                                            isGroupLive
                                                                ? 'border-blue-200'
                                                                : isGroupPaused
                                                                  ? 'border-orange-200'
                                                                  : 'border-slate-100',
                                                        )}
                                                    >
                                                        <AvatarImage
                                                            src={FormatService.formatStrapiMedia(
                                                                group.student
                                                                    ?.profilePicture,
                                                                'thumbnail',
                                                            )}
                                                            className="object-cover"
                                                        />
                                                        <AvatarFallback
                                                            className={cn(
                                                                'text-xs font-bold rounded-xl',
                                                                isGroupActive
                                                                    ? 'bg-white text-slate-900'
                                                                    : 'bg-slate-100 text-slate-500',
                                                            )}
                                                        >
                                                            {isUnassigned ? (
                                                                <User
                                                                    size={16}
                                                                />
                                                            ) : (
                                                                group.student?.firstName?.charAt(
                                                                    0,
                                                                )
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4
                                                                className={cn(
                                                                    'text-sm font-black truncate',
                                                                    isGroupActive
                                                                        ? 'text-slate-900'
                                                                        : isLockedByOtherSession
                                                                          ? 'text-slate-500'
                                                                          : 'text-slate-800',
                                                                )}
                                                            >
                                                                {isUnassigned
                                                                    ? 'Unassigned Block'
                                                                    : `${group.student?.firstName} ${group.student?.lastName}`}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                            <Clock size={10} />{' '}
                                                            {dayStart} •{' '}
                                                            {totalMin} min
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Top Right Action / Status */}
                                                <div className="shrink-0 flex flex-col items-end gap-2">
                                                    {isLockedByOtherSession ? (
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                                            <Lock size={14} />
                                                        </div>
                                                    ) : isGroupLive ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-blue-100 text-blue-700 font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 animate-pulse"
                                                        >
                                                            <PlayCircle
                                                                size={10}
                                                                className="mr-1"
                                                            />{' '}
                                                            Live
                                                        </Badge>
                                                    ) : isGroupPaused ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-orange-100 text-orange-700 font-bold text-[9px] uppercase tracking-widest px-2 py-0.5"
                                                        >
                                                            <PauseCircle
                                                                size={10}
                                                                className="mr-1"
                                                            />{' '}
                                                            Paused
                                                        </Badge>
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover/card:bg-indigo-50 group-hover/card:text-indigo-600 transition-colors">
                                                            <ArrowUpRight
                                                                size={16}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Detailed Activity Previews */}
                                            <div className="pt-3 border-t border-slate-100/80">
                                                <div className="flex items-center gap-1 mb-2">
                                                    <ActivitySquare
                                                        size={12}
                                                        className={cn(
                                                            isGroupActive
                                                                ? 'text-indigo-500'
                                                                : 'text-slate-400',
                                                        )}
                                                    />
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                        Sequence (
                                                        {group.sessions.length})
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sorted.map(
                                                        (
                                                            s: ActivitySessionResponse,
                                                        ) => (
                                                            <Badge
                                                                key={
                                                                    s.documentId
                                                                }
                                                                variant="outline"
                                                                className={cn(
                                                                    'text-[9px] font-semibold border px-2 py-0.5',
                                                                    isGroupActive
                                                                        ? 'bg-white border-slate-200 text-slate-700'
                                                                        : 'bg-slate-50 border-slate-200/60 text-slate-500',
                                                                )}
                                                            >
                                                                {s.activity
                                                                    ?.name ||
                                                                    'Task'}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                                    <CalendarIcon size={24} />
                                </div>
                                <h3 className="text-base font-black text-slate-900 mb-1">
                                    Queue Empty
                                </h3>
                                <p className="text-xs font-medium text-slate-500 max-w-[200px] leading-relaxed">
                                    All assigned blocks are either completed or
                                    unassigned for today.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
