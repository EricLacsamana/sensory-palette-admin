'use client';

import React from 'react';
import {
    GripVertical,
    Lock,
    Unlock,
    AlertOctagon,
    Clock,
    Database,
    ChevronDown,
    User,
    Trash2,
    CheckCircle2,
    XCircle,
    PlayCircle,
    PauseCircle,
    AlertCircle,
    CalendarClock,
    CircleDashed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DragControls } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormatService } from '@/utils/helpers';
import { UserResponse } from '@/types';
import { getUserColor } from '@/utils/colors';

export type ActivitySessionStatus =
    | 'pending'
    | 'queued'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'interrupted'
    | 'abandoned'
    | 'reschedule';

interface ItemCardProps {
    id: string;
    title: string;
    subtitle: string;
    imageSrc?: string;
    isLocked?: boolean;
    isSaved?: boolean;
    isForeign?: boolean;
    student?: UserResponse;
    error?: boolean;
    conflictReason?: string;
    status?: ActivitySessionStatus;
    actionIcon?: React.ReactNode;
    onActionClick?: () => void;
    onToggleLock?: () => void;
    onTimeChange?: (time: string) => void;
    timeOptions?: { value: string; label: string }[];
    mode?: 'delete' | 'view' | 'add';
    dragControls?: DragControls;
    startTime?: string;
    endTime?: string;
    showDetails?: boolean;
    colorProfile?: ReturnType<typeof getUserColor>;
}

const STATUS_CONFIG: Record<
    ActivitySessionStatus,
    { icon: React.ElementType; label: string }
> = {
    pending: { icon: CircleDashed, label: 'Pending' },
    in_progress: { icon: PlayCircle, label: 'In Progress' },
    completed: { icon: CheckCircle2, label: 'Completed' },
    cancelled: { icon: XCircle, label: 'Cancelled' },
    interrupted: { icon: PauseCircle, label: 'Interrupted' },
    abandoned: { icon: AlertCircle, label: 'Abandoned' },
    reschedule: { icon: CalendarClock, label: 'Reschedule' },
};

