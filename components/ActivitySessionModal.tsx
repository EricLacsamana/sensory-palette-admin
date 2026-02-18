'use client';

import React from 'react';
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
    ListChecks,
    Radio,
    CheckCircle2,
    Lock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const TechnicalLabel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={cn(
            'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] select-none',
            className,
        )}
    >
        {children}
    </span>
);

export default function ActivitySessionModal({
    isOpen,
    onClose,
    learnerName,
    activities = [],
    existingSession,
    onLaunchActivity,
    onLaunchFullSession,
}: any) {
    // --- SAFEGUARDS & CALCULATIONS ---
    const totalSequenceMinutes = activities.reduce(
        (acc: number, session: any) => {
            const mins =
                session.activity?.durationMinutes ||
                session.durationMinutes ||
                (session.durationSeconds
                    ? Math.floor(session.durationSeconds / 60)
                    : 0);
            return acc + mins;
        },
        0,
    );

    // 1. Check if the sequence is currently live
    const isSequenceActive = activities.some(
        (s: any) => s.activitySessionStatus === 'in_progress',
    );
    const activeSessionIndex = activities.findIndex(
        (s: any) => s.activitySessionStatus === 'in_progress',
    );

    return (
        <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="!max-w-[1000px] !w-[90vw] h-[85vh] p-0 overflow-hidden flex flex-col rounded-[40px] border border-slate-200 shadow-2xl bg-[#F8FAFC] focus:outline-none">
                {/* --- HEADER --- */}
                <DialogHeader
                    className={cn(
                        'p-8 lg:px-12 border-b flex flex-row justify-between items-center shrink-0 z-20 transition-colors duration-500',
                        isSequenceActive
                            ? 'bg-indigo-900 border-indigo-800'
                            : 'bg-white border-slate-100',
                    )}
                >
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div
                                className={cn(
                                    'h-16 w-16 rounded-[24px] flex items-center justify-center text-2xl font-black shadow-md',
                                    isSequenceActive
                                        ? 'bg-indigo-800 text-white shadow-indigo-950'
                                        : 'bg-indigo-600 text-white shadow-indigo-200',
                                )}
                            >
                                {learnerName?.charAt(0) || 'L'}
                            </div>
                            <div
                                className={cn(
                                    'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] flex items-center justify-center shadow-sm',
                                    isSequenceActive
                                        ? 'bg-emerald-500 border-indigo-900'
                                        : 'bg-emerald-500 border-white',
                                )}
                            >
                                <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center text-left">
                            <div className="flex items-center gap-3 mb-1.5">
                                <DialogTitle
                                    className={cn(
                                        'text-2xl lg:text-3xl font-black tracking-tight leading-none',
                                        isSequenceActive
                                            ? 'text-white'
                                            : 'text-slate-900',
                                    )}
                                >
                                    {learnerName || 'Learner Sequence'}
                                </DialogTitle>
                                {isSequenceActive && (
                                    <span className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        <Radio size={10} /> LIVE
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div
                                    className={cn(
                                        'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest',
                                        isSequenceActive
                                            ? 'text-indigo-200'
                                            : 'text-slate-500',
                                    )}
                                >
                                    <Calendar
                                        size={12}
                                        className={
                                            isSequenceActive
                                                ? 'text-indigo-400'
                                                : 'text-indigo-500'
                                        }
                                    />
                                    {existingSession?.startAt
                                        ? format(
                                              parseISO(existingSession.startAt),
                                              'MMM do, yyyy',
                                          )
                                        : "Today's Agenda"}
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
                                        'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest',
                                        isSequenceActive
                                            ? 'text-indigo-300'
                                            : 'text-indigo-600',
                                    )}
                                >
                                    <ListChecks size={12} />
                                    {activities.length} Steps
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-right pr-4">
                        <div className="flex flex-col items-end">
                            <TechnicalLabel
                                className={cn(
                                    'mb-1 text-[8px]',
                                    isSequenceActive && 'text-indigo-300',
                                )}
                            >
                                Est. Duration
                            </TechnicalLabel>
                            <span
                                className={cn(
                                    'text-lg font-black tabular-nums leading-none',
                                    isSequenceActive
                                        ? 'text-white'
                                        : 'text-slate-900',
                                )}
                            >
                                {totalSequenceMinutes}m
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                {/* --- BODY (SCROLLABLE SEQUENCE) --- */}
                <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">
                    <div
                        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply"
                        style={{
                            backgroundImage:
                                'radial-gradient(#cbd5e1 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }}
                    />

                    <div className="max-w-4xl mx-auto py-12 px-6 lg:px-12 relative z-10 min-h-full">
                        {activities.length > 1 && (
                            <div className="absolute left-[54px] lg:left-[78px] top-[76px] bottom-[76px] w-1 bg-slate-200 rounded-full -translate-x-1/2" />
                        )}

                        <div className="space-y-6">
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
                                const timeDisplay = session.startAt
                                    ? format(
                                          parseISO(session.startAt),
                                          'h:mm a',
                                      )
                                    : 'Pending';

                                // Step Statuses
                                const status =
                                    session.activitySessionStatus || 'pending';
                                const isCompleted = status === 'completed';
                                const isThisStepActive =
                                    status === 'in_progress';

                                // If the sequence is active, disable buttons for everything except the active step
                                const isLocked =
                                    isSequenceActive && !isThisStepActive;

                                return (
                                    <div
                                        key={session.id || idx}
                                        className="flex items-center gap-4 lg:gap-6 relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
                                        style={{
                                            animationDelay: `${idx * 75}ms`,
                                            animationFillMode: 'both',
                                        }}
                                    >
                                        {/* Spine Node */}
                                        <div className="relative w-10 shrink-0 flex items-center justify-center bg-[#F8FAFC] py-2">
                                            <div
                                                className={cn(
                                                    'h-8 w-8 rounded-full border-[3px] flex items-center justify-center text-[10px] font-black z-10 transition-all duration-300',
                                                    isThisStepActive
                                                        ? 'bg-indigo-600 border-indigo-200 text-white scale-125 ring-4 ring-indigo-100'
                                                        : isCompleted
                                                          ? 'bg-emerald-500 border-emerald-100 text-white'
                                                          : isBreak
                                                            ? 'bg-amber-100 border-amber-300 text-amber-700'
                                                            : 'bg-white border-slate-300 text-slate-400',
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2
                                                        size={14}
                                                        strokeWidth={3}
                                                    />
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>
                                        </div>

                                        {/* Interactive Card */}
                                        <div
                                            className={cn(
                                                'flex-1 p-6 rounded-[32px] border flex flex-col md:flex-row md:items-center justify-between transition-all duration-300 relative overflow-hidden',
                                                isThisStepActive
                                                    ? 'bg-indigo-50 border-indigo-300 shadow-xl shadow-indigo-100'
                                                    : isCompleted
                                                      ? 'bg-slate-50 border-slate-200 opacity-60'
                                                      : isBreak
                                                        ? 'bg-amber-50/80 border-amber-200'
                                                        : 'bg-white border-slate-200',
                                            )}
                                        >
                                            <div className="flex items-center gap-5 mb-4 md:mb-0">
                                                <div
                                                    className={cn(
                                                        'h-16 w-16 rounded-[20px] flex items-center justify-center transition-transform duration-300 border-2 shrink-0',
                                                        isThisStepActive
                                                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                                            : isCompleted
                                                              ? 'bg-slate-200 text-slate-400 border-slate-100'
                                                              : isBreak
                                                                ? 'bg-amber-100 text-amber-600 border-amber-50'
                                                                : 'bg-slate-50 text-slate-400 border-white shadow-sm',
                                                    )}
                                                >
                                                    {isBreak ? (
                                                        <Coffee
                                                            size={24}
                                                            strokeWidth={2.5}
                                                        />
                                                    ) : (
                                                        <Gamepad2
                                                            size={24}
                                                            strokeWidth={2.5}
                                                        />
                                                    )}
                                                </div>

                                                <div className="min-w-0 pr-4">
                                                    <h4
                                                        className={cn(
                                                            'font-black text-xl tracking-tight leading-tight truncate mb-1.5',
                                                            isThisStepActive
                                                                ? 'text-indigo-950'
                                                                : isCompleted
                                                                  ? 'text-slate-500 line-through'
                                                                  : isBreak
                                                                    ? 'text-amber-900'
                                                                    : 'text-slate-900',
                                                        )}
                                                    >
                                                        {session.activity
                                                            ?.name ||
                                                            (isBreak
                                                                ? 'Rest Break'
                                                                : 'Clinical Activity')}
                                                    </h4>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'flex items-center gap-1.5 px-2.5 py-1 rounded-md border',
                                                                isThisStepActive
                                                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-inner'
                                                                    : isCompleted
                                                                      ? 'bg-slate-200 border-slate-300 text-slate-500'
                                                                      : isBreak
                                                                        ? 'bg-amber-100 border-amber-200 text-amber-700'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-600',
                                                            )}
                                                        >
                                                            <Clock
                                                                size={12}
                                                                strokeWidth={3}
                                                            />
                                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 tabular-nums">
                                                                {duration}m
                                                                Block
                                                            </span>
                                                        </div>
                                                        <TechnicalLabel className="!text-[9px] lowercase">
                                                            @ {timeDisplay}
                                                        </TechnicalLabel>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Smart Action Button */}
                                            {isThisStepActive ? (
                                                <Button
                                                    onClick={onClose} // Usually just closes the modal to let them see the active game shell
                                                    className="h-12 lg:h-14 px-8 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.15em] shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse"
                                                >
                                                    View Active{' '}
                                                    <ArrowRight
                                                        size={14}
                                                        className="ml-2"
                                                    />
                                                </Button>
                                            ) : isLocked || isCompleted ? (
                                                <Button
                                                    disabled
                                                    className="h-12 lg:h-14 px-8 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.15em] bg-slate-100 text-slate-400 border-2 border-slate-200"
                                                >
                                                    {isCompleted
                                                        ? 'Done'
                                                        : 'Locked'}{' '}
                                                    <Lock
                                                        size={14}
                                                        className="ml-2"
                                                    />
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() =>
                                                        onLaunchActivity(
                                                            session,
                                                        )
                                                    }
                                                    className={cn(
                                                        'h-12 lg:h-14 px-8 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.15em] shadow-sm transition-all shrink-0 w-full md:w-auto',
                                                        isBreak
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                            : 'bg-slate-900 hover:bg-black text-white',
                                                    )}
                                                >
                                                    {isBreak
                                                        ? 'Start Break'
                                                        : 'Play Isolated'}{' '}
                                                    <Play
                                                        size={14}
                                                        className="ml-2 fill-current"
                                                    />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- FOOTER (SMART CTA) --- */}
                <div className="p-6 lg:p-8 border-t border-slate-100 flex justify-between items-center bg-white shrink-0 z-20">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-12 px-6 rounded-2xl"
                    >
                        {isSequenceActive ? 'Close Monitor' : 'Cancel'}
                    </Button>

                    {/* Primary Safe-Guard: Disable Full Launch if already active */}
                    <Button
                        onClick={() =>
                            !isSequenceActive && onLaunchFullSession(activities)
                        }
                        disabled={isSequenceActive}
                        className={cn(
                            'h-14 lg:h-16 px-8 lg:px-12 rounded-[24px] font-[1000] text-xs lg:text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 transition-all',
                            isSequenceActive
                                ? 'bg-slate-100 text-slate-400 shadow-none border-2 border-slate-200 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-black text-white hover:shadow-slate-900/40 hover:-translate-y-1',
                        )}
                    >
                        {isSequenceActive
                            ? 'Sequence Locked (Live)'
                            : 'Launch Sequence'}
                        {!isSequenceActive && (
                            <ArrowRight size={18} strokeWidth={3} />
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
