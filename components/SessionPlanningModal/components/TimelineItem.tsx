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

interface BlockedPeriod {
    start: number;
    end: number;
}

interface TimelineItemProps {
    variant: 'activity' | 'gap';
    data: ActivitySessionEntry & { status?: ActivitySessionStatus };
    isDraggingAny?: boolean;
    blockedPeriods?: BlockedPeriod[];
    sessionStart?: string;
    sessionEnd?: string;
    currentStudentId?: number | null;
    onRemove?: () => void;
    onToggleLock?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onGapDrop?: (activity: Activity) => void;
    onTimeChange?: (time: string) => void;
    showDetails?: boolean;
}

const BASE_START_TIMES = Array.from({ length: 49 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

export const TimelineEndpoint = ({
    type,
    time,
}: {
    type: 'start' | 'end';
    time: string;
}) => {
    const isStart = type === 'start';
    return (
        <div className="flex flex-row items-center w-full select-none relative h-16 group z-0">
            <div className="w-[88px] flex justify-end pr-5 shrink-0">
                <div
                    className={cn(
                        'text-[11px] font-bold tabular-nums uppercase tracking-wider px-2.5 py-1 rounded-md border shadow-sm transition-colors',
                        isStart
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                            : 'text-slate-600 bg-slate-50 border-slate-200',
                    )}
                >
                    {time}
                </div>
            </div>
            <div className="w-[40px] relative flex justify-center shrink-0 h-full">
                <div
                    className={cn(
                        'absolute left-1/2 -translate-x-1/2 w-px bg-slate-200',
                        isStart ? 'bottom-0 top-1/2' : 'top-0 bottom-1/2',
                    )}
                />
                <div
                    className={cn(
                        'relative z-10 w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110',
                        isStart
                            ? 'bg-emerald-500 border-emerald-100 text-white'
                            : 'bg-slate-800 border-slate-100 text-white',
                    )}
                >
                    {isStart ? (
                        <Sunrise size={14} strokeWidth={2.5} />
                    ) : (
                        <Flag size={14} strokeWidth={2.5} />
                    )}
                </div>
            </div>
            <div className="flex-1 flex items-center gap-3 opacity-50 pl-2">
                <div className="h-px w-8 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    {isStart ? 'Session Start' : 'Session End'}
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
    blockedPeriods = [],
    sessionStart,
    sessionEnd,
    currentStudentId,
    onRemove,
    onToggleLock,
    onDragStart,
    onDragEnd,
    onGapDrop,
    onTimeChange,
    showDetails = false,
}: TimelineItemProps) => {
    const dragControls = useDragControls();
    const [isGapHovered, setIsGapHovered] = useState(false);
    const isActivity = variant === 'activity';
    const isLocked = data?.isLocked ?? false;
    const hasConflict = data?.hasConflict ?? false;
    const isSaved = !!data.documentId || !!data.id;
    const status = data.status || 'pending';

    const studentColor = getUserColor(data.student?.id || 0);

    const isForeign =
        isActivity &&
        data.student &&
        currentStudentId &&
        data.student.id !== currentStudentId;

    const startTimeStr = FormatService.formatTime(data.startAt, '12h-simple');
    const endTimeStr = FormatService.formatTime(data.endAt, '12h-simple');

    const get24hTime = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const timeOptions = useMemo(() => {
        if (isForeign || status === 'cancelled') return [];
        const baseDate = sessionStart
            ? new Date(sessionStart)
            : data.startAt
              ? new Date(data.startAt)
              : new Date();
        const duration = data.durationMinutes || 30;
        const sessionEndMs = sessionEnd
            ? new Date(sessionEnd).getTime()
            : Number.MAX_SAFE_INTEGER;

        return BASE_START_TIMES.map((startStr) => {
            const [h, m] = startStr.split(':').map(Number);
            const optStart = new Date(baseDate);
            optStart.setHours(h, m, 0, 0);
            const optEnd = new Date(optStart);
            optEnd.setMinutes(optEnd.getMinutes() + duration);

            if (optEnd.getTime() > sessionEndMs) return null;

            const format = (d: Date) =>
                d.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                });
            return {
                value: startStr,
                label: `${format(optStart)} - ${format(optEnd)}`,
            };
        }).filter(Boolean) as { value: string; label: string }[];
    }, [
        data.startAt,
        data.durationMinutes,
        sessionStart,
        sessionEnd,
        isForeign,
        status,
    ]);

    if (!isActivity) {
        return (
            <div className="relative flex flex-row items-stretch w-full z-10 my-1">
                {/* Gap rendering logic... */}
                <div className="w-[88px] flex flex-col items-end shrink-0 pt-[18px] pr-5 relative">
                    <span className="text-[11px] font-semibold tabular-nums text-slate-300 opacity-0 transition-opacity">
                        {startTimeStr}
                    </span>
                </div>
                <div className="w-[40px] relative shrink-0 flex justify-center">
                    <div className="absolute top-[-4px] bottom-[-4px] w-px border-l-2 border-slate-200 border-dashed" />
                    <div className="absolute top-[22px] w-1.5 h-1.5 rounded-full bg-slate-200 z-10" />
                </div>
                <div className="flex-1 min-w-0 py-1 pr-2">
                    <motion.div
                        layout
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'copy';
                            setIsGapHovered(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            setIsGapHovered(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsGapHovered(false);
                            const raw = e.dataTransfer.getData('newActivity');
                            if (raw) {
                                try {
                                    onGapDrop?.(JSON.parse(raw));
                                } catch (err) {
                                    console.error(
                                        'Failed to parse activity drop',
                                        err,
                                    );
                                }
                            }
                        }}
                        className={cn(
                            'relative w-full rounded-xl border transition-all duration-200 flex items-center px-4 overflow-hidden',
                            isGapHovered
                                ? 'h-[72px] border-emerald-400 bg-emerald-50/60 ring-4 ring-emerald-50/50 border-solid z-50'
                                : isDraggingAny
                                  ? 'h-[40px] border-indigo-200 bg-indigo-50/30 border-dashed'
                                  : 'h-[32px] border-slate-100 bg-slate-50/50 hover:bg-slate-50 border-dashed',
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {isGapHovered ? (
                                <motion.div
                                    key="hovered"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 text-emerald-600 w-full justify-center pointer-events-none"
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                    <span className="text-sm font-bold uppercase tracking-wide">
                                        Drop to Insert ({data.durationMinutes}m)
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    className="flex items-center gap-3 text-slate-400 w-full pointer-events-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-medium bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-500">
                                            {FormatService.formatDuration(
                                                data.durationMinutes ?? 0,
                                            )}
                                        </span>
                                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-50">
                                            Free Time
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        );
    }

    // --- Visual Logic ---
    let timelineLineClass = '';
    let timelineDotClass = '';
    let connectorClass = '';
    let dotContent = null;

    if (hasConflict) {
        timelineLineClass = 'bg-rose-500 w-[2px] z-10';
        timelineDotClass =
            'bg-rose-500 border-4 border-rose-100 scale-110 shadow-sm';
        connectorClass = 'bg-rose-500 h-[2px]';
        dotContent = (
            <AlertCircle size={10} className="text-white" strokeWidth={4} />
        );
    } else if (isForeign) {
        timelineLineClass = cn('w-[2px]', studentColor.line);
        timelineDotClass = cn(
            'border-2 bg-slate-100',
            studentColor.dot.replace('bg-', 'border-'),
        );
        connectorClass = cn('h-px', studentColor.line);
    } else {
        timelineLineClass = cn('w-[2px]', studentColor.line);
        timelineDotClass = cn(
            'border-2 bg-white',
            studentColor.dot.replace('bg-', 'border-'),
        );
        connectorClass = cn('h-px', studentColor.line);

        if (status === 'completed') {
            timelineDotClass = cn('border-none', studentColor.dot);
        } else if (status === 'in_progress') {
            timelineDotClass = cn(
                timelineDotClass,
                'animate-pulse ring-4 ring-indigo-50',
            );
        } else if (status === 'cancelled') {
            timelineLineClass =
                'border-l-2 border-slate-300 border-dashed bg-transparent w-px';
            timelineDotClass = 'border-slate-300 bg-slate-50';
            connectorClass = 'bg-slate-300 h-px';
        }
    }

    return (
        <Reorder.Item
            value={data}
            id={data.instanceId} // This is crucial for Reorder
            dragListener={!isForeign && status !== 'cancelled' && !isLocked}
            dragControls={dragControls}
            onDragStart={!isForeign ? onDragStart : undefined}
            onDragEnd={!isForeign ? onDragEnd : undefined}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={cn(
                'relative flex flex-row items-stretch w-full group isolate mb-1 z-20 hover:z-50 focus-within:z-50',
                (isForeign || status === 'cancelled') && 'opacity-100',
            )}
        >
            <div className="w-[88px] flex flex-col items-end shrink-0 pt-[18px] pr-5 relative z-20">
                <div
                    className={cn(
                        'relative',
                        !isForeign &&
                            status !== 'cancelled' &&
                            'group/time cursor-pointer',
                    )}
                >
                    <div
                        className={cn(
                            'flex items-center gap-1 transition-all',
                            hasConflict
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-600',
                        )}
                    >
                        <span className="text-[11px] font-semibold tabular-nums tracking-tight">
                            {startTimeStr}
                        </span>
                    </div>

                    {!isForeign && status !== 'cancelled' && (
                        <>
                            <select
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                value={get24hTime(data.startAt)}
                                onChange={(e) => onTimeChange?.(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="" disabled>
                                    Select
                                </option>
                                {timeOptions.length > 0 ? (
                                    timeOptions.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No slots</option>
                                )}
                            </select>
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/time:opacity-100 transition-opacity pointer-events-none">
                                <ChevronDown
                                    size={8}
                                    className="text-indigo-400"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="w-[40px] relative shrink-0 flex justify-center">
                <div
                    className={cn(
                        'absolute top-[-4px] bottom-[-4px] transition-colors duration-300',
                        timelineLineClass,
                    )}
                />
                <div
                    className={cn(
                        'absolute top-[26px] left-1/2 w-3.5',
                        connectorClass,
                    )}
                />
                <div
                    className={cn(
                        'absolute top-[22px] w-3 h-3 rounded-full z-30 transition-all shadow-sm flex items-center justify-center',
                        timelineDotClass,
                    )}
                >
                    {dotContent}
                </div>
            </div>

            <div className="flex-1 min-w-0 py-2 pr-2">
                <div
                    onPointerDown={(e) =>
                        !isLocked &&
                        !isForeign &&
                        status !== 'cancelled' &&
                        dragControls.start(e)
                    }
                    className={cn(
                        'relative transition-all duration-200',
                        !isLocked &&
                            !isForeign &&
                            status !== 'cancelled' &&
                            'cursor-grab active:cursor-grabbing hover:-translate-y-0.5',
                    )}
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
                        showDetails={showDetails}
                        colorProfile={studentColor}
                    />
                </div>
            </div>
        </Reorder.Item>
    );
};
