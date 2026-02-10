'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import {
    ArrowLeft,
    MapPin,
    Play,
    Building2,
    Star,
    LineChart,
    Printer,
    ChevronRight,
    ShieldCheck,
    MessageSquareText,
    TrendingUp,
    Zap,
    Calendar,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { getStudent } from '@/api/students';
import { getActivitySessions } from '@/api/acitivity-session';
import { cn } from '@/lib/utils';

import { InitializeSessionButton } from '@/components/SessionPlanningModal/components/InitializeSessionPlanningButton';
import { TimelineTrackList } from '@/components/TimelineTrackList';

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
};

// --- Sub-Components ---

const IdentityRow = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) => (
    <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest ml-0.5">
                {label}
            </span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                {value}
            </span>
        </div>
    </div>
);

const KPICard = ({
    label,
    value,
    progress,
    sub,
    icon,
}: {
    label: string;
    value: string;
    progress?: number;
    sub?: string;
    icon: React.ReactNode;
}) => (
    <Card className="rounded-[20px] border border-slate-200/60 shadow-sm p-4 bg-white flex-1 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-2">
            <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center">
                {icon}
            </div>
            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">
                {label}
            </span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-xl font-semibold text-slate-900 tracking-tighter">
                {value}
            </span>
            {sub && (
                <span className="text-[9px] font-semibold text-emerald-600 uppercase">
                    {sub}
                </span>
            )}
        </div>
        {progress !== undefined && (
            <Progress value={progress} className="h-1 bg-slate-100" />
        )}
    </Card>
);

const MetricRow = ({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color: string;
}) => (
    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100 cursor-default group">
        <div className="flex items-center gap-3">
            <div
                className={cn(
                    'h-1.5 w-1.5 rounded-full group-hover:scale-125 transition-transform',
                    color,
                )}
            />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                {label}
            </span>
        </div>
        <span className="text-lg font-semibold text-slate-900 tracking-tighter">
            {value}
        </span>
    </div>
);

// --- Main Component ---

export default function StudentDashboard() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    // Fetch Student
    const { data: student, isLoading: isLoadingStudent } = useQuery({
        queryKey: ['student', { id }],
        queryFn: getStudent,
    });

    // Fetch Sessions (Note the Query Key structure)
    const { data: activitySessions = [] } = useQuery({
        queryKey: ['activity-sessions-student', { studentId: id }],
        queryFn: getActivitySessions,
        enabled: !!id,
    });

    console.log('activity', activitySessions);
    if (isLoadingStudent) {
        return (
            <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex gap-4">
                        <Skeleton className="h-14 w-14 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        <Skeleton className="h-64 w-full rounded-[24px]" />
                        <Skeleton className="h-32 w-full rounded-[24px]" />
                    </div>
                    <div className="col-span-12 lg:col-span-6">
                        <Skeleton className="h-96 w-full rounded-[32px]" />
                    </div>
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        <Skeleton className="h-48 w-full rounded-[24px]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={pageVariants}
            className="min-h-screen bg-slate-50/50 p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 font-sans"
        >
            <Toaster position="top-right" richColors />

            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-xl h-10 w-10 bg-white border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={18} strokeWidth={1.5} />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-md">
                            <AvatarFallback className="bg-indigo-600 text-white font-semibold text-lg">
                                {student?.fullName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                                {student?.fullName}’s Workspace
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-emerald-500 text-white border-none font-semibold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Active
                                </Badge>
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={12} strokeWidth={1.5} />
                                    {new Date().toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="flex-1 md:flex-none h-10 px-4 rounded-xl border-slate-200 font-semibold text-xs bg-white text-slate-600 hover:text-slate-900"
                    >
                        <Printer size={14} strokeWidth={1.5} className="mr-2" />
                        Export
                    </Button>
                    <InitializeSessionButton />
                </div>
            </motion.header>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6 items-start">
                {/* Left Column: Profile */}
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="col-span-12 lg:col-span-3 flex flex-col gap-6"
                >
                    <Card className="rounded-[24px] border border-slate-200/60 shadow-sm bg-white flex-1">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-0.5">
                                    Profile
                                </span>
                                <p className="text-lg font-semibold text-slate-900 leading-tight">
                                    {student?.fullName}
                                </p>
                            </div>
                            <Separator className="bg-slate-100/80" />
                            <div className="space-y-4">
                                <IdentityRow
                                    icon={
                                        <ShieldCheck
                                            size={16}
                                            strokeWidth={1.5}
                                        />
                                    }
                                    label="Status"
                                    value="Verified"
                                />
                                <IdentityRow
                                    icon={
                                        <MapPin size={16} strokeWidth={1.5} />
                                    }
                                    label="Hub"
                                    value="Quezon City"
                                />
                                <IdentityRow
                                    icon={
                                        <Building2
                                            size={16}
                                            strokeWidth={1.5}
                                        />
                                    }
                                    label="ID"
                                    value={`#${new Date().getFullYear()}-HQ`}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[24px] bg-indigo-600 text-white border-none shadow-lg overflow-hidden relative group">
                        <CardContent className="p-6 space-y-3 relative z-10">
                            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest opacity-80">
                                <Zap size={12} fill="white" strokeWidth={1.5} />
                                AI Recommendation
                            </div>
                            <p className="text-sm font-medium leading-tight">
                                Focus peaking.{' '}
                                <span className="text-indigo-200">
                                    Switch to tactile activities.
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                </motion.aside>

                {/* Center Column: Timeline & Stats */}
                <motion.main
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="col-span-12 lg:col-span-6 space-y-6"
                >
                    <div className="grid grid-cols-2 gap-6">
                        <KPICard
                            label="Goal Progress"
                            value="66%"
                            progress={66}
                            icon={
                                <TrendingUp
                                    className="text-emerald-500"
                                    size={16}
                                    strokeWidth={1.5}
                                />
                            }
                        />
                        <KPICard
                            label="Learner Rank"
                            value="Gold"
                            sub="Top 5%"
                            icon={
                                <Star
                                    className="text-amber-500 fill-current"
                                    size={16}
                                    strokeWidth={1.5}
                                />
                            }
                        />
                    </div>

                    <TimelineTrackList data={activitySessions} />
                </motion.main>

                {/* Right Column: Metrics */}
                <motion.section
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="col-span-12 lg:col-span-3 flex flex-col gap-6"
                >
                    <Card className="rounded-[24px] border border-slate-200/60 shadow-sm p-6 bg-white flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-0.5">
                                KPI Metrics
                            </span>
                            <LineChart
                                className="text-indigo-400"
                                size={14}
                                strokeWidth={1.5}
                            />
                        </div>
                        <div className="space-y-3 mt-4">
                            <MetricRow
                                label="Engagement"
                                value="85%"
                                color="bg-emerald-500"
                            />
                            <MetricRow
                                label="Accuracy"
                                value="72%"
                                color="bg-indigo-500"
                            />
                            <MetricRow
                                label="Duration"
                                value="1.4h"
                                color="bg-amber-500"
                            />
                        </div>
                    </Card>

                    <Card className="rounded-[24px] border border-slate-200 shadow-sm p-6 bg-white border-dashed">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-0.5">
                                Handover Note
                            </span>
                            <MessageSquareText
                                size={14}
                                className="text-slate-300"
                                strokeWidth={1.5}
                            />
                        </div>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed italic border-l-2 border-indigo-500/50 pl-4 py-1.5 bg-slate-50/50 rounded-r-xl">
                            &quot;Significant improvement in Hand-eye
                            coordination observed during Art.&quot;
                        </p>
                    </Card>
                </motion.section>
            </div>
        </motion.div>
    );
}
