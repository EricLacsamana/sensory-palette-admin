'use client';

import React, { useState } from 'react';
import { Trash2, Plus, ArrowDown, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { Activity } from '@/types/actitivity';
import ItemCard from './ItemCard';

// --- Types ---
interface TimelineItemProps {
    variant: 'activity' | 'gap';
    data: ActivitySessionEntry;
    isDraggingAny?: boolean;
    onRemove?: () => void;
    onToggleLock?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onGapDrop?: (activity: Activity) => void;
}

// --- Components ---

export const TimelineEndpoint = ({
    type,
    time,
}: {
    type: 'start' | 'end';
    time: string;
}) => {
    return (
        <div className="flex flex-row items-center w-full select-none relative h-12 group">
            {/* Time Column */}
            <div className="w-[60px] text-right pr-4 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-wider">
                    {time}
                </span>
            </div>
            {/* Spine & Dot */}
            <div className="w-5 relative flex justify-center shrink-0 h-full">
                {/* Continuous Line */}
                <div
                    className={cn(
                        'w-px bg-slate-200 absolute left-1/2 -translate-x-1/2',
                        type === 'start'
                            ? 'bottom-0 top-1/2'
                            : 'top-0 bottom-1/2',
                    )}
                />
                <div className="w-3 h-3 rounded-full border-[3px] border-slate-50 bg-slate-800 z-10 absolute top-1/2 -translate-y-1/2 shadow-sm ring-1 ring-slate-200" />
            </div>
            {/* Label */}
            <div className="flex-1 pl-4">
                <div className="h-px w-full bg-slate-100" />
            </div>
        </div>
    );
};

export const TimelineItem = ({
    variant,
    data,
    isDraggingAny,
    onRemove,
    onToggleLock,
    onDragStart,
    onDragEnd,
    onGapDrop,
}: TimelineItemProps) => {
    const dragControls = useDragControls();
    const [isGapHovered, setIsGapHovered] = useState(false);

    const isActivity = variant === 'activity';
    const isLocked = data?.isLocked ?? false;
    const hasConflict = data?.hasConflict ?? false;

    // Time Formatting
    const startTimeStr = FormatService.formatTime(data.startAt, '12h-simple');
    const endTimeStr = FormatService.formatTime(data.endAt, '12h-simple');

    return (
        <Reorder.Item
            value={data}
            id={data.instanceId}
            dragListener={false}
            dragControls={dragControls}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(
                'relative flex flex-row items-stretch w-full group isolate mb-1',
                isActivity ? 'z-20' : 'z-10',
            )}
        >
            {/* 1. Time Column */}
            <div className="w-[60px] flex flex-col items-end shrink-0 pt-[18px] pr-4 relative z-20">
                <span
                    className={cn(
                        'text-[11px] font-semibold tabular-nums tracking-tight transition-colors',
                        hasConflict ? 'text-rose-600' : 'text-slate-600',
                        !isActivity && 'opacity-0', // Hide time for gaps unless actively interacting
                    )}
                >
                    {startTimeStr}
                </span>
            </div>

            {/* 2. Timeline Spine (The Backbone) */}
            <div className="w-5 relative shrink-0 flex justify-center -ml-[1px]">
                {/* Continuous Vertical Line */}
                <div
                    className={cn(
                        'absolute top-[-10px] bottom-[-10px] w-px transition-colors duration-300',
                        hasConflict ? 'bg-rose-300 w-[2px]' : 'bg-slate-200',
                        // If it's a gap, keep it subtle
                        !isActivity &&
                            'bg-slate-200 border-l border-slate-200 border-dashed w-0',
                    )}
                />

                {/* Horizontal Connector (Only for Activity) */}
                {isActivity && (
                    <div
                        className={cn(
                            'absolute top-[26px] left-1/2 w-3.5 h-px',
                            hasConflict ? 'bg-rose-300' : 'bg-slate-300',
                        )}
                    />
                )}

                {/* Node Dot */}
                {isActivity ? (
                    <div
                        className={cn(
                            'absolute top-[22px] w-2.5 h-2.5 rounded-full border-[2px] z-30 transition-all bg-white shadow-sm',
                            hasConflict
                                ? 'border-rose-500 bg-rose-50 scale-110'
                                : isLocked
                                  ? 'border-slate-400 bg-slate-100'
                                  : 'border-indigo-500 bg-indigo-50',
                        )}
                    />
                ) : (
                    // Gap Dot (Small ghost dot)
                    <div className="absolute top-[22px] w-1.5 h-1.5 rounded-full bg-slate-200 z-10" />
                )}
            </div>

            {/* 3. Main Content (Card or Dropzone) */}
            <div className="flex-1 pl-3 min-w-0 py-2">
                {isActivity ? (
                    <div
                        onPointerDown={(e) =>
                            !isLocked && dragControls.start(e)
                        }
                        className={cn(
                            'relative transition-all duration-200',
                            !isLocked &&
                                'cursor-grab active:cursor-grabbing hover:-translate-y-0.5',
                            isLocked && 'opacity-90',
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
                            error={hasConflict}
                            conflictReason={data.conflictReason}
                            actionIcon={<Trash2 size={14} />}
                            onActionClick={onRemove!}
                            onToggleLock={onToggleLock}
                            mode={'delete'}
                            dragControls={dragControls}
                        />
                    </div>
                ) : (
                    // --- GAP COMPONENT ---
                    <div className="relative group/gap flex items-center">
                        {/* Drag Handle for Gap (Visible on Hover) */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="absolute -left-8 p-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400 hover:bg-slate-100 rounded opacity-0 group-hover/gap:opacity-100 transition-all z-30"
                            title="Drag to move empty space"
                        >
                            <GripVertical size={16} />
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsGapHovered(true);
                            }}
                            onDragLeave={() => setIsGapHovered(false)}
                            onDrop={(e) => {
                                e.preventDefault(); // Stop browser default
                                setIsGapHovered(false);
                                const raw =
                                    e.dataTransfer.getData('newActivity');
                                if (raw) onGapDrop?.(JSON.parse(raw));
                            }}
                            className={cn(
                                'relative w-full rounded-lg border border-dashed transition-all duration-300 flex items-center px-4 overflow-hidden',
                                // Mode 1: Drop Target (Hovering with external file)
                                isGapHovered
                                    ? 'h-[72px] border-emerald-400 bg-emerald-50/40 ring-4 ring-emerald-50'
                                    : // Mode 2: Helper State (Dragging another item)
                                      isDraggingAny
                                      ? 'h-10 border-indigo-200 bg-indigo-50/20'
                                      : // Mode 3: Default (Compact representation of time)
                                        'h-8 border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-white',
                            )}
                        >
                            {isGapHovered ? (
                                <div className="flex items-center gap-3 text-emerald-600 w-full justify-center animate-in fade-in zoom-in-95">
                                    <Plus size={16} />
                                    <span className="text-xs font-semibold uppercase tracking-wide">
                                        Insert here ({data.durationMinutes}m)
                                    </span>
                                </div>
                            ) : isDraggingAny ? (
                                <div className="flex items-center gap-3 text-indigo-400 w-full justify-center opacity-70">
                                    <ArrowDown size={14} />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                                        {data.durationMinutes}m Gap
                                    </span>
                                </div>
                            ) : (
                                // Default State: Shows time duration, now draggable
                                <div className="flex items-center gap-3 text-slate-400 w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                            {data.durationMinutes}m
                                        </span>
                                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-50">
                                            Free Time
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Reorder.Item>
    );
};
