'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, PlusCircle, Ban } from 'lucide-react';
import { Activity } from '@/types/actitivity';
import { FormatService } from '@/utils/helpers';

interface GapIndicatorProps {
    durationMinutes: number;
    startAt: string;
    endAt: string;
    draggedItem: Activity | null;
    onGapDrop: (activity: Activity) => void;
}

export const GapIndicator = ({
    durationMinutes,
    startAt,
    endAt,
    draggedItem,
    onGapDrop,
}: GapIndicatorProps) => {
    const [isOver, setIsOver] = useState(false);

    // Logic: Do we have enough time?
    const isTooLarge = draggedItem
        ? (draggedItem.durationMinutes || 0) > durationMinutes
        : false;

    // Is dragging active from sidebar?
    const isDraggingExternal = !!draggedItem;

    // Can we drop here?
    const canDrop = isDraggingExternal && !isTooLarge;

    const handleDragOver = (e: React.DragEvent) => {
        if (!isDraggingExternal) return;
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);

        if (!draggedItem || isTooLarge) return;
        onGapDrop(draggedItem);
    };

    return (
        <div
            className={cn(
                'flex w-full items-center gap-5 transition-all duration-300',
                isOver && canDrop ? 'py-4' : 'py-3', // Expand slightly on hover
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Time Column Placeholder */}
            <div className="w-14 shrink-0 flex justify-center">
                <div
                    className={cn(
                        'w-0.5 bg-slate-200 transition-all',
                        isOver && canDrop ? 'h-full' : 'h-full',
                    )}
                />
            </div>

            {/* Gap Container */}
            <div className="flex-1 relative">
                {/* 1. Standard Gap Visual (Hidden when hovering with valid item) */}
                <div
                    className={cn(
                        'w-full border-2 border-dashed rounded-xl flex items-center justify-between px-4 transition-all select-none relative overflow-hidden',
                        isOver && isTooLarge
                            ? 'border-rose-300 bg-rose-50 h-14'
                            : isOver && canDrop
                              ? 'opacity-0 h-0 border-0 p-0' // Hide standard visual when showing Drop Zone
                              : 'border-emerald-200 bg-emerald-50/40 text-emerald-700 h-14 hover:bg-emerald-50 hover:border-emerald-300',
                        durationMinutes < 10 && !isOver
                            ? 'h-8 min-h-[32px]'
                            : '',
                    )}
                >
                    {!isOver && (
                        <div
                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                                backgroundImage:
                                    'radial-gradient(currentColor 1px, transparent 1px)',
                                backgroundSize: '8px 8px',
                            }}
                        />
                    )}

                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider z-10">
                        <Clock
                            size={14}
                            className={
                                isOver && isTooLarge
                                    ? 'text-rose-500'
                                    : 'text-emerald-500'
                            }
                        />
                        <span
                            className={
                                isOver && isTooLarge ? 'text-rose-600' : ''
                            }
                        >
                            {isOver && isTooLarge
                                ? 'Insufficient Time'
                                : 'Free Time'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 z-10">
                        <span className="text-sm font-bold tabular-nums">
                            {durationMinutes}{' '}
                            <span className="text-[10px] font-normal">min</span>
                        </span>
                        <span className="text-[10px] font-bold bg-white/60 px-2 py-1 rounded-md border border-emerald-100 hidden sm:block">
                            {FormatService.formatTime(startAt, '12h-simple')}
                            {' - '}
                            {FormatService.formatTime(endAt, '12h-simple')}
                        </span>
                    </div>
                </div>

                {/* 2. DROP ZONE (Ghost Card) - Shown when hovering valid item */}
                {isOver && canDrop && (
                    <div className="absolute inset-0 w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-full h-[72px] rounded-[22px] border-2 border-dashed border-indigo-400 bg-indigo-50/50 flex items-center justify-center gap-3 text-indigo-600 shadow-inner">
                            <PlusCircle className="animate-pulse" />
                            <span className="font-semibold text-sm">
                                Insert {draggedItem?.name} (
                                {draggedItem?.durationMinutes}m)
                            </span>
                        </div>
                    </div>
                )}

                {/* 3. Error Overlay */}
                {isOver && isTooLarge && (
                    <div className="absolute inset-0 flex items-center justify-center bg-rose-100/50 backdrop-blur-[1px] rounded-xl pointer-events-none">
                        <div className="flex items-center gap-2 text-rose-600 font-bold bg-white/90 px-4 py-2 rounded-full shadow-sm">
                            <Ban size={16} />
                            <span>Needs {draggedItem?.durationMinutes}m</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
