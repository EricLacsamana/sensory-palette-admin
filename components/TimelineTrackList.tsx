'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import {
    Play,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    ArrowRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Animation Variants ---
const listVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    show: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
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
    let startTime = '--:--';
    let ampm = '';

    if (item.startAt) {
        try {
            const date = parseISO(item.startAt);
            startTime = format(date, 'h:mm');
            ampm = format(date, 'a');
        } catch (e) {
            console.error('Date parse error', e);
        }
    }

    const status = item.activitySessionStatus || 'upcoming';
    const isCompleted = status === 'completed';
    const isInProgress = status === 'in-progress';
    const isUpcoming = status === 'pending';

    return (
        <motion.div
            variants={itemVariants}
            className={cn(
                'group relative flex gap-4 w-full',
                isCompleted && 'opacity-60',
            )}
        >
            {/* Time Column */}
            <div className="w-[52px] flex flex-col items-end pt-3 shrink-0">
                <span
                    className={cn(
                        'text-xs font-bold tabular-nums leading-none tracking-tight',
                        isInProgress ? 'text-indigo-600' : 'text-slate-700',
                    )}
                >
                    {startTime}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                    {ampm}
                </span>
            </div>

            {/* Spine */}
            <div className="relative flex flex-col items-center shrink-0 w-6">
                <div
                    className={cn(
                        'w-3 h-3 rounded-full border-[2px] z-20 mt-[14px] transition-all duration-300 relative',
                        isInProgress
                            ? 'bg-indigo-600 border-indigo-100 ring-2 ring-indigo-50 scale-110 shadow-sm'
                            : isCompleted
                              ? 'bg-slate-200 border-slate-300'
                              : 'bg-white border-slate-300 group-hover:border-indigo-400',
                    )}
                >
                    {isInProgress && (
                        <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-75" />
                    )}
                </div>
                {!isLast && (
                    <div className="w-px flex-1 absolute top-7 bottom-[-16px] z-0 bg-slate-200" />
                )}
            </div>

            {/* Card Content */}
            <div className="flex-1 pb-4 min-w-0">
                <div
                    className={cn(
                        'rounded-xl border p-3 flex items-center justify-between transition-all duration-200',
                        isInProgress
                            ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm',
                    )}
                >
                    <div className="flex flex-col gap-1 overflow-hidden">
                        <h5
                            className={cn(
                                'text-sm font-semibold truncate',
                                isInProgress
                                    ? 'text-slate-900'
                                    : 'text-slate-700',
                            )}
                        >
                            {item.activity?.name || 'Untitled Activity'}
                        </h5>

                        <div className="flex items-center gap-2">
                            {isInProgress && (
                                <Badge
                                    variant="secondary"
                                    className="h-5 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-100 rounded-[4px] text-[9px] font-bold uppercase tracking-wider gap-1"
                                >
                                    <Clock
                                        size={10}
                                        className="animate-pulse"
                                    />
                                    Active
                                </Badge>
                            )}
                            {isCompleted && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                                    <CheckCircle2 size={12} />
                                    Completed
                                </span>
                            )}
                            {isUpcoming && (
                                <span className="text-[10px] font-medium text-slate-400">
                                    {item.durationMinutes
                                        ? `${item.durationMinutes}m duration`
                                        : 'Scheduled'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="pl-3">
                        {isInProgress ? (
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                            >
                                <Play size={12} fill="currentColor" />
                            </Button>
                        ) : (
                            <div className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-300 transition-colors">
                                {isCompleted ? (
                                    <CheckCircle2 size={16} />
                                ) : (
                                    <ArrowRight size={16} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const TimelineTrackList = ({
    data = [],
    className,
}: {
    data: ActivitySessionResponse[];
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden',
                className,
            )}
        >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Session Timeline
                    </span>
                    <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1 border-slate-200 text-slate-500 font-mono"
                    >
                        {data.length}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                >
                    <MoreHorizontal size={14} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 relative">
                <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage:
                            'radial-gradient(#cbd5e1 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />

                <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="relative z-10 space-y-0"
                >
                    {data.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                            <Clock size={20} className="mb-2 opacity-50" />
                            <span className="text-xs font-medium">
                                No sessions scheduled
                            </span>
                        </div>
                    ) : (
                        data.map((item, idx) => (
                            <TimelineTrackItem
                                key={item.id || idx}
                                item={item}
                                isLast={idx === data.length - 1}
                            />
                        ))
                    )}
                </motion.div>
            </div>
        </div>
    );
};
