'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    Star,
    LineChart,
    Printer,
    ShieldCheck,
    MessageSquareText,
    TrendingUp,
    Zap,
    Calendar,
    MoreHorizontal,
    Activity,
    Clock,
    Target,
} from 'lucide-react';
import { Toaster } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { getStudent } from '@/api/students';
import { getActivitySessionsNew } from '@/api/acitivity-session';
import { cn } from '@/lib/utils';

// Ensure these paths match your project structure
import { InitializeSessionButton } from '@/components/SessionPlanningModal_new/components/InitializeSessionPlanningButton';
import { TimelineTrackList } from '@/components/TimelineTrackList';

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            duration: 0.4,
        },
    },
};

const itemVariants: Variants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};

// --- Sub-Components ---

const TechnicalLabel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={cn(
            'text-[9px] font-bold text-slate-400 uppercase tracking-widest select-none',
            className,
        )}
    >
        {children}
    </span>
);

const IdentityRow = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-colors">
                {icon}
            </div>
            <div className="flex flex-col">
                <TechnicalLabel>{label}</TechnicalLabel>
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px] font-mono">
                    {value}
                </span>
            </div>
        </div>
    </div>
);

const StatCard = ({
    label,
    value,
    trend,
    icon,
    colorClass = 'text-indigo-600',
}: {
    label: string;
    value: string;
    trend?: string;
    icon: React.ReactNode;
    colorClass?: string;
}) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group h-full">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>
        <div className="flex items-center gap-2 mb-3">
            <div
                className={cn(
                    'p-1.5 rounded-md bg-slate-50',
                    colorClass.replace('text-', 'bg-').replace('600', '100'),
                )}
            >
                {React.cloneElement(icon as React.ReactElement, {
                    size: 14,
                    className: colorClass,
                })}
            </div>
            <TechnicalLabel>{label}</TechnicalLabel>
        </div>
        <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                {value}
            </div>
            {trend && (
                <div className="text-[10px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp size={10} />
                    {trend}
                </div>
            )}
        </div>
    </div>
);

const MetricBar = ({
    label,
    value,
    percent,
    color,
}: {
    label: string;
    value: string;
    percent: number;
    color: string;
}) => (
    <div className="space-y-1.5 group">
        <div className="flex justify-between items-end">
            <span className="text-[10px] font-medium text-slate-500">
                {label}
            </span>
            <span className="text-[10px] font-bold text-slate-700 font-mono">
                {value}
            </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
                className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80',
                    color,
                )}
                style={{ width: `${percent}%` }}
            />
        </div>
    </div>
);

// --- Main Page Component ---

