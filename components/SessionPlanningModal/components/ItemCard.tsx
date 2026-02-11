'use client';

import React from 'react';
import {
    GripVertical,
    Lock,
    Unlock,
    AlertOctagon,
    Clock,
    MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DragControls } from 'framer-motion';

interface ItemCardProps {
    id: string;
    title: string;
    subtitle: string;
    imageSrc?: string;
    isLocked?: boolean;
    error?: boolean;
    conflictReason?: string;
    actionIcon?: React.ReactNode;
    onActionClick?: () => void;
    onToggleLock?: () => void;
    mode?: 'delete' | 'view' | 'add';
    dragControls?: DragControls;
    startTime?: string;
    endTime?: string;
}

const ItemCard = ({
    title,
    subtitle,
    imageSrc,
    isLocked,
    error,
    conflictReason,
    actionIcon,
    onActionClick,
    onToggleLock,
    mode = 'view',
    dragControls,
    startTime,
    endTime,
}: ItemCardProps) => {
    const isDeleteMode = mode === 'delete';

    return (
        <div
            className={cn(
                'group relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 w-full select-none overflow-hidden',
                error
                    ? 'border-rose-300 bg-rose-50/50 shadow-[0_0_0_1px_rgba(253,164,175,0.5)] z-20'
                    : isLocked
                      ? 'border-slate-200 bg-slate-50/50 opacity-90'
                      : 'border-slate-200 bg-white shadow-sm hover:border-indigo-300 hover:shadow-md z-10',
            )}
        >
            {/* LOCKED PATTERN OVERLAY */}
            {isLocked && !error && (
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(-45deg, #000, #000 1px, transparent 1px, transparent 10px)',
                    }}
                />
            )}

            {/* DRAG HANDLE */}
            {mode !== 'view' && !isLocked && (
                <div
                    onPointerDown={(e) => dragControls?.start(e)}
                    className={cn(
                        'absolute left-1 top-1/2 -translate-y-1/2 p-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 transition-all hover:bg-slate-100 rounded-md z-20',
                        mode === 'delete'
                            ? 'opacity-0 group-hover:opacity-100'
                            : 'opacity-100', // Always show in sidebar
                    )}
                >
                    <GripVertical size={16} />
                </div>
            )}

            {/* THUMBNAIL */}
            <div
                className={cn(
                    'h-10 w-10 rounded-[6px] overflow-hidden border shrink-0 flex items-center justify-center bg-slate-100 relative z-10',
                    mode !== 'view' ? 'ml-6' : 'ml-0', // Spacing for drag handle
                    error ? 'border-rose-200' : 'border-slate-100',
                )}
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        className="h-full w-full object-cover"
                        alt=""
                    />
                ) : (
                    <div className="text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-current opacity-20" />
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                <div className="flex items-center gap-2">
                    <h4
                        className={cn(
                            'text-[13px] font-semibold truncate leading-tight',
                            error ? 'text-rose-700' : 'text-slate-800',
                            isLocked && 'text-slate-500',
                        )}
                    >
                        {title}
                    </h4>

                    {/* STATUS BADGES */}
                    {error && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            <AlertOctagon size={10} strokeWidth={3} />
                            Conflict
                        </div>
                    )}
                    {isLocked && !error && (
                        <Lock size={10} className="text-slate-400" />
                    )}
                </div>

                <div className="flex items-center gap-3 mt-1.5">
                    {/* Subtitle / Error Msg */}
                    <p
                        className={cn(
                            'text-[11px] truncate font-medium',
                            error
                                ? 'text-rose-500 font-bold'
                                : 'text-slate-500',
                        )}
                    >
                        {error ? conflictReason : subtitle}
                    </p>

                    {/* Time Badge */}
                    {(startTime || endTime) && (
                        <>
                            <div className="w-0.5 h-2.5 bg-slate-200 rounded-full" />
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                <Clock size={10} />
                                <span className="tabular-nums tracking-tight">
                                    {startTime} - {endTime}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* HOVER ACTIONS */}
            <div
                className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all duration-200 pl-4 bg-gradient-to-l from-white via-white to-transparent py-2 z-20',
                    mode === 'delete'
                        ? 'opacity-0 group-hover:opacity-100'
                        : 'opacity-100',
                )}
            >
                {isDeleteMode && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock?.();
                        }}
                        className={cn(
                            'h-8 w-8 rounded-lg border transition-colors',
                            isLocked
                                ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                                : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100',
                        )}
                        title={isLocked ? 'Unlock Activity' : 'Lock Activity'}
                    >
                        {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onActionClick?.();
                    }}
                    className={cn(
                        'h-8 w-8 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50',
                        // In 'add' mode, style specifically as an Add button
                        mode === 'add' &&
                            'text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700',
                    )}
                >
                    {actionIcon}
                </Button>
            </div>
        </div>
    );
};

export default ItemCard;