const ItemCard = ({
    title,
    subtitle,
    imageSrc,
    isLocked,
    isSaved,
    isForeign,
    student,
    error,
    conflictReason,
    status = 'pending',
    actionIcon,
    onActionClick,
    onToggleLock,
    onTimeChange,
    timeOptions = [],
    mode = 'view',
    dragControls,
    startTime,
    endTime,
    showDetails = false,
    colorProfile,
}: ItemCardProps) => {
    const colors = colorProfile || getUserColor(student?.id || 0);
    const s = STATUS_CONFIG[status];
    const StatusIcon = s.icon;
    const isPending = status === 'pending';
    const isCancelled = status === 'cancelled';
    const formattedDuration = subtitle.replace(/(\d+)\s*min.*$/i, '$1m');
    const displaySubtitle = showDetails ? subtitle : formattedDuration;

    const renderStudentBadge = (isForeignBadge: boolean = false) => (
        <div
            className={cn(
                'flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-sm shrink-0 transition-all duration-300',
                isForeignBadge
                    ? 'bg-white border-slate-200'
                    : cn(colors.bg, colors.border),
            )}
        >
            <Avatar className="h-3.5 w-3.5">
                <AvatarImage
                    src={FormatService.formatStrapiMedia(
                        student?.profilePicture,
                        'thumbnail',
                    )}
                />
                <AvatarFallback
                    className={cn(
                        'text-[7px] font-bold',
                        isForeignBadge
                            ? 'bg-slate-100 text-slate-600'
                            : cn('bg-white', colors.text),
                    )}
                >
                    {student?.firstName?.charAt(0) || 'S'}
                </AvatarFallback>
            </Avatar>
            <span
                className={cn(
                    'text-[9px] font-bold truncate transition-all duration-300',
                    isForeignBadge ? 'text-slate-600' : colors.text,
                    showDetails ? 'max-w-[120px]' : 'max-w-[60px]',
                )}
            >
                {student?.firstName} {showDetails && student?.lastName}
            </span>
        </div>
    );

    if (isForeign) {
        return (
            <div
                className={cn(
                    'relative flex items-center gap-3 p-2.5 rounded-xl border w-full select-none group transition-all min-h-[64px]',
                    'bg-slate-50/50 border-slate-200',
                    isCancelled
                        ? 'opacity-50 grayscale'
                        : 'opacity-80 hover:opacity-100',
                )}
            >
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-xl"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(-45deg, #000, #000 1px, transparent 1px, transparent 10px)',
                    }}
                />

                <div
                    className={cn(
                        'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
                        colors.line,
                    )}
                />

                <div className="ml-3 h-10 w-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 grayscale opacity-70">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            className="h-full w-full object-cover"
                            alt=""
                        />
                    ) : (
                        <div className="bg-slate-200 w-full h-full flex items-center justify-center">
                            <User size={14} className="text-slate-400" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <h4 className="text-sm font-semibold text-slate-500 truncate">
                        {title}
                    </h4>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-white/50 px-1.5 py-0.5 rounded border border-slate-200/50">
                            <Clock size={10} />
                            <span className="tabular-nums">
                                {startTime} - {endTime}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-white/50 border-slate-200 text-slate-400">
                            <StatusIcon size={10} />
                            {s.label}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                    {renderStudentBadge(true)}
                    <span className="text-[8px] text-slate-400 mt-1 italic mr-1">
                        Other student
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 w-full select-none min-h-[64px]',
                error
                    ? 'border-rose-300 bg-rose-50/50 shadow-[0_0_0_1px_rgba(253,164,175,0.5)] z-20'
                    : isLocked
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'shadow-sm hover:shadow-md z-10 bg-white hover:border-indigo-300 border-slate-200',
                isCancelled && 'opacity-60 grayscale-[0.5]',
            )}
        >
            {isLocked && !error && (
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-xl"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(-45deg, #d97706, #d97706 1px, transparent 1px, transparent 10px)',
                    }}
                />
            )}

            {!error && !isLocked && (
                <div
                    className={cn(
                        'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-50',
                        colors.bg.replace('bg-', 'bg-'),
                    )}
                />
            )}

            {mode !== 'view' && !isLocked && !isCancelled && (
                <div
                    onPointerDown={(e) => dragControls?.start(e)}
                    className={cn(
                        'absolute left-1 top-1/2 -translate-y-1/2 p-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 transition-all hover:bg-slate-100 rounded-md z-30',
                        mode === 'delete'
                            ? 'opacity-0 group-hover:opacity-100'
                            : 'opacity-100',
                    )}
                >
                    <GripVertical size={14} />
                </div>
            )}

            <div
                className={cn(
                    'h-10 w-10 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center bg-slate-100 relative z-10',
                    mode !== 'view' ? 'ml-5' : 'ml-0',
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

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                    <h4
                        className={cn(
                            'text-sm font-bold truncate leading-none',
                            error ? 'text-rose-700' : 'text-slate-800',
                            isLocked && 'text-slate-600',
                            isCancelled && 'line-through text-slate-500',
                        )}
                    >
                        {title}
                    </h4>

                    {!isPending && !error && (
                        <div
                            className={cn(
                                'flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500',
                            )}
                        >
                            <StatusIcon size={10} strokeWidth={2.5} />
                            {s.label}
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-1 text-[8px] font-black text-rose-600 bg-rose-100 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
                            <AlertOctagon size={8} strokeWidth={3} /> Conflict
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {(startTime || endTime) && (
                        <div className="relative group/time-badge">
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer',
                                    isLocked
                                        ? 'bg-amber-100/50 border-amber-200 text-amber-700'
                                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200',
                                )}
                            >
                                <Clock size={10} />
                                <span className="tabular-nums tracking-tight">
                                    {startTime} - {endTime}
                                </span>
                                <ChevronDown
                                    size={8}
                                    className="opacity-0 group-hover/time-badge:opacity-100 transition-opacity ml-0.5"
                                />
                            </div>
                            <select
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onTimeChange?.(e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                disabled={isCancelled}
                            >
                                <option value="" disabled>
                                    Switch
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
                        </div>
                    )}

                    <div
                        className={cn(
                            'flex items-center text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 transition-all duration-300',
                            showDetails
                                ? 'font-normal text-slate-500'
                                : 'font-semibold',
                        )}
                    >
                        {displaySubtitle}
                    </div>

                    {isSaved && !error && (
                        <div className="flex items-center gap-1 text-[9px] font-medium text-emerald-600/80 ml-1 transition-all">
                            <Database size={9} />
                            {showDetails && (
                                <span className="hidden sm:inline">Saved</span>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <span className="text-[10px] text-rose-500 font-medium leading-none">
                        {conflictReason}
                    </span>
                )}
            </div>

            <div
                className={cn(
                    'flex flex-col items-end gap-1.5 shrink-0 pl-2 border-l border-slate-50 transition-all duration-300',
                    showDetails ? 'min-w-[140px]' : 'min-w-[70px]',
                )}
            >
                {student?.firstName && renderStudentBadge(false)}

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock?.();
                        }}
                        disabled={isCancelled}
                        className={cn(
                            'h-6 w-6 rounded-md border transition-all duration-200 cursor-pointer',
                            isLocked
                                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 shadow-sm'
                                : 'bg-white border-slate-100 text-slate-300 hover:text-indigo-500 hover:border-indigo-200 hover:shadow-sm opacity-0 group-hover:opacity-100',
                        )}
                        title={isLocked ? 'Unlock Activity' : 'Lock Activity'}
                    >
                        {isLocked ? (
                            <Lock size={10} strokeWidth={2.5} />
                        ) : (
                            <Unlock size={10} />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLocked}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) onActionClick?.();
                        }}
                        className={cn(
                            'h-6 w-6 rounded-md border transition-all duration-200 cursor-pointer',
                            isLocked
                                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                : 'opacity-0 group-hover:opacity-100 bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:shadow-sm',
                        )}
                    >
                        {actionIcon || <Trash2 size={10} />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
export default ItemCard;
