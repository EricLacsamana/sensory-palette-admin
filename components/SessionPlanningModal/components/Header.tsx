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
    ChevronsUpDown,
    Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/UserAvatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { UserResponse } from '@/types';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

interface HeaderProps {
    hasStudent?: boolean;
    user?: UserResponse;
    students?: UserResponse[];
    onSelectStudent?: (studentId: number) => void;
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
    hasStudent = true,
    user,
    students = [],
    onSelectStudent,
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
    const [openPopover, setOpenPopover] = useState(false);

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
            <div
                className={cn(
                    'flex flex-col w-full shrink-0 z-30 transition-all duration-200',
                    hasStudent
                        ? 'bg-white/95 backdrop-blur-sm border-b border-slate-200'
                        : 'bg-transparent',
                )}
            >
                <div className="flex items-center justify-between h-14 px-4 sm:px-6 gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {hasStudent && (
                            <Popover
                                open={openPopover}
                                onOpenChange={setOpenPopover}
                            >
                                <PopoverTrigger asChild>
                                    <button
                                        className="flex items-center gap-3 flex-1 min-w-0 hover:bg-slate-50 p-1 -ml-1 rounded-lg transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                        aria-label="Select student"
                                    >
                                        <div className="relative group shrink-0">
                                            {/* Refactored to use UserAvatar */}
                                            <UserAvatar
                                                src={FormatService.formatStrapiMedia(
                                                    user?.profilePicture,
                                                    'thumbnail',
                                                )}
                                                name={
                                                    user?.firstName ||
                                                    user?.fullName ||
                                                    'S'
                                                }
                                                size="sm"
                                                className="ring-1 ring-slate-200"
                                            />
                                            {/* Custom status dot overlay for unsaved changes */}
                                            <div className="absolute -bottom-0.5 -right-0.5 p-[1px] bg-white rounded-full z-10">
                                                <div
                                                    className={cn(
                                                        'h-2.5 w-2.5 rounded-full',
                                                        isDirty
                                                            ? 'bg-amber-500 animate-pulse'
                                                            : 'bg-emerald-500',
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col min-w-0 justify-center pr-1">
                                            <div className="flex items-center gap-1.5">
                                                <h2 className="text-sm font-bold text-slate-800 truncate">
                                                    {user?.fullName}
                                                </h2>
                                                <ChevronsUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
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
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[260px] p-0 shadow-xl rounded-xl"
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput
                                            placeholder="Search learners..."
                                            className="h-10 text-sm"
                                        />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>
                                                No learner found.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {students.map((student) => (
                                                    <CommandItem
                                                        key={student.id}
                                                        value={student.fullName}
                                                        onSelect={() => {
                                                            onSelectStudent?.(
                                                                student.id,
                                                            );
                                                            setOpenPopover(
                                                                false,
                                                            );
                                                        }}
                                                        className="flex items-center gap-3 cursor-pointer py-2 px-3"
                                                    >
                                                        {/* Refactored to use UserAvatar inside dropdown */}
                                                        <UserAvatar
                                                            src={FormatService.formatStrapiMedia(
                                                                student.profilePicture,
                                                                'thumbnail',
                                                            )}
                                                            name={
                                                                student.fullName
                                                            }
                                                            size="sm"
                                                            className="scale-[0.85] origin-left border border-slate-100 -my-1"
                                                        />
                                                        <span className="flex-1 truncate text-sm font-medium text-slate-700">
                                                            {student.fullName}
                                                        </span>
                                                        {student.id ===
                                                            user?.id && (
                                                            <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
                        {hasStudent && (
                            <>
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
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className={cn(
                                'h-8 w-8 rounded-full transition-colors',
                                hasStudent
                                    ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                    : 'text-slate-500 hover:text-red-600 hover:bg-white/60 bg-white/40 backdrop-blur-sm',
                            )}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {hasStudent && (
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
                )}
            </div>
        </TooltipProvider>
    );
};
