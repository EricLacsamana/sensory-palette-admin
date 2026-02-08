'use client';

import React from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
    student: any;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (val: boolean) => void;
    startDate: string;
    startTimeStr: string;
    onAttemptChange: (type: 'date' | 'time', value: string) => void;
}

export const Header = ({
    student,
    isSidebarOpen,
    setIsSidebarOpen,
    startDate,
    startTimeStr,
    onAttemptChange,
}: HeaderProps) => {
    return (
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0 bg-slate-50/50 backdrop-blur-md z-30">
            <div className="flex items-center gap-5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {isSidebarOpen ? (
                        <PanelLeftClose size={18} />
                    ) : (
                        <PanelLeftOpen size={18} />
                    )}
                </Button>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {student?.firstName?.charAt(0)}
                    </div>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
                        {student?.firstName} {student?.lastName}
                    </DialogTitle>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            className="bg-transparent border-none text-sm font-medium focus:outline-none"
                            value={startDate}
                            onChange={(e) =>
                                onAttemptChange('date', e.target.value)
                            }
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <select
                            className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                            value={startTimeStr}
                            onChange={(e) =>
                                onAttemptChange('time', e.target.value)
                            }
                        >
                            {Array.from({ length: 41 }, (_, i) => {
                                const totalMin = 8 * 60 + i * 15;
                                const val = `${Math.floor(totalMin / 60)
                                    .toString()
                                    .padStart(2, '0')}:${(totalMin % 60)
                                    .toString()
                                    .padStart(2, '0')}`;
                                return (
                                    <option key={val} value={val}>
                                        {val}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>
        </DialogHeader>
    );
};
