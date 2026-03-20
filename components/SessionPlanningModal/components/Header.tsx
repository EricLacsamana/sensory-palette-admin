'use client';

import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    ChevronRight,
    ChevronLeft,
    Undo2,
    Redo2,
    Users,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    onClose?: () => void;
}

const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 30 : -30,
        opacity: 0,
    }),
};

export const Header = ({
    user,
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
    onClose,
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
            <div className="flex flex-col w-full shrink-0 bg-white/95 backdrop-blur-sm z-30 border-b border-slate-200">
                <div className="flex items-center justify-between h-14 px-4 sm:px-6 gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative group cursor-default shrink-0">
                            <Avatar className="h-8 w-8 rounded-lg ring-1 ring-slate-100 shadow-sm">
                                <AvatarImage
                                    src={FormatService.formatStrapiMedia(
                                        user?.profilePicture,
                                        'thumbnail',
                                    )}
                                />
                                <AvatarFallback className="bg-indigo-500 text-white font-semibold text-xs">
                                    {user?.firstName?.charAt(0) || 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 p-[1px] bg-white rounded-full">
                                <div
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        isDirty
                                            ? 'bg-amber-500 animate-pulse'
                                            : 'bg-emerald-500',
                                    )}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0 justify-center">
                            <h2 className="text-sm font-bold text-slate-800 truncate">
                                {user?.fullName}
                            </h2>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    Schedule
                                </span>
                                {isDirty && (
                                    <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-[1px] rounded-sm border border-amber-100 uppercase">
                                        Unsaved
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setIsShowOtherUsers(!isShowOtherUsers)
                            }
                            className={cn(
                                'h-8 w-8 rounded-md',
                                isShowOtherUsers
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-slate-500',
                            )}
                        >
                            <Users size={16} />
                        </Button>
                        <Separator
                            orientation="vertical"
                            className="h-5 bg-slate-200 shrink-0 mx-0.5 hidden sm:block"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={undo}
                            disabled={!canUndo}
                            className="h-8 w-8 text-slate-500 hidden sm:flex"
                        >
                            <Undo2 size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={redo}
                            disabled={!canRedo}
                            className="h-8 w-8 text-slate-500 hidden sm:flex"
                        >
                            <Redo2 size={16} />
                        </Button>
                        <Separator
                            orientation="vertical"
                            className="h-5 bg-slate-200 shrink-0 mx-0.5"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-center h-12 px-3 sm:px-4 bg-slate-50/50 border-t border-slate-100 gap-3">
                    <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-md h-8 flex-1 max-w-[200px] sm:max-w-[240px]">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isToday}
                            onClick={() => handleShiftDate(-1)}
                            className="h-8 w-8 rounded-l-md text-slate-500 shrink-0"
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        <div className="relative flex items-center justify-center flex-1 h-full cursor-pointer overflow-hidden border-x border-slate-100">
                            <CalendarIcon
                                size={12}
                                className="absolute left-2 text-slate-400 hidden sm:block"
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
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                    className="text-[11px] sm:text-xs font-semibold text-slate-700 sm:pl-4"
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
                                    if (!e.target.value) return;
                                    setDirection(
                                        new Date(e.target.value) >
                                            new Date(_dateValue)
                                            ? 1
                                            : -1,
                                    );
                                    handleUpdate('date', e.target.value);
                                }}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShiftDate(1)}
                            className="h-8 w-8 rounded-r-md text-slate-500 shrink-0"
                        >
                            <ChevronRight size={14} />
                        </Button>
                    </div>

                    <div className="flex items-center h-8 bg-white border border-slate-200 rounded-md shadow-sm px-2.5 gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Clock
                                size={12}
                                className={
                                    isToday
                                        ? 'text-amber-500'
                                        : 'text-emerald-500'
                                }
                            />
                            <span className="text-[11px] font-semibold text-slate-700">
                                {_toTimeStr(dStart)}
                            </span>
                        </div>
                        <ChevronRight
                            size={10}
                            className="text-slate-300 shrink-0"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Clock size={12} className="text-rose-500" />
                            <span className="text-[11px] font-semibold text-slate-700">
                                {_toTimeStr(dEnd)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};
