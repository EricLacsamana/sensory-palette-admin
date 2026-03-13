'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
    Play,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    ArrowRight,
    Gamepad2,
    Activity,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActivitySessionResponse } from '@/types/activitiy-session';

// --- Animation Variants ---
const listVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
    },
};

// --- Sub-component: Individual Timeline Item ---
const TimelineTrackItem = ({
    item,
    isLast,
}: {
    item: ActivitySessionResponse;
    isLast: boolean;
}) => {
    // 1. Live Timer State
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const status = item.activitySessionStatus || 'pending';
    const isCompleted = status === 'completed';
    const isInProgress = status === 'in_progress';
    const isUpcoming = status === 'pending';

    // 2. Timer Logic (Only runs if active and has a start time)
    useEffect(() => {
        if (!isInProgress || !item.actualStartAt) return;

        const startTime = new Date(item.actualStartAt).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = Math.floor((now - startTime) / 1000);
            setElapsedSeconds(difference > 0 ? difference : 0);
        };

        updateTimer(); // Initial call to avoid 1s delay
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [isInProgress, item.actualStartAt]);

    // 3. Format Timer Output
    const formatElapsed = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // 4. Standard Date Formatting
    let timeDisplay = '--:--';
    let ampm = '';
    const timeToFormat = item.actualStartAt || item.startAt;

    if (timeToFormat) {
        try {
            const date = parseISO(timeToFormat);
            timeDisplay = format(date, 'h:mm');
            ampm = format(date, 'a');
        } catch (e) {
            console.error('Date parse error', e);
        }
    }

    return (
        <motion.div
            variants={itemVariants}
            className="group relative flex w-full"
        >
            {/* Time Column (Fixed Width) */}
            <div className="w-[60px] flex flex-col items-end pt-3.5 pr-4 shrink-0">
                <span
                    className={cn(
                        'text-[13px] font-black tabular-nums leading-none tracking-tight',
                        isInProgress
                            ? 'text-indigo-600'
                            : isCompleted
                              ? 'text-slate-400'
                              : 'text-slate-700',
                    )}
                >
                    {timeDisplay}
                </span>
                <span
                    className={cn(
                        'text-[9px] font-bold uppercase tracking-widest mt-1',
                        isInProgress ? 'text-indigo-400' : 'text-slate-400',
                    )}
                >
                    {ampm}
                </span>
            </div>

            {/* Timeline Spine */}
            <div className="relative flex flex-col items-center shrink-0 w-6">
                <div className="w-0.5 h-3.5 bg-slate-100" />

                <div
                    className={cn(
                        'w-3.5 h-3.5 rounded-full border-2 z-20 transition-all duration-300 relative',
                        isInProgress
                            ? 'bg-indigo-600 border-indigo-100 ring-[3px] ring-indigo-50 shadow-sm'
                            : isCompleted
                              ? 'bg-emerald-500 border-emerald-100'
                              : 'bg-white border-slate-300 group-hover:border-indigo-400',
                    )}
                >
                    {isInProgress && (
                        <span className="absolute -inset-1.5 rounded-full bg-indigo-500 animate-ping opacity-40" />
                    )}
                </div>

                {!isLast && (
                    <div
                        className={cn(
                            'w-0.5 flex-1 absolute top-[26px] bottom-[-14px] z-0 transition-colors',
                            isCompleted ? 'bg-emerald-100' : 'bg-slate-100',
                        )}
                    />
                )}
            </div>

            {/* Card Content Column */}
            <div className="flex-1 pb-4 pl-4 min-w-0">
                <div
                    className={cn(
                        'rounded-[20px] p-4 flex items-center justify-between transition-all duration-300 border',
                        isInProgress
                            ? 'bg-indigo-50/50 border-indigo-100 shadow-sm'
                            : isCompleted
                              ? 'bg-white border-slate-100 opacity-80'
                              : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm',
                    )}
                >
                    <div className="flex flex-col gap-1.5 overflow-hidden pr-4">
                        <h5
                            className={cn(
                                'text-sm font-black truncate tracking-tight',
                                isInProgress
                                    ? 'text-indigo-900'
                                    : 'text-slate-900',
                            )}
                        >
                            {item.activity?.name || 'Untitled Activity'}
                        </h5>

                        <div className="flex items-center gap-3">
                            {/* LIVE TIMER BADGE */}
                            {isInProgress && (
                                <div className="flex items-center gap-1.5 bg-indigo-600 text-white px-2.5 py-0.5 rounded-md shadow-sm shadow-indigo-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[11px] font-black tracking-widest tabular-nums">
                                        {formatElapsed(elapsedSeconds)}
                                    </span>
                                </div>
                            )}

                            {isCompleted && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                    <CheckCircle2 size={12} strokeWidth={3} />
                                    <span>Done</span>
                                </div>
                            )}
                            {isUpcoming && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Clock size={12} />
                                    <span>Pending</span>
                                </div>
                            )}

                            {/* Duration Target Indicator */}
                            {item.activity?.durationMinutes && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                                        {item.activity.durationMinutes} MIN GOAL
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="shrink-0 flex items-center justify-center">
                        {isInProgress ? (
                            <div className="h-10 w-10 rounded-[14px] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
                                <Activity size={18} />
                            </div>
                        ) : isCompleted ? (
                            <div className="h-10 w-10 flex items-center justify-center rounded-[14px] bg-slate-50 text-emerald-500">
                                <CheckCircle2 size={18} />
                            </div>
                        ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-[14px] bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                <ArrowRight size={18} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN EXPORT COMPONENT ---
export const TimelineTrackList = ({
    data = [],
    className,
}: {
    data: ActivitySessionResponse[];
    className?: string;
}) => {
    return (
        <div className={cn('w-full', className)}>
            <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 flex flex-col"
            >
                {data.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/50">
                        <Gamepad2 size={24} className="mb-3 opacity-40" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            No Timeline Data
                        </span>
                    </div>
                ) : (
                    data.map((item, idx) => (
                        <TimelineTrackItem
                            key={item.id || item.documentId || idx}
                            item={item}
                            isLast={idx === data.length - 1}
                        />
                    ))
                )}
            </motion.div>
        </div>
    );
};
