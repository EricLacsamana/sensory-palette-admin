'use client';

import React, { useState, useMemo } from 'react';
import {
    Trash2,
    Plus,
    Sunrise,
    Flag,
    ChevronDown,
    AlertCircle,
} from 'lucide-react';
import {
    Reorder,
    useDragControls,
    motion,
    AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { Activity } from '@/types/actitivity';
import ItemCard, { ActivitySessionStatus } from './ItemCard';
import { getUserColor } from '@/utils/colors';

interface TimelineItemProps {
    variant: 'activity' | 'gap';
    data: ActivitySessionEntry & { status?: ActivitySessionStatus };
    isDraggingAny?: boolean;
    sessionStart?: string;
    sessionEnd?: string;
    currentStudentId?: number | null;
    onRemove?: () => void;
    onToggleLock?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onGapDrop?: (activity: Activity) => void;
    onTimeChange?: (time: string) => void;
}

const BASE_START_TIMES = Array.from({ length: 49 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    return {
        str: `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`,
        totalMinutes,
    };
});

export const TimelineEndpoint = ({
    type,
    time,
}: {
    type: 'start' | 'end';
    time: string;
}) => {
    const isStart = type === 'start';
    const timeParts = time.split(' ');

    return (
        <div className="flex flex-row items-center w-full select-none relative h-12 sm:h-16 group z-0">
            {/* Fully responsive width scale */}
            <div className="w-[48px] sm:w-[64px] lg:w-[80px] flex justify-end pr-1.5 sm:pr-3 lg:pr-4 shrink-0">
                <div
                    className={cn(
                        'flex flex-col items-center justify-center px-1.5 py-1 rounded-md border',
                        isStart
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                            : 'text-slate-600 bg-slate-50 border-slate-200',
                    )}
                >
                    <span className="text-[10px] sm:text-[11px] font-bold tabular-nums leading-none">
                        {timeParts[0]}
                    </span>
                    <span className="text-[7px] sm:text-[8px] font-bold uppercase mt-0.5">
                        {timeParts[1]}
                    </span>
                </div>
            </div>
            {/* Fully responsive center align scale */}
            <div className="w-[24px] sm:w-[32px] lg:w-[40px] relative flex justify-center items-center shrink-0 h-full">
                <div
                    className={cn(
                        'absolute left-1/2 -translate-x-1/2 w-px bg-slate-200',
                        isStart ? 'bottom-0 top-1/2' : 'top-0 bottom-1/2',
                    )}
                />
                <div
                    className={cn(
                        'relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[3px] sm:border-4 flex items-center justify-center',
                        isStart
                            ? 'bg-emerald-500 border-emerald-100 text-white'
                            : 'bg-slate-800 border-slate-100 text-white',
                    )}
                >
                    {isStart ? (
                        <Sunrise size={12} className="sm:w-4 sm:h-4" />
                    ) : (
                        <Flag size={12} className="sm:w-4 sm:h-4" />
                    )}
                </div>
            </div>
            <div className="flex-1 flex items-center gap-2 sm:gap-3 opacity-50 pl-1.5 sm:pl-2 pr-2">
                <div className="h-px w-4 sm:w-8 bg-slate-200" />
                <span className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    {isStart ? 'Start' : 'End'}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
        </div>
    );
};

export const TimelineItem = ({
    variant,
    data,
    isDraggingAny,
    sessionStart,
    sessionEnd,
    currentStudentId,
    onRemove,
    onToggleLock,
    onDragStart,
    onDragEnd,
    onGapDrop,
    onTimeChange,
}: TimelineItemProps) => {
    const dragControls = useDragControls();
    const [isGapHovered, setIsGapHovered] = useState(false);

    const isActivity = variant === 'activity';
    const isLocked = data?.isLocked ?? false;
    const hasConflict = data?.hasConflict ?? false;
    const isSaved = !!data.documentId || !!data.id;
    const status = data.status || 'pending';
    const studentColor = getUserColor(data.student?.id || 0);
    const isForeign = Boolean(
        isActivity &&
        data.student &&
        currentStudentId &&
        data.student.id !== currentStudentId,
    );

    const startTimeStr = FormatService.formatTime(data.startAt, '12h-simple');
    const endTimeStr = FormatService.formatTime(data.endAt, '12h-simple');
    const timeParts = startTimeStr.split(' ');

    const timeOptions = useMemo(() => {
        if (isForeign || status === 'cancelled') return [];
        const baseDate = sessionStart
            ? new Date(sessionStart)
            : data.startAt
              ? new Date(data.startAt)
              : new Date();
        const sessionEndMs = sessionEnd
            ? new Date(sessionEnd).getTime()
            : Number.MAX_SAFE_INTEGER;
        const now = new Date();
        const isToday = baseDate.toDateString() === now.toDateString();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        return BASE_START_TIMES.map((timeObj) => {
            if (isToday && timeObj.totalMinutes < currentMins) return null;
            const [h, m] = timeObj.str.split(':').map(Number);
            const optStart = new Date(baseDate);
            optStart.setHours(h, m, 0, 0);
            const optEnd = new Date(optStart);
            optEnd.setMinutes(
                optEnd.getMinutes() + (data.durationMinutes || 30),
            );
            if (optEnd.getTime() > sessionEndMs) return null;
            return {
                value: timeObj.str,
                label: `${optStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${optEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
            };
        }).filter(Boolean) as { value: string; label: string }[];
    }, [data, sessionStart, sessionEnd, isForeign, status]);

    if (!isActivity) {
        return (
            <div className="relative flex flex-row items-stretch w-full z-10 my-1 sm:my-2">
                <div className="w-[48px] sm:w-[64px] lg:w-[80px] flex flex-col items-end justify-center shrink-0 pr-1.5 sm:pr-3 lg:pr-4 relative">
                    <span className="text-[10px] font-semibold text-slate-300 opacity-0">
                        {startTimeStr}
                    </span>
                </div>
                <div className="w-[24px] sm:w-[32px] lg:w-[40px] relative shrink-0 flex justify-center items-center">
                    <div className="absolute top-[-4px] bottom-[-4px] w-px border-l-2 border-slate-200 border-dashed" />
                    <div className="relative w-1.5 h-1.5 rounded-full bg-slate-200 z-10" />
                </div>
                <div className="flex-1 min-w-0 py-1 pr-2 sm:pr-4 lg:pr-6">
                    <motion.div
                        layout
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsGapHovered(true);
                        }}
                        onDragLeave={() => setIsGapHovered(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsGapHovered(false);
                            const raw = e.dataTransfer.getData('newActivity');
                            if (raw) {
                                try {
                                    const activity = JSON.parse(raw);
                                    onGapDrop?.(activity);
                                } catch (err) {
                                    console.error(
                                        'Failed to parse activity data',
                                        err,
                                    );
                                }
                            }
                        }}
                        className={cn(
                            'relative w-full rounded-xl border transition-all duration-200 flex items-center px-3 sm:px-4 overflow-hidden',
                            isGapHovered
                                ? 'h-[64px] border-emerald-400 bg-emerald-50/60 z-50'
                                : isDraggingAny
                                  ? 'h-[44px] border-indigo-200 bg-indigo-50/30'
                                  : 'h-[36px] sm:h-[40px] border-slate-100 bg-slate-50/50',
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {isGapHovered ? (
                                <motion.div
                                    key="hovered"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1.5 text-emerald-600 justify-center w-full"
                                >
                                    <Plus size={16} className="sm:w-5 sm:h-5" />
                                    <span className="text-[11px] sm:text-xs font-bold uppercase">
                                        Drop to Insert
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    className="flex items-center gap-2 text-slate-400 w-full pointer-events-none"
                                >
                                    <span className="text-[9px] sm:text-[10px] font-mono bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                        Free Time ({data.durationMinutes}m)
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        );
    }

    let lineClass = hasConflict
        ? 'bg-rose-500 w-[2px] z-10'
        : status === 'cancelled'
          ? 'border-l-2 border-slate-300 border-dashed w-px'
          : cn('w-[2px]', studentColor.line);
    let dotClass = hasConflict
        ? 'bg-rose-500 border-[3px] sm:border-4 border-rose-100 scale-110 shadow-sm'
        : status === 'completed'
          ? cn('border-none', studentColor.dot)
          : status === 'cancelled'
            ? 'border-slate-300 bg-slate-50'
            : cn(
                  'border-2 bg-white',
                  studentColor.dot.replace('bg-', 'border-'),
              );
    let connClass = hasConflict
        ? 'bg-rose-500 h-[2px]'
        : status === 'cancelled'
          ? 'bg-slate-300 h-px'
          : cn('h-px', studentColor.line);

    return (
        <Reorder.Item
            value={data}
            id={data.instanceId}
            dragListener={!isForeign && status !== 'cancelled' && !isLocked}
            dragControls={dragControls}
            onDragStart={!isForeign ? onDragStart : undefined}
            onDragEnd={!isForeign ? onDragEnd : undefined}
            transition={{ duration: 0.2 }}
            className={cn(
                'relative flex flex-row items-stretch w-full group isolate mb-2 sm:mb-3 z-20 hover:z-50 focus-within:z-50 touch-pan-y',
                (isForeign || status === 'cancelled') && 'opacity-100',
            )}
        >
            <div className="w-[48px] sm:w-[64px] lg:w-[80px] flex flex-col items-end justify-center shrink-0 pr-1.5 sm:pr-3 lg:pr-4 relative z-20">
                <div
                    className={cn(
                        'relative flex flex-col items-end',
                        !isForeign &&
                            status !== 'cancelled' &&
                            'group/time cursor-pointer',
                    )}
                >
                    <span
                        className={cn(
                            'text-[11px] sm:text-[12px] font-bold tabular-nums leading-none tracking-tight',
                            hasConflict ? 'text-rose-600' : 'text-slate-700',
                        )}
                    >
                        {timeParts[0]}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-[3px]">
                        {timeParts[1]}
                    </span>

                    {!isForeign && status !== 'cancelled' && (
                        <>
                            <select
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                value={
                                    data.startAt
                                        ? `${String(new Date(data.startAt).getHours()).padStart(2, '0')}:${String(new Date(data.startAt).getMinutes()).padStart(2, '0')}`
                                        : ''
                                }
                                onChange={(e) => onTimeChange?.(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="" disabled>
                                    Select
                                </option>
                                {timeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute -right-3 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/time:opacity-100 hidden sm:block">
                                <ChevronDown
                                    size={10}
                                    className="text-indigo-400"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="w-[24px] sm:w-[32px] lg:w-[40px] relative shrink-0 flex justify-center items-center">
                <div
                    className={cn(
                        'absolute top-[-8px] bottom-[-8px] transition-colors',
                        lineClass,
                    )}
                />
                <div
                    className={cn(
                        'absolute left-1/2 w-2.5 sm:w-3.5 z-10',
                        connClass,
                    )}
                />
                <div
                    className={cn(
                        'relative z-30 transition-all flex items-center justify-center w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full',
                        dotClass,
                    )}
                >
                    {hasConflict && (
                        <AlertCircle
                            size={6}
                            className="text-white sm:w-2 sm:h-2"
                            strokeWidth={4}
                        />
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0 py-0.5 sm:py-2 pr-2 sm:pr-4 lg:pr-6">
                <div
                    onPointerDown={(e) =>
                        !isLocked &&
                        !isForeign &&
                        status !== 'cancelled' &&
                        dragControls.start(e)
                    }
                    className="relative transition-all duration-200"
                >
                    <ItemCard
                        id={data.instanceId}
                        title={data.activity?.name}
                        subtitle={`${data.durationMinutes} min activity`}
                        startTime={startTimeStr}
                        endTime={endTimeStr}
                        imageSrc={FormatService.formatStrapiMedia(
                            data?.activity?.banner,
                            'thumbnail',
                        )}
                        isLocked={isLocked}
                        isSaved={isSaved}
                        isForeign={isForeign}
                        student={data.student}
                        status={status}
                        error={hasConflict}
                        conflictReason={data.conflictReason}
                        actionIcon={<Trash2 size={14} />}
                        onActionClick={onRemove!}
                        onToggleLock={onToggleLock}
                        onTimeChange={onTimeChange}
                        timeOptions={timeOptions}
                        mode={'delete'}
                        dragControls={dragControls}
                        showDetails={true}
                        colorProfile={studentColor}
                    />
                </div>
            </div>
        </Reorder.Item>
    );
};
