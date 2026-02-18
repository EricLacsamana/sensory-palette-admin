'use client';

import React from 'react';
import Link from 'next/link';
import {
    Activity,
    Clock,
    CheckCircle2,
    PlayCircle,
    Timer,
    ArrowRight,
    Flag,
    PauseCircle,
    XCircle,
    CalendarClock,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { FormatService } from '@/utils/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function ActivitySessionLogsTable({
    data,
}: {
    data: ActivitySessionResponse[];
}) {
    return (
        <div className="w-full overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent border-none">
                        {/* ALIGNMENT LOCK: pl-8 matches the Dashboard Card Header */}
                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-14 pl-8">
                            Learner
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-14">
                            Activity
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-14">
                            Status
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-14">
                            Accuracy
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 h-14 text-right pr-8">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((session) => (
                        <TableRow
                            key={session.id}
                            className="group border-slate-100 transition-colors hover:bg-indigo-50/30"
                        >
                            <TableCell className="py-5 pl-8">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                                        <AvatarImage
                                            src={FormatService.formatStrapiMedia(
                                                session.student?.profilePicture,
                                                'thumbnail',
                                            )}
                                            alt="student-avatar"
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase">
                                            {session.student?.firstName?.[0]}
                                            {session.student?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 leading-tight">
                                            {session.student?.firstName}{' '}
                                            {session.student?.lastName}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            ID:{' '}
                                            {session.student?.id
                                                ?.toString()
                                                .padStart(4, '0')}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[160px]">
                                        {session.activity?.name ||
                                            'Standard Exercise'}
                                    </span>
                                    <span className="text-[9px] font-black text-indigo-600/50 uppercase tracking-widest">
                                        Clinical
                                    </span>
                                </div>
                            </TableCell>

                            <TableCell>
                                <StatusBadge
                                    status={session.activitySessionStatus}
                                />
                            </TableCell>

                            <TableCell>
                                <div className="flex flex-col gap-1.5 w-28">
                                    <span className="text-[10px] font-black text-slate-900 tabular-nums">
                                        {session.score ?? 0}%
                                    </span>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-700',
                                                (session.score ?? 0) > 70
                                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                                    : 'bg-amber-500',
                                            )}
                                            style={{
                                                width: `${session.score ?? 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell className="text-right pr-8">
                                <Link
                                    href={`/activity-sessions/${session.documentId}`}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 group-hover:bg-white transition-all shadow-none"
                                    >
                                        Analysis{' '}
                                        <ArrowRight
                                            size={14}
                                            className="ml-2"
                                        />
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* --- BOTTOM BUFFER ROW --- */}
                    <TableRow className="hover:bg-transparent border-none">
                        <TableCell colSpan={5} className="h-10" />
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { label: string; icon: any; color: string; iconBg: string }
    > = {
        completed: {
            label: 'Done',
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            iconBg: 'bg-emerald-100/50',
        },
        in_progress: {
            label: 'Live',
            icon: PlayCircle,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100 animate-pulse',
            iconBg: 'bg-indigo-100/50',
        },
        pending: {
            label: 'Wait',
            icon: Clock,
            color: 'text-slate-500 bg-slate-50 border-slate-200',
            iconBg: 'bg-slate-200/50',
        },
        cancelled: {
            label: 'Void',
            icon: XCircle,
            color: 'text-rose-600 bg-rose-50 border-rose-100',
            iconBg: 'bg-rose-100/50',
        },
        interrupted: {
            label: 'Paused',
            icon: PauseCircle,
            color: 'text-amber-600 bg-amber-50 border-amber-100',
            iconBg: 'bg-amber-100/50',
        },
        abandoned: {
            label: 'Dropped',
            icon: Flag,
            color: 'text-stone-600 bg-stone-50 border-stone-100',
            iconBg: 'bg-stone-100/50',
        },
        reschedule_requested: {
            label: 'Resched',
            icon: CalendarClock,
            color: 'text-purple-600 bg-purple-50 border-purple-100',
            iconBg: 'bg-purple-100/50',
        },
    };

    const {
        label,
        icon: Icon,
        color,
        iconBg,
    } = config[status] || config.pending;

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl border transition-all duration-300 shadow-sm',
                color,
            )}
        >
            <div className={cn('p-1 rounded-lg', iconBg)}>
                <Icon size={12} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                {label}
            </span>
        </div>
    );
}
