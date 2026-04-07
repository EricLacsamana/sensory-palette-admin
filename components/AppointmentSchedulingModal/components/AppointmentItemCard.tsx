'use client';

import React from 'react';
import {
    GripVertical,
    Lock,
    Unlock,
    Clock,
    Trash2,
    Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DragControls } from 'framer-motion';

import { AppointmentEntry } from '@/types/appointment';
import { SpecialtyBadge } from './SpecialityBadge';

interface AppointmentItemCardProps {
    data: AppointmentEntry;
    isForeign?: boolean;
    dragControls?: DragControls;
    onRemove?: () => void;
    onToggleLock?: () => void;
    startTime?: string;
    endTime?: string;
}

export const AppointmentItemCard = ({
    data,
    isForeign,
    dragControls,
    onRemove,
    onToggleLock,
    startTime,
    endTime,
}: AppointmentItemCardProps) => {
    const error = data.hasConflict;
    const isLocked = data.isLocked;
    const isCancelled = data.appointmentStatus === 'cancelled';

    return (
        <div
            className={cn(
                'group relative flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl border transition-all duration-200 w-full select-none min-h-[52px] overflow-hidden',
                error
                    ? 'border-rose-300 bg-rose-50/50 z-20'
                    : isLocked
                      ? 'border-amber-200 bg-amber-50/30'
                      : isForeign
                        ? 'bg-slate-50 opacity-80 border-slate-200'
                        : 'shadow-sm hover:shadow-md z-10 bg-white hover:border-indigo-300 border-slate-200',
                isCancelled && 'opacity-60 grayscale',
            )}
        >
            {/* Drag Handle */}
            {!isLocked && !isCancelled && !isForeign && (
                <div
                    onPointerDown={(e) => dragControls?.start(e)}
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-indigo-500 hover:bg-slate-100 rounded-md transition-all z-30 shrink-0"
                >
                    <GripVertical size={14} />
                </div>
            )}

            {/* Icon */}
            <div
                className={cn(
                    'h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center relative z-10',
                    error
                        ? 'border-rose-200 bg-rose-50 text-rose-500'
                        : 'border-indigo-100 bg-indigo-50 text-indigo-500',
                )}
            >
                <Stethoscope size={18} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                    <h4
                        className={cn(
                            'text-[11px] sm:text-sm font-bold truncate leading-none',
                            error ? 'text-rose-700' : 'text-slate-800',
                            isCancelled && 'line-through text-slate-500',
                        )}
                    >
                        {data.service?.name || 'Therapy Session'}
                    </h4>
                    {data.therapist?.specialty && (
                        <SpecialtyBadge specialty={data.therapist.specialty} />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <Clock size={10} />{' '}
                        <span>
                            {startTime}-{endTime}
                        </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                        {data.durationMinutes}m duration
                    </span>
                    <span
                        className={cn(
                            'text-[10px] font-bold',
                            isForeign ? 'text-slate-400' : 'text-indigo-600',
                        )}
                    >
                        Student: {data.student?.firstName || 'External'}
                    </span>
                </div>
                {error && (
                    <span className="text-[10px] text-rose-500 font-medium truncate">
                        {data.conflictReason}
                    </span>
                )}
            </div>

            {/* Actions */}
            {!isForeign && (
                <div className="flex flex-col gap-1 shrink-0 pl-2 border-l border-slate-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock?.();
                        }}
                        disabled={isCancelled}
                        className={cn(
                            'h-6 w-6 rounded border transition-all',
                            isLocked
                                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100',
                        )}
                    >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLocked}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) onRemove?.();
                        }}
                        className={cn(
                            'h-6 w-6 rounded border transition-all',
                            isLocked
                                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                : 'opacity-0 group-hover:opacity-100 bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50',
                        )}
                    >
                        <Trash2 size={12} />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AppointmentItemCard;
