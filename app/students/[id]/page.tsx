'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    ShieldCheck,
    MessageSquareText,
    Zap,
    Calendar,
    Activity,
    Target,
    Printer,
    Loader2,
} from 'lucide-react';
import { Toaster } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getStudent } from '@/api/students';
import { getActivitySessionsNew } from '@/api/acitivity-session';
import { cn } from '@/lib/utils';
import { TimelineTrackList } from '@/components/TimelineTrackList';

// --- ANIMATION VARIANTS ---
const pageVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, duration: 0.4 } },
};

const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// --- SUB-COMPONENTS ---
const TechnicalLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
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
    <div className="flex items-center justify-between group py-1">
        <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                {icon}
            </div>
            <div className="flex flex-col">
                <TechnicalLabel>{label}</TechnicalLabel>
                <span className="text-xs font-bold text-slate-700 font-mono">
                    {value}
                </span>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export default function StudentDashboard() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    // 1. Fetch Student Profile
    const { data: student, isLoading: isLoadingStudent } = useQuery({
        queryKey: ['student', { id }],
        queryFn: getStudent,
    });

    // 2. Fetch Activity Sessions (Robust Population & Null Filtering)
    const {
        data: activitySessions = [],
        isFetching,
        isSuccess,
    } = useQuery({
        queryKey: [
            'activity-sessions-student',
            {
                filters: {
                    student: { id: { $eq: student?.id } },
                    actualStartAt: { $notNull: true },
                },
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!id,
        staleTime: 1000 * 30, // 30 seconds to prevent rapid flashing
    });

    console.log('test', activitySessions);
    if (isLoadingStudent) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2
                        className="animate-spin text-indigo-600"
                        size={32}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                        Loading Learner Data...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#F8FAFC] overflow-hidden flex flex-col font-sans text-slate-900">
            <Toaster position="top-right" richColors />

            {/* Background Grid */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage:
                        'linear-gradient(to bottom, black 40%, transparent 100%)',
                }}
            />

            <motion.div
                initial="hidden"
                animate="show"
                variants={pageVariants}
                className="max-w-[1600px] w-full mx-auto p-6 lg:p-8 relative z-10 flex flex-col h-full overflow-hidden gap-6"
            >
                {/* --- HEADER --- */}
                <motion.header
                    variants={itemVariants}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0"
                >
                    <div className="flex items-center gap-6">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-2xl h-12 w-12 border-slate-200 bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <Avatar className="h-16 w-16 rounded-[24px] border-4 border-white shadow-md">
                                    <AvatarFallback className="bg-slate-900 text-white font-bold text-xl">
                                        {student?.fullName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white shadow-sm" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {student?.fullName}
                                </h1>
                                <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                        <Building2 size={12} />
                                        QC Hub
                                    </span>
                                    <span className="font-mono text-indigo-600">
                                        ID: #{id.toString().padStart(4, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="h-10 px-5 rounded-xl border-slate-200 bg-white text-slate-600 font-bold text-[9px] uppercase tracking-widest"
                    >
                        <Printer size={14} className="mr-2" /> Print File
                    </Button>
                </motion.header>

                {/* --- MAIN GRID --- */}
                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                    {/* LEFT SIDEBAR */}
                    <motion.aside
                        variants={itemVariants}
                        className="col-span-12 lg:col-span-3 flex flex-col gap-6"
                    >
                        <Card className="rounded-[32px] border-slate-200 shadow-sm bg-white overflow-hidden shrink-0">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                                <TechnicalLabel>Profile</TechnicalLabel>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <IdentityRow
                                    icon={<Target size={16} />}
                                    label="Primary Goal"
                                    value="Sensory Processing"
                                />
                                <IdentityRow
                                    icon={<ShieldCheck size={16} />}
                                    label="Verification"
                                    value="Clinically Validated"
                                />
                                <IdentityRow
                                    icon={<Calendar size={16} />}
                                    label="Start Date"
                                    value="Aug 24, 2024"
                                />
                            </CardContent>
                        </Card>

                        <div className="rounded-[32px] bg-indigo-600 p-6 text-white shadow-lg relative overflow-hidden shrink-0">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap
                                    size={14}
                                    className="text-yellow-300 fill-yellow-300"
                                />
                                <TechnicalLabel className="text-white opacity-90">
                                    AI Insights
                                </TechnicalLabel>
                            </div>
                            <p className="text-xs font-medium leading-relaxed opacity-90 italic">
                                "Focus peaks in morning sessions. Consider
                                tactical tasks before 11AM."
                            </p>
                        </div>
                    </motion.aside>

                    {/* CENTER COLUMN (SCROLLABLE) */}
                    <motion.main
                        variants={itemVariants}
                        className="col-span-12 lg:col-span-6 flex flex-col gap-6 min-h-0"
                    >
                        <div className="grid grid-cols-3 gap-4 shrink-0">
                            <div className="bg-white rounded-[24px] border border-slate-200 p-4 text-center">
                                <TechnicalLabel>Avg Score</TechnicalLabel>
                                <p className="text-xl font-bold text-slate-900">
                                    94%
                                </p>
                            </div>
                            <div className="bg-white rounded-[24px] border border-slate-200 p-4 text-center">
                                <TechnicalLabel>Total Time</TechnicalLabel>
                                <p className="text-xl font-bold text-slate-900">
                                    {activitySessions.length > 0
                                        ? '12.5h'
                                        : '0h'}
                                </p>
                            </div>
                            <div className="bg-white rounded-[24px] border border-slate-200 p-4 text-center">
                                <TechnicalLabel>Focus</TechnicalLabel>
                                <p className="text-xl font-bold text-slate-900">
                                    88%
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                                <TechnicalLabel>
                                    Interaction History
                                </TechnicalLabel>
                                {isFetching && (
                                    <div
                                        className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"
                                        title="Syncing data..."
                                    />
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {/* DATA CONDITIONAL RENDER FIX */}
                                {isSuccess && activitySessions.length > 0 ? (
                                    <TimelineTrackList
                                        data={activitySessions}
                                        className="border-0 shadow-none"
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <Activity
                                            size={32}
                                            className="mb-2 opacity-50"
                                        />
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                                            No Active History
                                        </span>
                                    </div>
                                )}
                                <div className="h-10 w-full shrink-0" />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        </div>
                    </motion.main>

                    {/* RIGHT SIDEBAR */}
                    <motion.section
                        variants={itemVariants}
                        className="col-span-12 lg:col-span-3 flex flex-col gap-6"
                    >
                        <Card className="rounded-[32px] border-slate-200 shadow-sm bg-white overflow-hidden shrink-0">
                            <CardHeader className="py-4 px-6 border-b border-slate-50">
                                <TechnicalLabel>Metrics</TechnicalLabel>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span>Task Completion</span>
                                        <span>85%</span>
                                    </div>
                                    <Progress value={85} className="h-1.5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span>Social Reg</span>
                                        <span>72%</span>
                                    </div>
                                    <Progress value={72} className="h-1.5" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="rounded-[32px] border-2 border-amber-100 bg-amber-50/40 p-6 shrink-0">
                            <div className="flex items-center gap-2 mb-3 text-amber-700">
                                <MessageSquareText size={14} />
                                <TechnicalLabel className="text-amber-700">
                                    Clinical Note
                                </TechnicalLabel>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 italic">
                                "Highly engaged with audio-visual cues today."
                            </p>
                        </div>
                    </motion.section>
                </div>
            </motion.div>
        </div>
    );
}
