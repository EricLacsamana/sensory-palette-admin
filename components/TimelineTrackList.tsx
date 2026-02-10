'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Play, ChevronRight, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- Animation Variants ---
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
};

// --- Sub-component: Individual Timeline Item ---
const TimelineTrackItem = ({ item }: { item: ActivitySessionResponse }) => {
    let timeMain = '--:--';
    let timePeriod = '';

    if (item.startAt) {
        try {
            const date = parseISO(item.startAt);
            timeMain = format(date, 'h:mm');
            timePeriod = format(date, 'a');
        } catch (error) {
            console.error('Invalid date format:', item.startAt);
        }
    }

    const isInProgress = item.activitySessionStatus === 'in-progress';
    const isCompleted = item.activitySessionStatus === 'completed';

    return (
        <motion.div
            variants={itemVariants}
            className={cn(
                'relative flex gap-6 pl-1 group',
                isCompleted && 'opacity-50',
            )}
        >
            {/* Time Column */}
            <div className="w-16 pt-6 flex flex-col items-end shrink-0">
                <span className="text-[13px] font-bold text-slate-900 tabular-nums leading-none">
                    {timeMain}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {timePeriod}
                </span>
            </div>

            {/* Timeline Node (Dot) */}
            <div
                className={cn(
                    'absolute left-[78px] top-7 h-3 w-3 rounded-full border-2 bg-white z-20 shadow-sm transition-all duration-300',
                    isInProgress
                        ? 'border-indigo-600 scale-110 bg-indigo-600 ring-2 ring-indigo-100'
                        : 'border-slate-300 group-hover:border-indigo-400',
                    isCompleted && 'bg-slate-100 border-slate-200',
                )}
            />

            {/* Card Content */}
            <div
                className={cn(
                    'flex-1 p-3 ml-6 rounded-2xl border transition-all duration-300 flex items-center justify-between',
                    isInProgress
                        ? 'bg-white border-indigo-200 shadow-md shadow-indigo-100/50 scale-[1.02] z-10'
                        : 'bg-white/60 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm',
                )}
            >
                <div className="space-y-1.5 flex flex-col">
                    <h5 className="text-[14px] font-semibold text-slate-800 tracking-tight leading-snug">
                        {item.activity?.name || 'Unknown Activity'}
                    </h5>

                    <div className="flex items-center gap-2">
                        {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-tight border border-emerald-100">
                                <ShieldCheck size={10} /> Finished
                            </span>
                        ) : isInProgress ? (
                            <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-tight border border-indigo-100">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                                </span>
                                In Progress
                            </div>
                        ) : (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight px-1">
                                Upcoming
                            </span>
                        )}
                    </div>
                </div>

                {isInProgress ? (
                    <Button
                        size="icon"
                        className="h-8 w-8 bg-indigo-600 rounded-xl shadow-indigo-200 shadow-sm hover:bg-indigo-700 hover:shadow-indigo-300 transition-all"
                    >
                        <Play className="h-3.5 w-3.5 fill-current text-white ml-0.5" />
                    </Button>
                ) : (
                    <div className="h-8 w-8 flex items-center justify-center">
                        <ChevronRight size={16} className="text-slate-300" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const TimelineTrackList = ({
    data,
}: {
    data: ActivitySessionResponse[];
}) => {
    return (
        <Card className="rounded-[32px] border border-slate-200/60 shadow-sm bg-white flex flex-col h-[310px] overflow-hidden">
            <div className="flex justify-between items-center p-6 pb-2 border-b border-slate-50 shrink-0 bg-white z-20">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                    Session Timeline
                </h4>
                <Badge className="bg-slate-50 text-slate-500 border border-slate-100 font-semibold px-2 py-0.5 text-[9px]">
                    {data?.length} Items
                </Badge>
            </div>
            <div
                className="absolute left-[84px] top-[70px] bottom-0 w-[2px] bg-slate-100 z-0 pointer-events-none"
                aria-hidden="true"
            />
            <div className="relative flex-1 overflow-y-auto p-4 pr-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {/* Vertical Line */}

                <motion.div
                    key={data.length}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-4 relative z-10 pb-6"
                >
                    {data.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 text-sm">
                            No sessions scheduled for today.
                        </div>
                    ) : (
                        data.map((item) => (
                            <TimelineTrackItem key={item.id} item={item} />
                        ))
                    )}
                </motion.div>
            </div>
        </Card>
    );
};
