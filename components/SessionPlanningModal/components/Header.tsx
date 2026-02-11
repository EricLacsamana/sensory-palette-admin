'use client';

import React from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronRight,
    MoreVertical,
    History,
} from 'lucide-react';
import { DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserResponse } from '@/types';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface HeaderProps {
    student?: UserResponse;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (val: boolean) => void;
    startAt: string;
    endAt: string;
    onChange: (type: 'start' | 'end', val: string) => void;
}

// Helper for generating time options (08:00 - 18:00)
const TIME_OPTIONS = Array.from({ length: 41 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

export const Header = ({
    student,
    isSidebarOpen,
    setIsSidebarOpen,
    startAt,
    endAt,
    onChange,
}: HeaderProps) => {
    const dStart = new Date(startAt);
    const dEnd = new Date(endAt);

    // Formatter helpers
    const _dateValue = `${dStart.getFullYear()}-${String(dStart.getMonth() + 1).padStart(2, '0')}-${String(dStart.getDate()).padStart(2, '0')}`;
    const _toTimeStr = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const _displayDate = dStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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
        <DialogHeader className="h-20 px-6 border-b border-slate-100 flex flex-row items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-30">
            {/* --- LEFT: STUDENT DOSSIER --- */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                >
                    {isSidebarOpen ? (
                        <PanelLeftClose size={20} />
                    ) : (
                        <PanelLeftOpen size={20} />
                    )}
                </Button>

                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-lg border border-slate-100 shadow-sm">
                        <AvatarImage
                            src={FormatService.formatStrapiMedia(
                                student?.profilePicture,
                                'thumbnail',
                            )}
                        />
                        <AvatarFallback className="bg-indigo-600 text-white font-bold rounded-lg">
                            {student?.firstName?.charAt(0) || 'S'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-900 leading-none">
                                {student?.firstName} {student?.lastName}
                            </h2>
                            <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 h-4 border-slate-200 text-slate-500 font-mono"
                            >
                                ID-{student?.id}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                Drafting Session
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CENTER/RIGHT: CONTROLS CAPSULE --- */}
            <div className="flex items-center gap-4">
                {/* 1. Date Picker */}
                <div className="relative group">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:border-indigo-300 group-hover:shadow-sm transition-all cursor-pointer">
                        <CalendarIcon
                            size={14}
                            className="text-slate-400 group-hover:text-indigo-500"
                        />
                        <span className="text-xs font-semibold text-slate-700 tabular-nums">
                            {_displayDate}
                        </span>
                    </div>
                    {/* Invisible Native Input Overlay */}
                    <input
                        type="date"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={_dateValue}
                        onChange={(e) => handleUpdate('date', e.target.value)}
                    />
                </div>

                <Separator orientation="vertical" className="h-8" />

                {/* 2. Time Range Selector */}
                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                    {/* Start Time */}
                    <div className="relative group px-3 py-1 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                        <div className="flex flex-col items-start">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                Start
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Clock
                                    size={12}
                                    className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                                />
                                <span className="text-xs font-bold text-slate-900 tabular-nums">
                                    {_toTimeStr(dStart)}
                                </span>
                            </div>
                        </div>
                        <select
                            className="absolute inset-0 opacity-0 cursor-pointer"
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

                    <div className="px-2 text-slate-300">
                        <ChevronRight size={14} />
                    </div>

                    {/* End Time */}
                    <div className="relative group px-3 py-1 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                End
                            </span>
                            <span className="text-xs font-bold text-slate-900 tabular-nums">
                                {_toTimeStr(dEnd)}
                            </span>
                        </div>
                        <select
                            className="absolute inset-0 opacity-0 cursor-pointer"
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

                <div className="pl-2 border-l border-slate-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 rounded-lg"
                    >
                        <MoreVertical size={16} />
                    </Button>
                </div>
            </div>
        </DialogHeader>
    );
};
