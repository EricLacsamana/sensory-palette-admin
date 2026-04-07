'use client';

import React from 'react';
import {
    Clock,
    Undo2,
    Redo2,
    X,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppointmentResponse } from '@/types/appointment';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import {
    TooltipProvider,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
    hasAppointment?: boolean;
    activeAppointment?: AppointmentResponse | null;
    startAt: string;
    endAt: string;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isDirty: boolean;
    onClose?: () => void;
    onBack?: () => void;
}

const getInitials = (first?: string, last?: string, user?: string) => {
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (user) return user.substring(0, 2).toUpperCase();
    return 'U';
};

export const Header = ({
    hasAppointment = true,
    activeAppointment,
    startAt,
    endAt,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    onClose,
    onBack,
}: HeaderProps) => {
    const dStart = new Date(startAt || new Date());
    const dEnd = new Date(endAt || new Date());

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

    const student = activeAppointment?.student;
    const service = activeAppointment?.service;

    return (
        <TooltipProvider delayDuration={0}>
            <header className="flex items-center justify-between w-full h-[72px] shrink-0 z-30 transition-all duration-200 border-b border-slate-200 bg-white px-4 sm:px-6 gap-4 shadow-sm">
                {hasAppointment ? (
                    /* =========================================
                        ACTIVE APPOINTMENT MODE
                    ========================================= */
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 overflow-x-auto no-scrollbar">
                        {/* 1. Back Navigation */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={onBack}
                                    className="h-10 w-10 rounded-full border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm shrink-0 transition-all"
                                >
                                    <ChevronLeft
                                        size={20}
                                        className="-ml-0.5"
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                className="text-xs font-bold"
                            >
                                Back to Selection
                            </TooltipContent>
                        </Tooltip>

                        <Separator
                            orientation="vertical"
                            className="h-8 bg-slate-200 shrink-0 hidden sm:block"
                        />

                        {/* 2. Learner & Service Stack */}
                        <div className="flex items-center gap-3 shrink-0 min-w-0 pr-2">
                            <div className="relative shrink-0">
                                <Avatar className="h-10 w-10 shrink-0 border border-slate-200 shadow-sm">
                                    <AvatarImage
                                        src={FormatService.formatStrapiMedia(
                                            student?.profilePicture,
                                            'thumbnail',
                                        )}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                                        {getInitials(
                                            student?.firstName,
                                            student?.lastName,
                                            student?.username,
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                {isDirty && (
                                    <div className="absolute -bottom-0.5 -right-0.5 p-[2px] bg-white rounded-full z-10">
                                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse border border-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-center min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900 truncate">
                                        {student?.fullName ||
                                            student?.firstName +
                                                ' ' +
                                                student?.lastName ||
                                            'Unknown Learner'}
                                    </span>
                                    {isDirty && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded shadow-sm uppercase tracking-wider shrink-0 leading-none">
                                            Unsaved
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-slate-500 truncate mt-0.5">
                                    {student?.diagnosis ||
                                        'No Diagnosis Provided'}
                                </span>
                            </div>
                        </div>

                        <Separator
                            orientation="vertical"
                            className="h-8 bg-slate-100 shrink-0"
                        />

                        {/* 3. Date & Time Pill */}
                        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm shrink-0 h-10">
                            <div className="px-3 flex items-center gap-2 border-r border-slate-200 h-full">
                                <CalendarDays
                                    size={14}
                                    className="text-indigo-400"
                                />
                                <span className="font-semibold text-[13px] text-slate-800 whitespace-nowrap">
                                    {_displayDate}
                                </span>
                            </div>
                            <div className="px-3 flex items-center gap-2 h-full">
                                <Clock size={14} className="text-emerald-500" />
                                <span className="font-semibold text-[13px] text-slate-700 whitespace-nowrap">
                                    {_toTimeStr(dStart)}
                                </span>
                                <ChevronRight
                                    size={14}
                                    className="text-slate-300"
                                />
                                <Clock size={14} className="text-rose-500" />
                                <span className="font-semibold text-[13px] text-slate-700 whitespace-nowrap">
                                    {_toTimeStr(dEnd)}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* =========================================
                        SELECT APPOINTMENT MODE (Minimal Header)
                    ========================================= */
                    <div className="flex items-center gap-3 flex-1 pl-1">
                        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100/50">
                            <CalendarDays
                                size={20}
                                className="text-indigo-600"
                            />
                        </div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">
                            Session Planner
                        </h1>
                    </div>
                )}

                {/* =========================================
                    RIGHT SIDE TOOLS (Shared)
                ========================================= */}
                <div className="flex items-center gap-1 shrink-0 ml-auto bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-inner">
                    {hasAppointment && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={undo}
                                        disabled={!canUndo}
                                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all hidden sm:flex shrink-0"
                                    >
                                        <Undo2 size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    className="text-xs font-bold"
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
                                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all hidden sm:flex shrink-0"
                                    >
                                        <Redo2 size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    className="text-xs font-bold"
                                >
                                    Redo (Ctrl+Shift+Z)
                                </TooltipContent>
                            </Tooltip>
                            <Separator
                                orientation="vertical"
                                className="h-5 bg-slate-200 mx-1 hidden sm:block shrink-0"
                            />
                        </>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm shrink-0"
                            >
                                <X size={20} />
                            </Button>
                        </TooltipTrigger>
                        {/* <TooltipContent
                            side="bottom"
                            className="text-xs font-bold text-rose-600"
                        >
                            Close Planner
                        </TooltipContent> */}
                    </Tooltip>
                </div>
            </header>
        </TooltipProvider>
    );
};
