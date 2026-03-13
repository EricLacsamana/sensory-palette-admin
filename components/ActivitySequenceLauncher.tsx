'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Clock,
    Play,
    ArrowRight,
    Coffee,
    Gamepad2,
    Calendar,
    Radio,
    CheckCircle2,
    Lock,
    PlayCircle,
    ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    ActivitySessionResponse,
    ActivitySessionStatus,
} from '@/types/activitiy-session';

const TechnicalLabel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={cn(
            'text-[11px] font-medium text-slate-500 uppercase tracking-wider select-none',
            className,
        )}
    >
        {children}
    </span>
);

export default function ActivitySequenceLauncher({
    isOpen,
    onClose,
    learnerName,
    activities = [],
    existingSession,
    onLaunchActivity,
    onLaunchFullSession,
}: any) {
    // --- STATE & CALCULATIONS ---
    const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Default select all non-completed sessions
            const defaultSelected = activities
                .filter(
                    (a: ActivitySessionResponse) =>
                        a.activitySessionStatus !==
                        ActivitySessionStatus.Completed,
                )
                .map((a: ActivitySessionResponse) => a.documentId);
            setSelectedSessionIds(defaultSelected);
        }
    }, [isOpen, activities]);

    const toggleSelection = (documentId: string) => {
        setSelectedSessionIds((prev) =>
            prev.includes(documentId)
                ? prev.filter((id) => id !== documentId)
                : [...prev, documentId],
        );
    };

    const totalSequenceMinutes = useMemo(
        () =>
            activities.reduce(
                (acc: number, session: ActivitySessionResponse) => {
                    const mins = session.activity?.durationMinutes
                        ? Math.floor(session.activity?.durationMinutes / 60)
                        : 0;
                    return acc + mins;
                },
                0,
            ),
        [activities],
    );

    const isSequenceActive = activities.some(
        (s: ActivitySessionResponse) =>
            s.activitySessionStatus === ActivitySessionStatus.InProgress,
    );
    const completedCount = activities.filter(
        (s: ActivitySessionResponse) =>
            s.activitySessionStatus === ActivitySessionStatus.Completed,
    ).length;

    const progressPct =
        activities.length > 0
            ? Math.round((completedCount / activities.length) * 100)
            : 0;

    const nextUnplayedIndex = activities.findIndex(
        (s: ActivitySessionResponse) =>
            s.activitySessionStatus !== ActivitySessionStatus.Completed,
    );

    return (
        <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="!max-w-[850px] w-[95vw] h-[85vh] p-0 overflow-hidden flex flex-col rounded-[24px] md:rounded-[32px] border border-slate-200 shadow-xl bg-slate-50 focus:outline-none">
                {/* --- HEADER --- */}
                <DialogHeader
                    className={cn(
                        'p-6 md:p-8 border-b flex flex-col md:flex-row justify-between md:items-center shrink-0 z-20 transition-colors duration-300 gap-4 md:gap-0',
                        isSequenceActive
                            ? 'bg-indigo-900 border-indigo-800'
                            : 'bg-white border-slate-200',
                    )}
                >
                    <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                            <div
                                className={cn(
                                    'h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold',
                                    isSequenceActive
                                        ? 'bg-indigo-800 text-white'
                                        : 'bg-indigo-100 text-indigo-700',
                                )}
                            >
                                {learnerName?.charAt(0) || 'L'}
                            </div>
                            {isSequenceActive && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-emerald-500 border-indigo-900 flex items-center justify-center">
                                    <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col justify-center text-left">
                            <div className="flex items-center gap-3 mb-1">
                                <DialogTitle
                                    className={cn(
                                        'text-xl md:text-2xl font-semibold tracking-tight',
                                        isSequenceActive
                                            ? 'text-white'
                                            : 'text-slate-900',
                                    )}
                                >
                                    {learnerName || 'Learner Sequence'}
                                </DialogTitle>
                                {isSequenceActive && (
                                    <span className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider animate-pulse">
                                        <Radio size={10} /> LIVE
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                                <div
                                    className={cn(
                                        'flex items-center gap-1.5',
                                        isSequenceActive
                                            ? 'text-indigo-200'
                                            : 'text-slate-500',
                                    )}
                                >
                                    <Calendar size={14} />
                                    {existingSession?.startAt
                                        ? format(
                                              parseISO(existingSession.startAt),
                                              'MMM do, yyyy',
                                          )
                                        : "Today's Queue"}
                                </div>
                                <span
                                    className={
                                        isSequenceActive
                                            ? 'text-indigo-700'
                                            : 'text-slate-300'
                                    }
                                >
                                    •
                                </span>
                                <div
                                    className={cn(
                                        'flex items-center gap-1.5',
                                        isSequenceActive
                                            ? 'text-indigo-200'
                                            : 'text-slate-500',
                                    )}
                                >
                                    <Clock size={14} />
                                    {totalSequenceMinutes}m Total
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex flex-col md:w-48 shrink-0 mt-2 md:mt-0">
                        <div className="flex justify-between items-end mb-1.5">
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    isSequenceActive
                                        ? 'text-indigo-300'
                                        : 'text-slate-500',
                                )}
                            >
                                Progress
                            </span>
                            <span
                                className={cn(
                                    'text-sm font-semibold',
                                    isSequenceActive
                                        ? 'text-white'
                                        : 'text-slate-900',
                                )}
                            >
                                {completedCount} / {activities.length}
                            </span>
                        </div>
                        <div
                            className={cn(
                                'h-1.5 w-full rounded-full overflow-hidden',
                                isSequenceActive
                                    ? 'bg-indigo-950'
                                    : 'bg-slate-200',
                            )}
                        >
                            <div
                                className={cn(
                                    'h-full transition-all duration-700 ease-out',
                                    isSequenceActive
                                        ? 'bg-emerald-400'
                                        : 'bg-indigo-500',
                                )}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </DialogHeader>

                {/* --- BODY (TIMELINE) --- */}
                <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar bg-slate-50">
                    <div className="max-w-3xl mx-auto py-8 px-6 lg:px-10 relative z-10 min-h-full">
                        <div className="relative pl-10 md:pl-14">
                            {/* Spine */}
                            {activities.length > 1 && (
                                <div className="absolute left-[19px] md:left-[27px] top-8 bottom-8 w-[2px] bg-slate-200 rounded-full" />
                            )}

                            <div className="space-y-4">
                                {activities.map((session: any, idx: number) => {
                                    const isBreak =
                                        session.activity?.name
                                            ?.toLowerCase()
                                            .includes('break') ||
                                        session.name
                                            ?.toLowerCase()
                                            .includes('break');
                                    const duration =
                                        session.activity?.durationMinutes ||
                                        session.durationMinutes ||
                                        (session.durationSeconds
                                            ? Math.floor(
                                                  session.durationSeconds / 60,
                                              )
                                            : 0);

                                    const status =
                                        session.activitySessionStatus ||
                                        ActivitySessionStatus.Pending;
                                    const isCompleted =
                                        status ===
                                        ActivitySessionStatus.Completed;
                                    const isThisStepActive =
                                        status ===
                                        ActivitySessionStatus.InProgress;
                                    const isUpNext =
                                        !isSequenceActive &&
                                        !isCompleted &&
                                        idx === nextUnplayedIndex;
                                    const isLocked =
                                        isSequenceActive && !isThisStepActive;
                                    const isSelected =
                                        selectedSessionIds.includes(
                                            session.documentId,
                                        );

                                    return (
                                        <div
                                            key={session.id || idx}
                                            className="relative group flex items-center gap-3"
                                        >
                                            {/* Node */}
                                            <div className="absolute -left-10 md:-left-14 top-1/2 -translate-y-1/2 w-10 md:w-14 flex justify-center bg-transparent z-10">
                                                <div
                                                    className={cn(
                                                        'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all shadow-sm ring-4 ring-slate-50',
                                                        isThisStepActive
                                                            ? 'bg-indigo-600 text-white scale-110'
                                                            : isCompleted
                                                              ? 'bg-emerald-500 text-white'
                                                              : isUpNext
                                                                ? 'bg-white border-2 border-indigo-400 text-indigo-600'
                                                                : 'bg-white border-2 border-slate-200 text-slate-400',
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2
                                                            size={16}
                                                        />
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card */}
                                            <div
                                                className={cn(
                                                    'p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex-1',
                                                    isThisStepActive
                                                        ? 'bg-indigo-50 border-indigo-200 shadow-md'
                                                        : isUpNext
                                                          ? 'bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-sm'
                                                          : isCompleted
                                                            ? 'bg-transparent border-transparent opacity-60'
                                                            : 'bg-white border-slate-200',
                                                )}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {/* Checkbox for custom sequence queueing */}
                                                        {!isCompleted &&
                                                            !isThisStepActive &&
                                                            !isSequenceActive && (
                                                                <div className="flex items-center justify-center pr-1 shrink-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                        checked={
                                                                            isSelected
                                                                        }
                                                                        onChange={() =>
                                                                            toggleSelection(
                                                                                session.documentId,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            )}

                                                        <div
                                                            className={cn(
                                                                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                                                                isThisStepActive
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : isUpNext
                                                                      ? isBreak
                                                                          ? 'bg-amber-100 text-amber-600'
                                                                          : 'bg-indigo-100 text-indigo-600'
                                                                      : isCompleted
                                                                        ? 'bg-slate-200 text-slate-500'
                                                                        : 'bg-slate-100 text-slate-500',
                                                            )}
                                                        >
                                                            {isBreak ? (
                                                                <Coffee
                                                                    size={20}
                                                                />
                                                            ) : (
                                                                <Gamepad2
                                                                    size={20}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4
                                                                    className={cn(
                                                                        'font-semibold text-base truncate',
                                                                        isThisStepActive ||
                                                                            isUpNext
                                                                            ? 'text-slate-900'
                                                                            : isCompleted
                                                                              ? 'text-slate-500 line-through decoration-slate-300'
                                                                              : 'text-slate-700',
                                                                    )}
                                                                >
                                                                    {session
                                                                        .activity
                                                                        ?.name ||
                                                                        (isBreak
                                                                            ? 'Rest Break'
                                                                            : 'Clinical Activity')}
                                                                </h4>
                                                                {isUpNext && (
                                                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0">
                                                                        Next
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock
                                                                        size={
                                                                            12
                                                                        }
                                                                    />{' '}
                                                                    {duration}{' '}
                                                                    min
                                                                </div>
                                                                {!isCompleted &&
                                                                    session.startAt && (
                                                                        <>
                                                                            <span>
                                                                                •
                                                                            </span>
                                                                            <span>
                                                                                @{' '}
                                                                                {format(
                                                                                    parseISO(
                                                                                        session.startAt,
                                                                                    ),
                                                                                    'h:mm a',
                                                                                )}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center sm:justify-end shrink-0 pl-16 sm:pl-0">
                                                        {isThisStepActive ? (
                                                            <Button
                                                                onClick={
                                                                    onClose
                                                                }
                                                                className="h-9 px-4 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                                                            >
                                                                View Screen{' '}
                                                                <ArrowRight
                                                                    size={14}
                                                                    className="ml-2"
                                                                />
                                                            </Button>
                                                        ) : isCompleted ? (
                                                            <div className="flex items-center text-emerald-600 font-semibold text-xs gap-1.5">
                                                                <CheckCircle2
                                                                    size={16}
                                                                />{' '}
                                                                Done
                                                            </div>
                                                        ) : isLocked ? (
                                                            <div className="flex items-center text-slate-400 font-semibold text-xs gap-1.5">
                                                                <Lock
                                                                    size={14}
                                                                />{' '}
                                                                Locked
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                onClick={() =>
                                                                    onLaunchActivity(
                                                                        session,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    'h-9 px-4 rounded-lg font-medium text-xs transition-all w-full sm:w-auto opacity-100 sm:opacity-0 group-hover:opacity-100',
                                                                    isUpNext
                                                                        ? 'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white sm:opacity-100'
                                                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                                                                )}
                                                            >
                                                                Play Single{' '}
                                                                <PlayCircle
                                                                    size={14}
                                                                    className="ml-2"
                                                                />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 md:p-6 border-t border-slate-200 flex justify-between items-center bg-white shrink-0 z-20">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-semibold text-sm text-slate-500 hover:text-slate-800 h-10 px-4 rounded-xl"
                    >
                        {isSequenceActive ? 'Close Dialog' : 'Cancel'}
                    </Button>

                    <Button
                        onClick={() => {
                            if (!isSequenceActive) {
                                // Provide only the checked items to the dashboard for queuing
                                const sequenceItemsToLaunch = activities.filter(
                                    (a: ActivitySessionResponse) =>
                                        selectedSessionIds.includes(
                                            a.documentId,
                                        ),
                                );
                                onLaunchFullSession(sequenceItemsToLaunch);
                            }
                        }}
                        disabled={
                            isSequenceActive ||
                            completedCount === activities.length ||
                            selectedSessionIds.length === 0
                        }
                        className={cn(
                            'h-10 md:h-12 px-6 md:px-8 rounded-xl font-semibold text-sm shadow-sm transition-all',
                            isSequenceActive
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : completedCount === activities.length ||
                                    selectedSessionIds.length === 0
                                  ? 'bg-emerald-500 text-white cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md hover:-translate-y-0.5',
                        )}
                    >
                        {isSequenceActive
                            ? 'Sequence Locked (Live)'
                            : completedCount === activities.length
                              ? 'Sequence Complete'
                              : selectedSessionIds.length === 0
                                ? 'Select items to start'
                                : `Queue ${selectedSessionIds.length} Items & Start`}

                        {!isSequenceActive &&
                            completedCount !== activities.length &&
                            selectedSessionIds.length > 0 && (
                                <ChevronRight size={18} className="ml-1.5" />
                            )}
                        {completedCount === activities.length && (
                            <CheckCircle2 size={18} className="ml-1.5" />
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
