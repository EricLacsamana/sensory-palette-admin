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
import { UserResponse } from '@/types';
import { FormatService } from '@/utils/helpers';

interface HeaderProps {
    student?: UserResponse;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (val: boolean) => void;
    startAt: string;
    endAt: string;
    onChange: (type: 'start' | 'end', val: string) => void;
}

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

    // Internal string builders for HTML inputs
    const _dateValue = `${dStart.getFullYear()}-${String(dStart.getMonth() + 1).padStart(2, '0')}-${String(dStart.getDate()).padStart(2, '0')}`;
    const _toTimeStr = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

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
                        {student?.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={
                                    FormatService.formatStrapiMedia(
                                        student.profilePicture,
                                        'thumbnail',
                                    ) ?? ''
                                }
                                className="h-full w-full object-cover pointer-events-none"
                                alt="profile-picture"
                            />
                        ) : (
                            'S'
                        )}
                    </div>
                    <DialogTitle className="text-lg font-semibold text-slate-900">
                        {student?.firstName} {student?.lastName}
                    </DialogTitle>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            className="bg-transparent border-none text-sm outline-none"
                            value={_dateValue}
                            onChange={(e) =>
                                handleUpdate('date', e.target.value)
                            }
                        />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Start
                        </span>
                        <select
                            className="bg-transparent border-none text-sm outline-none cursor-pointer"
                            value={_toTimeStr(dStart)}
                            onChange={(e) =>
                                handleUpdate('start', e.target.value)
                            }
                        >
                            {Array.from({ length: 41 }, (_, i) => {
                                const t = `${Math.floor((8 * 60 + i * 15) / 60)
                                    .toString()
                                    .padStart(
                                        2,
                                        '0',
                                    )}:${((8 * 60 + i * 15) % 60).toString().padStart(2, '0')}`;
                                return (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            End
                        </span>
                        <select
                            className="bg-transparent border-none text-sm outline-none cursor-pointer"
                            value={_toTimeStr(dEnd)}
                            onChange={(e) =>
                                handleUpdate('end', e.target.value)
                            }
                        >
                            {Array.from({ length: 41 }, (_, i) => {
                                const t = `${Math.floor((8 * 60 + i * 15) / 60)
                                    .toString()
                                    .padStart(
                                        2,
                                        '0',
                                    )}:${((8 * 60 + i * 15) % 60).toString().padStart(2, '0')}`;
                                return (
                                    <option key={t} value={t}>
                                        {t}
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
