'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Sparkles,
    GraduationCap,
    ChevronRight,
    Loader2,
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

// ============================================================================
// TABLE VIEW COMPONENT
// ============================================================================
export function ActivitySessionLogsTable({
    data,
}: {
    data: ActivitySessionResponse[];
}) {
    const router = useRouter();
    const [pendingId, setPendingId] = useState<string | null>(null);

    const handleNavigate = (id: string) => {
        setPendingId(id);
        router.push(`/activity-sessions/${id}`);
    };

    return (
        <Table className="w-full text-left text-sm whitespace-nowrap relative min-w-[800px]">
            <TableHeader className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm border-b border-slate-200">
                <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">
                        Session Status
                    </TableHead>
                    <TableHead className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">
                        Student & Therapist
                    </TableHead>
                    <TableHead className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">
                        Clinical Categories
                    </TableHead>
                    <TableHead className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">
                        AI Insight
                    </TableHead>
                    <TableHead className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">
                        Action
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
                {data.map((session) => {
                    const categories = session.activity?.categories || [];
                    const primaryCat = categories[0] || {
                        type: 'default',
                        name: 'General',
                    };
                    const style =
                        CATEGORY_MAP[primaryCat.type.toLowerCase()] ||
                        CATEGORY_MAP.default;
                    const CatIcon = style.icon;
                    const isPending = pendingId === session.documentId;

                    return (
                        <TableRow
                            key={session.id}
                            className={cn(
                                'group transition-colors border-b border-slate-100 last:border-0',
                                isPending
                                    ? 'bg-indigo-50/30'
                                    : 'hover:bg-slate-50/50',
                            )}
                        >
                            {/* COLUMN 1: STATUS & TIMESTAMP */}
                            <TableCell className="px-6 py-4">
                                <StatusBadge
                                    status={session.activitySessionStatus}
                                />
                                <div className="mt-2 flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        {FormatService.formatDate(
                                            session.actualStartAt ||
                                                session.updatedAt,
                                            'long',
                                        )}
                                    </span>
                                    <span className="text-[10px] font-mono font-medium text-slate-400">
                                        {new Date(
                                            session.actualEndAt ||
                                                session.updatedAt,
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
                            <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-xl border border-slate-200 shadow-sm">
                                        <AvatarImage
                                            src={FormatService.formatStrapiMedia(
                                                session.student?.profilePicture,
                                                'thumbnail',
                                            )}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-[10px] font-black">
                                            {session.student?.firstName?.[0]}
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
                            <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            'h-11 w-11 rounded-2xl border-2 flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110 bg-white',
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
                                                                'text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border',
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
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border bg-slate-50 text-slate-400 border-slate-100">
                                                    Uncategorized
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>

                            {/* COLUMN 4: AI INTELLIGENCE */}
                            <TableCell className="px-6 py-4">
                                {session.aiRecommendation ? (
                                    <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-xl shadow-sm">
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
                            <TableCell className="px-6 py-4 text-right">
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        handleNavigate(session.documentId)
                                    }
                                    disabled={isPending}
                                    className={cn(
                                        'h-10 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm w-[140px] flex items-center justify-center ml-auto border-2',
                                        isPending
                                            ? 'bg-indigo-600 border-indigo-600 text-white opacity-100 cursor-wait shadow-indigo-200'
                                            : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-md hover:shadow-indigo-200 opacity-100 xl:opacity-0 group-hover:opacity-100',
                                    )}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2
                                                size={14}
                                                className="animate-spin mr-2"
                                            />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            View Details{' '}
                                            <ChevronRight
                                                size={14}
                                                className="ml-1 -mr-1"
                                            />
                                        </>
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

// ============================================================================
// GRID (TILE) VIEW COMPONENT - REDESIGNED UI/UX
// ============================================================================
export function ActivitySessionCard({
    session,
}: {
    session: ActivitySessionResponse;
}) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const categories = session.activity?.categories || [];
    const primaryCat = categories[0] || { type: 'default', name: 'General' };
    const style =
        CATEGORY_MAP[primaryCat.type.toLowerCase()] || CATEGORY_MAP.default;
    const CatIcon = style.icon;

    const handleView = () => {
        setIsPending(true);
        router.push(`/activity-sessions/${session.documentId}`);
    };

    // Explicitly grab the banner URL using FormatService exactly like ActivityLibrary does
    const bannerUrl =
        FormatService.formatStrapiMedia(session.activity?.banner, 'small') ||
        FormatService.formatStrapiMedia(session.activity?.banner, 'thumbnail');

    return (
        <div
            className={cn(
                'group flex flex-col bg-white rounded-[32px] border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative isolate h-full',
                isPending &&
                    'opacity-80 pointer-events-none ring-2 ring-indigo-500/20 border-indigo-300 scale-[0.98]',
            )}
        >
            {/* --- HERO BANNER --- */}
            <div className="relative h-44 w-full shrink-0 bg-slate-50 overflow-hidden p-3">
                <div className="absolute inset-0">
                    {bannerUrl ? (
                        <img
                            src={bannerUrl}
                            alt={session.activity?.name || 'Activity Banner'}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div
                            className={cn(
                                'w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105',
                                style.bg,
                            )}
                        >
                            <CatIcon
                                size={64}
                                className={cn('opacity-20', style.color)}
                            />
                        </div>
                    )}
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent" />
                </div>

                {/* Top Overlays */}
                <div className="relative z-10 flex justify-between items-start">
                    <StatusBadge
                        status={session.activitySessionStatus}
                        className="backdrop-blur-md shadow-sm"
                    />
                    {session.aiRecommendation && (
                        <div
                            className="bg-purple-600/90 backdrop-blur-md text-white p-2.5 rounded-xl shadow-[0_4px_20px_rgba(147,51,234,0.6)] border border-purple-400/50 flex items-center justify-center"
                            title="AI Insight Ready"
                        >
                            <Sparkles size={16} className="fill-purple-100" />
                        </div>
                    )}
                </div>
            </div>

            {/* --- CARD CONTENT --- */}
            <div className="flex-1 flex flex-col p-6 pt-5">
                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {categories.slice(0, 2).map((cat: any, idx: number) => {
                        const catStyle =
                            CATEGORY_MAP[cat.type.toLowerCase()] ||
                            CATEGORY_MAP.default;
                        return (
                            <span
                                key={idx}
                                className={cn(
                                    'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border',
                                    catStyle.color,
                                    catStyle.bg,
                                    catStyle.border,
                                )}
                            >
                                {cat.name}
                            </span>
                        );
                    })}
                    {categories.length === 0 && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-slate-50 text-slate-400 border-slate-100">
                            Uncategorized
                        </span>
                    )}
                </div>

                {/* Activity Name */}
                <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2 mb-6 group-hover:text-indigo-600 transition-colors">
                    {session.activity?.name || 'Unnamed Activity'}
                </h3>

                {/* Bottom Meta */}
                <div className="mt-auto flex flex-col gap-5">
                    {/* Student Row */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-xl border border-slate-200 shadow-sm shrink-0">
                            <AvatarImage
                                src={FormatService.formatStrapiMedia(
                                    session.student?.profilePicture,
                                    'thumbnail',
                                )}
                            />
                            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                                {session.student?.firstName?.[0] || 'S'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 truncate">
                                {session.student?.firstName}{' '}
                                {session.student?.lastName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                <Clock size={10} />
                                {FormatService.formatDate(
                                    session.actualStartAt || session.updatedAt,
                                    'short',
                                )}
                            </div>
                        </div>
                    </div>

                    {/* View Button */}
                    <Button
                        onClick={handleView}
                        disabled={isPending}
                        className={cn(
                            'w-full h-11 text-[10px] font-black uppercase tracking-widest rounded-[20px] transition-all active:scale-95 flex items-center justify-center border-2',
                            isPending
                                ? 'bg-indigo-600 border-indigo-600 text-white cursor-wait shadow-md shadow-indigo-200'
                                : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-md hover:shadow-indigo-200',
                        )}
                    >
                        {isPending ? (
                            <>
                                <Loader2
                                    size={14}
                                    className="animate-spin mr-2"
                                />{' '}
                                Loading...
                            </>
                        ) : (
                            <>
                                View Session{' '}
                                <ChevronRight
                                    size={14}
                                    className="ml-1 -mr-1"
                                />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// HELPER: STATUS BADGE
// ============================================================================
function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const config: Record<
        string,
        { label: string; icon: any; color: string; dot: string }
    > = {
        completed: {
            label: 'Completed',
            icon: CheckCircle2,
            color: 'text-emerald-700 bg-emerald-50/90 border-emerald-200',
            dot: 'bg-emerald-500',
        },
        in_progress: {
            label: 'Live',
            icon: PlayCircle,
            color: 'text-blue-700 bg-blue-50/90 border-blue-200',
            dot: 'bg-blue-500',
        },
        pending: {
            label: 'Scheduled',
            icon: Clock,
            color: 'text-slate-600 bg-slate-50/90 border-slate-200',
            dot: 'bg-slate-500',
        },
        cancelled: {
            label: 'Void',
            icon: XCircle,
            color: 'text-rose-700 bg-rose-50/90 border-rose-200',
            dot: 'bg-rose-500',
        },
    };

    const active = config[status] || config.pending;
    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border font-black text-[9px] uppercase tracking-wider',
                active.color,
                className,
            )}
        >
            <div className={cn('h-1.5 w-1.5 rounded-full', active.dot)} />
            {active.label}
        </div>
    );
}
