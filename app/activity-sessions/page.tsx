'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    Search,
    Filter,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    PlayCircle,
    FileJson,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { getActivitySessions } from '@/api/acitivity-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function ActivitySessions() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['activity-sessions'],
        queryFn: getActivitySessions,
    });

    const filteredSessions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return sessions.filter(
            (s) =>
                s.student?.firstName?.toLowerCase().includes(term) ||
                s.activity?.name?.toLowerCase().includes(term) ||
                s.id.toString().includes(term),
        );
    }, [sessions, searchTerm]);

    if (isLoading) return <SessionsSkeleton />;

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* --- HEADER HUD --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-[20px] bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-[1000] text-slate-900 tracking-tight">
                            Session Log
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Historical Data & Performance History
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input
                            placeholder="Search learner or activity..."
                            className="pl-9 w-full md:w-64 bg-white border-slate-200 rounded-xl h-10 font-bold text-xs shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-xl h-10 border-slate-200 font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                        <Filter size={14} /> Filters
                    </Button>
                </div>
            </header>

            {/* --- DATA TABLE --- */}

            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden p-1.5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">
                                Learner & Session
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Status
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Timeline
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Accuracy
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSessions.map((session: any) => (
                            <TableRow
                                key={session.id}
                                className="group border-slate-50 transition-colors hover:bg-slate-50/80"
                            >
                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                            <Activity size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-none">
                                                {session.student?.firstName}{' '}
                                                {session.student?.lastName}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                                {session.activity?.name ||
                                                    'Unknown Activity'}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge
                                        status={session.activityStatus}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 text-[11px] font-[1000] text-slate-700">
                                            <CalendarIcon
                                                size={12}
                                                className="text-slate-300"
                                            />
                                            {format(
                                                parseISO(session.startTime),
                                                'MMM d, yyyy',
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mt-0.5 uppercase">
                                            <Clock size={10} />{' '}
                                            {format(
                                                parseISO(session.startTime),
                                                'p',
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-[1000] text-slate-900 tabular-nums">
                                            {(
                                                session.successRate * 100
                                            ).toFixed(0)}
                                            %
                                        </span>
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all"
                                                style={{
                                                    width: `${session.successRate * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                                        >
                                            <FileJson size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <ArrowUpRight size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { label: string; icon: any; className: string }
    > = {
        completed: {
            label: 'Completed',
            icon: CheckCircle2,
            className: 'bg-emerald-50 text-emerald-600',
        },
        live: {
            label: 'Live Now',
            icon: PlayCircle,
            className:
                'bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50 animate-pulse',
        },
        pending: {
            label: 'Pending',
            icon: Clock,
            className: 'bg-amber-50 text-amber-600',
        },
    };

    const { label, icon: Icon, className } = config[status] || config.pending;

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest',
                className,
            )}
        >
            <Icon size={12} />
            {label}
        </div>
    );
}

function SessionsSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-10 w-48 bg-slate-200 rounded-xl" />
            <div className="h-96 w-full bg-slate-100 rounded-[32px]" />
        </div>
    );
}
