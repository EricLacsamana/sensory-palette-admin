'use client';

import React from 'react';
import Link from 'next/link';
import {
    Ear,
    Brain,
    Hand,
    Dumbbell,
    Activity,
    CheckCircle2,
    PlayCircle,
    Clock,
    XCircle,
    PauseCircle,
    Flag,
    CalendarClock,
    Sparkles,
    Stethoscope,
    ChevronRight,
    GraduationCap,
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

/**
 * Professional Category Mapping
 * Matches activitysessions.categories.type for logic and .name for display
 */
const CATEGORY_MAP: Record<
    string,
    { icon: any; color: string; bg: string; border: string; accent: string }
> = {
    auditory: {
        icon: Ear,
        color: 'text-cyan-700',
        bg: 'bg-cyan-50',
        border: 'border-cyan-100',
        accent: 'bg-cyan-500',
    },
    cognitive: {
        icon: Brain,
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        accent: 'bg-purple-500',
    },
    motor: {
        icon: Hand,
        color: 'text-orange-700',
        bg: 'bg-orange-50',
        border: 'border-orange-100',
        accent: 'bg-orange-500',
    },
    physical: {
        icon: Dumbbell,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        accent: 'bg-emerald-500',
    },
    default: {
        icon: Activity,
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-100',
        accent: 'bg-slate-400',
    },
};

export function ActivitySessionLogsTable({
    data,
}: {
    data: ActivitySessionResponse[];
}) {
    return (
        <div className="flex-1 overflow-auto bg-white">
            <Table className="w-full text-left whitespace-nowrap ">
                <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                            Session Status
                        </TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                            Student & Therapist
                        </TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                            Clinical Categories
                        </TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                            AI Insight
                        </TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">
                            Action
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((session) => {
                        // Handle multiple categories
                        const categories = session.activity?.categories || [];
                        const primaryCat = categories[0] || {
                            type: 'default',
                            name: 'General',
                        };
                        const style =
                            CATEGORY_MAP[primaryCat.type.toLowerCase()] ||
                            CATEGORY_MAP.default;
                        const CatIcon = style.icon;

                        return (
                            <TableRow
                                key={session.id}
                                className="group transition-colors hover:bg-slate-50/50 border-b border-slate-100 last:border-0"
                            >
                                {/* COLUMN 1: STATUS & TIMESTAMP */}
                                <TableCell className="px-6 py-5">
                                    <StatusBadge
                                        status={session.activitySessionStatus}
                                    />
                                    <div className="mt-2 flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                            {FormatService.formatDate(
                                                session.actualStartAt,
                                                'long',
                                            )}
                                        </span>
                                        <span className="text-[10px] font-mono font-medium text-slate-400">
                                            {new Date(
                                                session.actualEndAt,
                                            ).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* COLUMN 2: STUDENT & THERAPIST */}
                                <TableCell className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 rounded-xl border border-slate-200">
                                            <AvatarImage
                                                src={FormatService.formatStrapiMedia(
                                                    session.student
                                                        ?.profilePicture,
                                                    'thumbnail',
                                                )}
                                            />
                                            <AvatarFallback className="bg-slate-100 text-[10px] font-black">
                                                {
                                                    session.student
                                                        ?.firstName?.[0]
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 leading-none">
                                                {session.student?.firstName}{' '}
                                                {session.student?.lastName}
                                            </span>
                                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                <GraduationCap
                                                    size={12}
                                                    className="text-indigo-400"
                                                />
                                                Student
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* COLUMN 3: MULTIPLE CATEGORIES & ACTIVITY */}
                                <TableCell className="px-6 py-5">
                                    <div className="flex items-start gap-4">
                                        {/* Primary Icon Box */}
                                        <div
                                            className={cn(
                                                'h-11 w-11 rounded-2xl border-2 flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110',
                                                style.bg,
                                                style.border,
                                            )}
                                        >
                                            <CatIcon
                                                size={20}
                                                className={style.color}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-sm font-bold text-slate-800 leading-tight">
                                                {session.activity?.name ||
                                                    'Session Activity'}
                                            </span>

                                            {/* Render all categories as mini-badges */}
                                            <div className="flex flex-wrap gap-1">
                                                {categories.map(
                                                    (cat: any, idx: number) => {
                                                        const catStyle =
                                                            CATEGORY_MAP[
                                                                cat.type.toLowerCase()
                                                            ] ||
                                                            CATEGORY_MAP.default;
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className={cn(
                                                                    'text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border',
                                                                    catStyle.color,
                                                                    catStyle.bg,
                                                                    catStyle.border,
                                                                )}
                                                            >
                                                                {cat.name}
                                                            </span>
                                                        );
                                                    },
                                                )}
                                                {categories.length === 0 && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border bg-slate-50 text-slate-400 border-slate-100">
                                                        Uncategorized
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* COLUMN 4: AI INTELLIGENCE */}
                                <TableCell className="px-6 py-5">
                                    {session.aiRecommendation ? (
                                        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-xl">
                                            <Sparkles
                                                size={14}
                                                className="text-purple-500 fill-purple-200"
                                            />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Insights Ready
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-2">
                                            Standard Log
                                        </span>
                                    )}
                                </TableCell>

                                {/* COLUMN 5: ACTION */}
                                <TableCell className="px-6 py-5 text-right">
                                    <Link
                                        href={`/activity-sessions/${session.documentId}`}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white rounded-xl border border-indigo-100 transition-all"
                                        >
                                            View Details{' '}
                                            <ChevronRight
                                                size={14}
                                                className="ml-1"
                                            />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { label: string; icon: any; color: string; dot: string }
    > = {
        completed: {
            label: 'Completed',
            icon: CheckCircle2,
            color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
            dot: 'bg-emerald-500',
        },
        in_progress: {
            label: 'Live',
            icon: PlayCircle,
            color: 'text-blue-700 bg-blue-50 border-blue-100',
            dot: 'bg-blue-500',
        },
        pending: {
            label: 'Scheduled',
            icon: Clock,
            color: 'text-slate-500 bg-slate-50 border-slate-200',
            dot: 'bg-slate-400',
        },
        cancelled: {
            label: 'Void',
            icon: XCircle,
            color: 'text-rose-600 bg-rose-50 border-rose-100',
            dot: 'bg-rose-500',
        },
    };

    const active = config[status] || config.pending;
    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border font-black text-[9px] uppercase tracking-wider',
                active.color,
            )}
        >
            <div className={cn('h-1.5 w-1.5 rounded-full', active.dot)} />
            {active.label}
        </div>
    );
}
