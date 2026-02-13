'use client';

import React from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronRight,
    Undo2,
    Redo2,
    Users,
    ChevronDown,
} from 'lucide-react';
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
    onChange: (type: 'start' | 'end', val: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isDirty: boolean;
    isShowOtherUsers: boolean;
    setIsShowOtherUsers: (val: boolean) => void;
}

const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

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
    const dStart = new Date(startAt);
    const dEnd = new Date(endAt);

    const _dateValue = dStart.toISOString().split('T')[0];
    const _toTimeStr = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const _displayDate = dStart.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const handleUpdate = (type: 'date' | 'start' | 'end', newVal: string) => {
        if (type === 'date') {
            const [y, m, d] = newVal.split('-').map(Number);
            const nStart = new Date(startAt);
            const nEnd = new Date(endAt);
            [nStart, nEnd].forEach((date) => date.setFullYear(y, m - 1, d));
            onChange('start', nStart.toISOString());
            onChange('end', nEnd.toISOString());
        } else {
            const [h, min] = newVal.split(':').map(Number);
            const target = new Date(type === 'start' ? startAt : endAt);
            target.setHours(h, min, 0, 0);
            onChange(type, target.toISOString());
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <DialogHeader className="h-[80px] px-6 border-b border-slate-100 flex flex-row items-center justify-between shrink-0 bg-white/95 backdrop-blur-sm z-30">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl h-10 w-10"
                    >
                        {isSidebarOpen ? (
                            <PanelLeftClose size={20} />
                        ) : (
                            <PanelLeftOpen size={20} />
                        )}
                    </Button>

                    <div className="flex items-center gap-3.5 pl-2 border-l border-slate-100">
                        <div className="relative group cursor-default">
                            <Avatar className="h-10 w-10 rounded-xl ring-2 ring-white shadow-sm group-hover:shadow-md transition-all">
                                <AvatarImage
                                    src={FormatService.formatStrapiMedia(
                                        user?.profilePicture,
                                        'thumbnail',
                                    )}
                                    alt={user?.firstName || 'Student'}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold uppercase rounded-xl text-sm">
                                    {user?.firstName?.charAt(0) || 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
                                <div
                                    className={cn(
                                        'h-2.5 w-2.5 rounded-full transition-colors duration-300',
                                        isDirty
                                            ? 'bg-amber-500 animate-pulse'
                                            : 'bg-emerald-500',
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-[15px] font-bold text-slate-900 leading-none tracking-tight">
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    Session Plan
                                </span>
                                {isDirty && (
                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-px rounded-full border border-amber-100">
                                        Unsaved
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="relative group/date flex items-center gap-2.5 px-4 h-11 bg-white border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md rounded-full transition-all cursor-pointer">
                        <CalendarIcon
                            size={16}
                            className="text-slate-400 group-hover/date:text-indigo-600 transition-colors"
                        />
                        <span className="text-sm font-semibold text-slate-700 group-hover/date:text-slate-900 tabular-nums">
                            {_displayDate}
                        </span>
                        <input
                            type="date"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                            value={_dateValue}
                            onChange={(e) =>
                                handleUpdate('date', e.target.value)
                            }
                            onClick={(e) =>
                                (e.target as HTMLInputElement).showPicker?.()
                            }
                        />
                    </div>

                    <div className="flex items-center h-11 bg-slate-50 border border-slate-200 rounded-full shadow-inner px-1.5">
                        <div className="relative group/start px-3 h-8 flex items-center gap-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all cursor-pointer">
                            <Clock
                                size={14}
                                className="text-slate-400 group-hover/start:text-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-600 group-hover/start:text-slate-900 tabular-nums">
                                {_toTimeStr(dStart)}
                            </span>
                            <ChevronDown
                                size={10}
                                className="text-slate-300 group-hover/start:text-slate-500"
                            />
                            <select
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                value={_toTimeStr(dStart)}
                                onChange={(e) =>
                                    handleUpdate('start', e.target.value)
                                }
                            >
                                {TIME_OPTIONS.map((t) => (
                                    <option key={`start-${t}`} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="px-1 text-slate-300">
                            <ChevronRight size={12} />
                        </div>

                        <div className="relative group/end px-3 h-8 flex items-center gap-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all cursor-pointer">
                            <Clock
                                size={14}
                                className="text-slate-400 group-hover/end:text-rose-500"
                            />
                            <span className="text-xs font-bold text-slate-600 group-hover/end:text-slate-900 tabular-nums">
                                {_toTimeStr(dEnd)}
                            </span>
                            <ChevronDown
                                size={10}
                                className="text-slate-300 group-hover/end:text-slate-500"
                            />
                            <select
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                value={_toTimeStr(dEnd)}
                                onChange={(e) =>
                                    handleUpdate('end', e.target.value)
                                }
                            >
                                {TIME_OPTIONS.map((t) => (
                                    <option key={`end-${t}`} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setIsShowOtherUsers(!isShowOtherUsers)
                                    }
                                    className={cn(
                                        'h-9 w-9 rounded-lg transition-all',
                                        isShowOtherUsers
                                            ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50',
                                    )}
                                >
                                    <Users size={18} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                className="bg-slate-900 text-white border-none shadow-xl text-xs font-bold uppercase tracking-wide"
                            >
                                {isShowOtherUsers
                                    ? 'Hide  Others'
                                    : 'Show Others'}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <Separator
                        orientation="vertical"
                        className="h-8 bg-slate-100"
                    />

                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={undo}
                                    disabled={!canUndo}
                                    className="h-10 w-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 transition-all"
                                >
                                    <Undo2 size={20} strokeWidth={2} />
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
                                    className="h-10 w-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 transition-all"
                                >
                                    <Redo2 size={20} strokeWidth={2} />
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
