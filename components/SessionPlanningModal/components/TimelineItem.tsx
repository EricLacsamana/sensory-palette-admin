'use client';

import React, { useState } from 'react';
import { Trash2, Play, Flag } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import ItemCard from './ItemCard';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { getStrapiMedia } from '@/utils/helpers';
import { Activity } from '@/types/actitivity';

// --- Types ---

export interface TimelineGapEntry {
    instanceId: string;
    type: 'gap';
    durationMinutes: number;
    startTime: string;
    endTime: string;
}

type TimelineItemProps = {
    draggedItem: Activity | null;
    isReordering: boolean;
    variant: 'activity' | 'gap';
    data: (ActivitySessionEntry & { type: 'activity' }) | TimelineGapEntry;
    onRemove?: () => void;
    onToggleLock?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onGapDrop?: (activity: Activity) => void;
    // UPDATED: Ref now expects an LI element
    domRef?: (node: HTMLLIElement | null) => void;
};

// --- Sub-Component: Start/End Markers ---

interface TimelineEndpointProps {
    type: 'start' | 'end';
    time: string;
}

export const TimelineEndpoint = ({ type, time }: TimelineEndpointProps) => {
    const isStart = type === 'start';

    return (
        <div className="flex flex-row items-stretch w-full select-none isolate">
            {/* COLUMN 1: Time */}
            <div className="w-16 flex flex-col items-end shrink-0">
                <span className="text-[11px] font-bold text-slate-400 tabular-nums uppercase tracking-tighter py-1.5">
                    {time}
                </span>
            </div>

            {/* COLUMN 2: Track */}
            <div className="w-6 relative shrink-0">
                <div
                    className={cn(
                        'absolute left-1/2 -translate-x-1/2 w-0.5 bg-slate-100',
                        isStart ? 'top-3 bottom-0' : 'top-0 h-3',
                    )}
                />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div
                        className={cn(
                            'flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white',
                            isStart
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-slate-300 text-slate-400',
                        )}
                    >
                        {isStart ? (
                            <Play size={8} fill="currentColor" />
                        ) : (
                            <Flag size={8} fill="currentColor" />
                        )}
                    </div>
                </div>
            </div>

            {/* COLUMN 3: Label */}
            <div className="flex-1 pl-3 py-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {isStart ? 'Session Start' : 'Session End'}
                </span>
            </div>
        </div>
    );
};

// --- Main Component: TimelineItem ---

