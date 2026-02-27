'use client';

import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronRight,
    ChevronLeft,
    Undo2,
    Redo2,
    Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserResponse } from '@/types';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
    user?: UserResponse;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (val: boolean) => void;
    startAt: string;
    endAt: string;
    onChange: (
        type: 'start' | 'end' | 'date',
        val1: string,
        val2?: string,
    ) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isDirty: boolean;
    isShowOtherUsers: boolean;
    setIsShowOtherUsers: (val: boolean) => void;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 20 : -20,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 20 : -20,
        opacity: 0,
    }),
};

export const Header = ({
    user,
    isSidebarOpen,
    setIsSidebarOpen,
    startAt,
    endAt,
    onChange,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    isShowOtherUsers,
    setIsShowOtherUsers,
}: HeaderProps) => {
    const [direction, setDirection] = useState(0);

    const dStart = new Date(startAt);
    const dEnd = new Date(endAt);

    const now = new Date();

    const isToday =
        dStart.getFullYear() === now.getFullYear() &&
        dStart.getMonth() === now.getMonth() &&
        dStart.getDate() === now.getDate();

    const todayStr = now.toLocaleDateString('en-CA');
    const _dateValue = dStart.toISOString().split('T')[0];

    const _toTimeStr = (d: Date) =>
        d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

    const _displayDate = dStart.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const handleUpdate = (type: 'date', newVal: string) => {
        if (type === 'date') {
            const [y, m, d] = newVal.split('-').map(Number);
            const nStart = new Date(startAt);
            const nEnd = new Date(endAt);
            [nStart, nEnd].forEach((date) => date.setFullYear(y, m - 1, d));

            onChange('date', nStart.toISOString(), nEnd.toISOString());
        }
    };

    const handleShiftDate = (offset: number) => {
        const currentStart = new Date(startAt);
        const currentEnd = new Date(endAt);

        currentStart.setDate(currentStart.getDate() + offset);
        currentEnd.setDate(currentEnd.getDate() + offset);

        const checkDate = new Date(currentStart);
        checkDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkDate.getTime() < today.getTime()) return;

        setDirection(offset > 0 ? 1 : -1);
        onChange('date', currentStart.toISOString(), currentEnd.toISOString());
    };

    return (
        <TooltipProvider delayDuration={0}>
            <DialogHeader className="h-14 pl-4 pr-12 border-b border-slate-200 flex flex-row items-center justify-between shrink-0 bg-white/95 backdrop-blur-sm z-30 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-md h-8 w-8 shrink-0"
                    >
                        {isSidebarOpen ? (
                            <PanelLeftClose size={16} />
                        ) : (
                            <PanelLeftOpen size={16} />
                        )}
                    </Button>

                    <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 min-w-0">
                        <div className="relative group cursor-default shrink-0">
                            <Avatar className="h-8 w-8 rounded-lg ring-1 ring-slate-100 shadow-sm transition-all">
                                <AvatarImage
                                    src={FormatService.formatStrapiMedia(
                                        user?.profilePicture,
                                        'thumbnail',
                                    )}
                                    alt={user?.firstName || 'Student'}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold uppercase rounded-lg text-xs">
                                    {user?.firstName?.charAt(0) || 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 p-[1.5px] bg-white rounded-full">
                                <div
                                    className={cn(
                                        'h-2 w-2 rounded-full transition-colors duration-300',
                                        isDirty
                                            ? 'bg-amber-500 animate-pulse'
                                            : 'bg-emerald-500',
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0 justify-center">
                            <h2 className="text-sm font-semibold text-slate-800 leading-tight tracking-tight truncate">
                                {user?.fullName}
                            </h2>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Schedule
                                </span>
                                {isDirty && (
                                    <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-[1px] rounded-sm border border-amber-100 shrink-0 uppercase tracking-wider">
                                        Unsaved
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 shrink-0">
                    <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 shadow-sm rounded-md transition-all h-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isToday}
                            className="h-8 w-8 rounded-l-md rounded-r-none text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
                            onClick={() => handleShiftDate(-1)}
                        >
                            <ChevronLeft size={16} />
                        </Button>

                        <div className="relative group/date flex items-center justify-center min-w-[120px] h-full cursor-pointer overflow-hidden border-x border-slate-100">
                            <CalendarIcon
                                size={14}
                                className="text-slate-400 group-hover/date:text-indigo-600 transition-colors absolute left-2 z-10"
                            />
                            <AnimatePresence
                                mode="popLayout"
                                custom={direction}
                                initial={false}
                            >
                                <motion.span
                                    key={_dateValue}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: {
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 30,
                                        },
                                        opacity: { duration: 0.2 },
                                    }}
                                    className="text-xs font-semibold text-slate-700 group-hover/date:text-slate-900 tabular-nums pl-5"
                                >
                                    {_displayDate}
                                </motion.span>
                            </AnimatePresence>
                            <input
                                type="date"
                                min={todayStr}
                                className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full"
                                value={_dateValue}
                                onChange={(e) => {
                                    const newVal = e.target.value;
                                    if (!newVal) return;
                                    const newDate = new Date(newVal);
                                    const oldDate = new Date(_dateValue);
                                    setDirection(newDate > oldDate ? 1 : -1);
                                    handleUpdate('date', newVal);
                                }}
                                onClick={(e) =>
                                    (
                                        e.target as HTMLInputElement
                                    ).showPicker?.()
                                }
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-md rounded-l-none text-slate-500 hover:text-indigo-600 hover:bg-slate-50 shrink-0"
                            onClick={() => handleShiftDate(1)}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>

                    <div className="flex items-center h-8 bg-slate-50 border border-slate-200 rounded-md shadow-inner px-2.5 gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Clock
                                size={12}
                                className={cn(
                                    isToday
                                        ? 'text-amber-500'
                                        : 'text-emerald-500',
                                )}
                            />
                            <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
                                {_toTimeStr(dStart)}
                            </span>
                            {/* NEW: Visual 'Now' indicator for the current time constraint */}
                            {isToday && (
                                <span className="text-[9px] text-amber-600 bg-amber-100 px-1 py-0.5 rounded border border-amber-200 uppercase tracking-wider font-bold shadow-sm">
                                    Now
                                </span>
                            )}
                        </div>

                        <div className="text-slate-300 shrink-0">
                            <ChevronRight size={10} />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <Clock size={12} className="text-rose-500" />
                            <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
                                {_toTimeStr(dEnd)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                    <div className="flex items-center bg-slate-50 p-0.5 rounded-md border border-slate-200 shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setIsShowOtherUsers(!isShowOtherUsers)
                                    }
                                    className={cn(
                                        'h-7 w-7 rounded-[4px] transition-all',
                                        isShowOtherUsers
                                            ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50',
                                    )}
                                >
                                    <Users size={14} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                className="bg-slate-900 text-white border-none shadow-xl text-xs font-bold uppercase tracking-wide"
                            >
                                {isShowOtherUsers
                                    ? 'Hide Others'
                                    : 'Show Others'}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <Separator
                        orientation="vertical"
                        className="h-5 bg-slate-200 shrink-0 mx-1"
                    />

                    <div className="flex items-center gap-0.5 shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={undo}
                                    disabled={!canUndo}
                                    className="h-8 w-8 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 transition-all"
                                >
                                    <Undo2 size={16} strokeWidth={2} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                className="bg-slate-900 text-white border-none shadow-xl text-xs font-bold uppercase tracking-wide"
                            >
                                Undo (Ctrl+Z)
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={redo}
                                    disabled={!canRedo}
                                    className="h-8 w-8 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 transition-all"
                                >
                                    <Redo2 size={16} strokeWidth={2} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                className="bg-slate-900 text-white border-none shadow-xl text-xs font-bold uppercase tracking-wide"
                            >
                                Redo (Shift+Z)
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </DialogHeader>
        </TooltipProvider>
    );
};
