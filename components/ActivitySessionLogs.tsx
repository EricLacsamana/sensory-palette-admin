'use client';

import React from 'react';
import { Activity, Clock, CheckCircle2, PlayCircle } from 'lucide-react';
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

export function ActivitySessionLogsTable({
    data,
}: {
    data: ActivitySessionResponse[];
}) {
    return (
        <div className="w-full overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 py-4 px-6">
                            Learner
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Activity
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Status
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Score
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right pr-6">
                            Time
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((activitySession) => (
                        <TableRow
                            key={activitySession.id}
                            className="group border-slate-50 transition-colors hover:bg-slate-50/50"
                        >
                            <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Activity size={14} strokeWidth={2} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">
                                        {activitySession.student?.firstName}{' '}
                                        {activitySession.student?.lastName}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs font-medium text-slate-600 truncate max-w-[150px] inline-block">
                                    {activitySession.activity?.name ||
                                        'Standard Exercise'}
                                </span>
                            </TableCell>
                            <TableCell>
                                <StatusBadge
                                    status={
                                        activitySession.activitySessionStatus
                                    }
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-900">
                                        90 %
                                    </span>
                                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{
                                                width: `${activitySession.actualScore ?? 0 * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-2 text-[10px] font-medium text-slate-400 uppercase">
                                    <Clock size={12} strokeWidth={1.5} />
                                    {FormatService.formatDateTime(
                                        activitySession.startAt,
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { label: string; icon: any; className: string }
    > = {
        completed: {
            label: 'Done',
            icon: CheckCircle2,
            className: 'text-emerald-600 bg-emerald-50',
        },
        live: {
            label: 'Live',
            icon: PlayCircle,
            className: 'text-indigo-600 bg-indigo-50 animate-pulse',
        },
        pending: {
            label: 'Wait',
            icon: Clock,
            className: 'text-amber-600 bg-amber-50',
        },
    };
    const { label, icon: Icon, className } = config[status] || config.pending;
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase',
                className,
            )}
        >
            <Icon size={10} strokeWidth={2.5} />
            {label}
        </div>
    );
}