export const TimelineItem = ({
    variant,
    data,
    draggedItem,
    isReordering,
    onRemove,
    onToggleLock,
    onDragStart,
    onDragEnd,
    onGapDrop,
    domRef,
}: TimelineItemProps) => {
    const dragControls = useDragControls();
    const [isGapHovered, setIsGapHovered] = useState(false);

    const isActivity = variant === 'activity';
    const activityData = isActivity ? (data as ActivitySessionEntry) : null;
    const gapData = !isActivity ? (data as TimelineGapEntry) : null;

    const isLocked = activityData?.isLocked ?? false;
    const hasConflict = activityData?.hasConflict ?? false;

    // ALIGNMENT CONSTANTS
    const CONTAINER_PADDING = 'pb-4';
    const DOT_TOP_POS = 'top-6';
    const TIME_PADDING = 'pt-6';

    const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isActivity || isLocked) return;
        // Prevent drag when clicking buttons/icons inside the card
        if ((e.target as HTMLElement).closest('button')) return;
        dragControls.start(e);
        onDragStart?.();
    };

    return (
        <Reorder.Item
            as="li" // UPDATED: Renders as 'li' to match HTMLLIElement ref type
            value={data}
            id={data.instanceId}
            layout="position"
            dragListener={false}
            dragControls={dragControls}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
                mass: 1,
            }}
            className={cn(
                'relative flex flex-row items-stretch touch-none select-none isolate w-full',
                CONTAINER_PADDING,
                isReordering && isActivity ? 'z-[999]' : 'z-0',
            )}
            onDragEnd={onDragEnd}
            whileDrag={{ scale: 1.02, zIndex: 999, cursor: 'grabbing' }}
            ref={domRef}
        >
            {/* COLUMN 1: Start Time */}
            <div
                className={cn(
                    'w-16 flex flex-col items-end shrink-0',
                    TIME_PADDING,
                )}
            >
                <span
                    className={cn(
                        'text-[11px] font-bold tabular-nums tracking-tighter uppercase transition-colors leading-none -translate-y-1/2',
                        isLocked ? 'text-indigo-600' : 'text-slate-900',
                        hasConflict && 'text-rose-600',
                        !isActivity && 'text-slate-400 opacity-50',
                    )}
                >
                    {data.startTime}
                </span>
            </div>

            {/* COLUMN 2: Visual Timeline Track */}
            <div className="w-6 relative shrink-0">
                <div
                    className={cn(
                        'absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 z-0',
                        isActivity
                            ? 'bg-slate-200'
                            : 'border-l-2 border-dashed border-slate-200 bg-transparent w-0',
                    )}
                />

                <div
                    className={cn(
                        'absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 box-border',
                        DOT_TOP_POS,
                        isActivity &&
                            cn(
                                'h-3.5 w-3.5 rounded-full border-[3px] bg-white',
                                hasConflict
                                    ? 'border-rose-500 shadow-rose-200 shadow-sm'
                                    : isLocked
                                      ? 'border-indigo-600 bg-indigo-50'
                                      : 'border-slate-300 group-hover:border-indigo-400',
                            ),
                        !isActivity && 'h-1.5 w-1.5 rounded-full bg-slate-300',
                        isActivity ? 'translate-y-1' : '-translate-y-1',
                    )}
                />
            </div>

            {/* COLUMN 3: Content */}
            <div className="flex-1 min-w-0 pl-3 pr-1 pt-1">
                {isActivity && activityData && (
                    <div
                        onPointerDown={handleDragStart}
                        className={cn(
                            'transition-transform active:scale-[0.99]',
                            !isLocked && 'cursor-grab active:cursor-grabbing',
                        )}
                    >
                        <ItemCard
                            id={activityData.instanceId}
                            mode="delete"
                            title={activityData.activity?.name ?? 'Unknown'}
                            subtitle={
                                isLocked
                                    ? `Fixed • Ends ${activityData.endTime}`
                                    : `${activityData.activity?.durationMinutes}m`
                            }
                            imageSrc={getStrapiMedia(
                                activityData.activity?.banner,
                                'thumbnail',
                            )}
                            isLocked={isLocked}
                            actionIcon={<Trash2 size={16} />}
                            dragControls={dragControls}
                            onActionClick={onRemove!}
                            onToggleLock={onToggleLock}
                        />
                    </div>
                )}

                {!isActivity && gapData && (
                    <div
                        onDragEnter={(e) => {
                            if (draggedItem) {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsGapHovered(true);
                            }
                        }}
                        onDragOver={(e) => {
                            if (draggedItem) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsGapHovered(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsGapHovered(false);
                            if (draggedItem && onGapDrop) {
                                onGapDrop(draggedItem);
                            }
                        }}
                        className={cn(
                            'relative w-full rounded-xl transition-all duration-200 ease-out border-2 border-dashed flex items-center pl-3 origin-top',
                            !isGapHovered &&
                                'h-10 border-emerald-200 bg-emerald-50/30',
                            isGapHovered &&
                                'h-24 border-indigo-400 bg-indigo-50/50 shadow-[0_0_0_4px_rgba(99,102,241,0.1)] justify-center pl-0 scale-[1.02]',
                        )}
                    >
                        <div
                            className={cn(
                                'text-xs font-semibold uppercase tracking-wider text-indigo-600 transition-opacity duration-200 flex flex-col items-center gap-1',
                                isGapHovered
                                    ? 'opacity-100'
                                    : 'opacity-0 hidden',
                            )}
                        >
                            <span>Insert Here</span>
                            <span className="text-[10px] opacity-70">
                                ({gapData.durationMinutes}m available)
                            </span>
                        </div>

                        {!isGapHovered && (
                            <span className="text-[10px] font-medium text-slate-400 italic">
                                {gapData.durationMinutes}m free time
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Reorder.Item>
    );
};