export default function StudentDashboard() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    // Data Fetching
    const { data: student, isLoading: isLoadingStudent } = useQuery({
        queryKey: ['student', { id }],
        queryFn: getStudent,
    });

    const { data: activitySessions = [] } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                populate: { activity: { populate: '*' } },
                filters: { student: { id: { $eq: id } } },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!id,
    });

    if (isLoadingStudent) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 space-y-8 max-w-[1600px] mx-auto">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                        <Skeleton className="h-16 w-16 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-8">
                    <Skeleton className="col-span-3 h-[400px] rounded-3xl" />
                    <Skeleton className="col-span-6 h-[600px] rounded-3xl" />
                    <Skeleton className="col-span-3 h-[400px] rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={pageVariants}
            className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 max-w-[1600px] mx-auto font-sans text-slate-900"
        >
            <Toaster position="top-right" richColors />

            {/* --- HEADER --- */}
            <motion.header
                variants={itemVariants}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8"
            >
                <div className="flex items-center gap-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-xl h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
                    >
                        <ArrowLeft size={20} />
                    </Button>

                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <Avatar className="h-16 w-16 rounded-2xl border-4 border-white shadow-sm ring-1 ring-slate-100">
                                <AvatarFallback className="bg-slate-900 text-white font-bold text-xl">
                                    {student?.fullName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white" />
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    {student?.fullName}
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider"
                                >
                                    Student
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500">
                                <span className="text-xs font-medium flex items-center gap-1.5">
                                    <Building2 size={12} />
                                    Quezon City Hub
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-xs font-medium flex items-center gap-1.5 font-mono">
                                    ID: #{new Date().getFullYear()}-
                                    {id.toString().padStart(3, '0')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="h-11 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium text-xs uppercase tracking-wide"
                    >
                        <Printer size={16} className="mr-2" />
                        Report
                    </Button>
                    {/* The Modal Trigger Button */}
                    <InitializeSessionButton />
                </div>
            </motion.header>

            {/* --- MAIN GRID --- */}
            <div className="grid grid-cols-12 gap-6 items-start">
                {/* --- LEFT COLUMN: IDENTITY & CONTEXT --- */}
                <motion.aside
                    variants={itemVariants}
                    className="col-span-12 lg:col-span-3 space-y-6"
                >
                    {/* Identity Card */}
                    <Card className="rounded-[24px] border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-5 px-5">
                            <div className="flex justify-between items-center">
                                <TechnicalLabel>Student File</TechnicalLabel>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                                >
                                    <MoreHorizontal size={14} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <IdentityRow
                                icon={<Target size={14} />}
                                label="Current Goal"
                                value="Sensory Regulation"
                            />
                            <IdentityRow
                                icon={<ShieldCheck size={14} />}
                                label="Status"
                                value="Active / Verified"
                            />
                            <IdentityRow
                                icon={<Calendar size={14} />}
                                label="Enrolled"
                                value="Aug 24, 2024"
                            />
                        </CardContent>
                        <div className="bg-slate-50 p-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span>Profile Completion</span>
                                <span className="font-mono text-slate-900">
                                    92%
                                </span>
                            </div>
                            <Progress
                                value={92}
                                className="h-1.5 mt-2 bg-slate-200"
                                indicatorClassName="bg-slate-800"
                            />
                        </div>
                    </Card>

                    {/* AI Insight Card */}
                    <div className="rounded-[24px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 shadow-lg shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Zap
                                    size={14}
                                    fill="currentColor"
                                    className="text-yellow-300"
                                />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                                AI Suggestion
                            </span>
                        </div>

                        <p className="text-sm font-medium leading-relaxed opacity-95 relative z-10">
                            &quot;Engagement drops after 45 mins. Try scheduling{' '}
                            <span className="font-bold underline decoration-indigo-300 underline-offset-2">
                                tactile breaks
                            </span>{' '}
                            between cognitive tasks.&quot;
                        </p>

                        <Button
                            size="sm"
                            variant="secondary"
                            className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white border-0 text-xs h-8"
                        >
                            Apply Suggestion
                        </Button>
                    </div>
                </motion.aside>

                {/* --- CENTER COLUMN: TIMELINE & ACTIVITY --- */}
                <motion.main
                    variants={itemVariants}
                    className="col-span-12 lg:col-span-6 space-y-6 flex flex-col"
                >
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 shrink-0">
                        <StatCard
                            label="Session Score"
                            value="94"
                            trend="+2.5%"
                            icon={<Star />}
                            colorClass="text-amber-500"
                        />
                        <StatCard
                            label="Hours Logged"
                            value="12.5h"
                            icon={<Clock />}
                            colorClass="text-blue-500"
                        />
                        <StatCard
                            label="Avg Focus"
                            value="88%"
                            icon={<Activity />}
                            colorClass="text-emerald-500"
                        />
                    </div>

                    {/* Timeline Component - Fully Integrated */}
                    {/* We pass the styling here to ensure it fills the space properly */}
                    <TimelineTrackList
                        data={activitySessions}
                        className="shadow-sm min-h-[500px] flex-1"
                    />
                </motion.main>

                {/* --- RIGHT COLUMN: METRICS & NOTES --- */}
                <motion.section
                    variants={itemVariants}
                    className="col-span-12 lg:col-span-3 space-y-6"
                >
                    {/* Performance Card */}
                    <Card className="rounded-[24px] border border-slate-200 shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <TechnicalLabel>
                                    Performance Metrics
                                </TechnicalLabel>
                                <LineChart
                                    size={16}
                                    className="text-slate-300"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <MetricBar
                                label="Task Completion"
                                value="85%"
                                percent={85}
                                color="bg-emerald-500"
                            />
                            <MetricBar
                                label="Behavioral Reg"
                                value="72%"
                                percent={72}
                                color="bg-indigo-500"
                            />
                            <MetricBar
                                label="Social Interaction"
                                value="64%"
                                percent={64}
                                color="bg-amber-500"
                            />

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-medium uppercase">
                                        Total XP
                                    </div>
                                    <div className="text-xl font-bold text-slate-800 tabular-nums">
                                        1,240
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 font-medium uppercase">
                                        Streak
                                    </div>
                                    <div className="text-xl font-bold text-slate-800 tabular-nums flex items-center gap-1">
                                        5{' '}
                                        <span className="text-xs font-normal text-slate-400">
                                            days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Handover Note */}
                    <div className="rounded-[24px] border border-slate-200 bg-white p-1 relative overflow-hidden">
                        <div className="bg-amber-50/50 rounded-[20px] p-5 border border-amber-100/50 h-full">
                            <div className="flex items-center gap-2 mb-3 text-amber-700/60">
                                <MessageSquareText size={14} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                    Handover Note
                                </span>
                            </div>
                            <p className="text-xs font-medium text-slate-700 italic leading-relaxed">
                                &quot;Hand-eye coordination showed significant
                                improvement during the Art module. Recommended
                                starting with clay work tomorrow.&quot;
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[9px] bg-amber-200 text-amber-800">
                                        TC
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-medium text-slate-400">
                                    Teacher Celine, 2h ago
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </motion.div>
    );
}
