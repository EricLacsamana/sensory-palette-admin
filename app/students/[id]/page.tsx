'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    MapPin,
    Play,
    Building2,
    Plus,
    Star,
    LineChart,
    CheckCircle2,
    Printer,
    ChevronRight,
    Bot,
    ShieldCheck,
    MessageSquareText,
    Clock,
    TrendingUp,
    Zap,
    Calendar,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { getStudent } from '@/api/students';
import { useActivities } from '@/hooks/useActivities';
import { createActivitySession } from '@/api/acitivity-session';
import { cn } from '@/lib/utils';
import SessionPlanningModal from '@/components/SessionPlanningModal';

export default function StudentDashboard() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: learner, isLoading: isLoadingStudent } = useQuery({
        queryKey: ['student', id],
        queryFn: () => getStudent(id),
    });

    const { data: activities = [] } = useActivities();

    const { mutate: savePlan, isPending: isSaving } = useMutation({
        mutationFn: async (data: {
            plan: any[];
            date: string;
            start: string;
        }) => {
            const { plan, date, start } = data;
            let currentStartTime = new Date(`${date}T${start}:00`);
            return Promise.all(
                plan.map((item) => {
                    const startTimeISO = currentStartTime.toISOString();
                    const durationMinutes = item.duration || 30;
                    const endTime = new Date(
                        currentStartTime.getTime() + durationMinutes * 60000,
                    );
                    const payload = {
                        student: id,
                        activity: item.isBreak ? null : item.documentId,
                        activityStatus: 'started',
                        startTime: startTimeISO,
                        endTime: endTime.toISOString(),
                        durationSeconds: durationMinutes * 60,
                        teacherNotes: item.isBreak ? `Rest: ${item.name}` : '',
                    };
                    currentStartTime = endTime;
                    return createActivitySession(payload);
                }),
            );
        },
        onSuccess: () => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({
                queryKey: ['activity-sessions', id],
            });
        },
    });

    const handleConfirmSession = (data: any) => {
        const syncPromise = new Promise((resolve, reject) => {
            savePlan(data, { onSuccess: resolve, onError: reject });
        });
        toast.promise(syncPromise, {
            loading: 'Syncing...',
            success: 'Synchronized',
            error: (err: any) => 'Sync failed',
        });
    };

    const todaySchedule = [
        {
            id: 1,
            time: '09:00 AM',
            activity: 'Sensory Sand',
            status: 'completed',
        },
        { id: 2, time: '11:30 AM', activity: 'Digital Art', status: 'live' },
        {
            id: 3,
            time: '02:00 PM',
            activity: 'Memory Task',
            status: 'upcoming',
        },
    ];

    if (isLoadingStudent)
        return (
            <div className="h-screen flex items-center justify-center font-black text-indigo-600">
                LOADING...
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
            <Toaster position="top-right" richColors />

            {/* --- COMPACT HEADER --- */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-xl h-10 w-10 bg-white border-slate-200 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-md">
                            <AvatarFallback className="bg-indigo-600 text-white font-black text-lg">
                                {learner?.firstName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-[1000] text-slate-900 tracking-tight leading-none">
                                {learner?.firstName}’s Workspace
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] px-1.5 py-0 rounded-full uppercase">
                                    Live
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={12} /> Feb 2026
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="flex-1 md:flex-none h-10 px-4 rounded-xl border-slate-200 font-bold text-xs bg-white"
                    >
                        <Printer size={14} className="mr-2" /> Export
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold text-xs transition-transform active:scale-95"
                    >
                        <Plus size={16} className="mr-2 stroke-[3px]" />{' '}
                        Initialize Session
                    </Button>
                </div>
            </header>

            {/* --- MAIN GRID --- */}
            <div className="grid grid-cols-12 gap-6 items-stretch">
                {/* LEFT: IDENTITY (3/12) */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <Card className="rounded-[24px] border-none shadow-sm bg-white flex-1">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    Profile
                                </span>
                                <p className="text-lg font-black text-slate-900 leading-tight">
                                    {learner?.fullName}
                                </p>
                                <p className="text-xs font-bold text-indigo-500">
                                    {learner?.diagnosis || 'Standard Profile'}
                                </p>
                            </div>
                            <Separator className="bg-slate-50" />
                            <div className="space-y-4">
                                <IdentityRow
                                    icon={<ShieldCheck size={16} />}
                                    label="Status"
                                    value="Verified"
                                />
                                <IdentityRow
                                    icon={<MapPin size={16} />}
                                    label="Hub"
                                    value="Quezon City"
                                />
                                <IdentityRow
                                    icon={<Building2 size={16} />}
                                    label="ID"
                                    value="#2026-HQ"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[24px] bg-indigo-600 text-white border-none shadow-lg overflow-hidden relative group">
                        <CardContent className="p-6 space-y-3 relative z-10">
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest opacity-60">
                                <Zap size={12} fill="white" /> AI Recommendation
                            </div>
                            <p className="text-sm font-bold leading-tight">
                                Focus peaking.{' '}
                                <span className="text-indigo-200">
                                    Switch to tactile.
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                </aside>

                {/* CENTER: TIMELINE (6/12) */}
                <main className="col-span-12 lg:col-span-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <KPICard
                            label="Goal Progress"
                            value="66%"
                            progress={66}
                            icon={
                                <TrendingUp
                                    className="text-emerald-500"
                                    size={16}
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
                                />
                            }
                        />
                    </div>

                    <Card className="rounded-[32px] border-none shadow-sm p-8 min-h-[500px] relative bg-white">
                        <div className="flex justify-between items-center mb-10">
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                Session Timeline
                            </h4>
                            <Badge className="bg-slate-50 text-slate-400 border-none font-bold px-2 py-0 text-[9px]">
                                3 Items
                            </Badge>
                        </div>
                        <div className="absolute left-[39.5px] top-28 bottom-20 w-px bg-slate-100" />

                        <div className="space-y-8">
                            {todaySchedule.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'flex gap-6 group relative',
                                        item.status === 'completed' &&
                                            'opacity-30',
                                    )}
                                >
                                    <div className="w-12 text-[9px] font-black text-slate-400 uppercase pt-4 tracking-tighter">
                                        {item.time}
                                    </div>
                                    <div
                                        className={cn(
                                            'flex-1 p-5 rounded-2xl border transition-all flex items-center justify-between',
                                            item.status === 'live'
                                                ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100/50 scale-[1.03] z-10'
                                                : 'bg-slate-50/50 border-transparent',
                                        )}
                                    >
                                        <div className="space-y-1">
                                            <h5 className="text-base font-black text-slate-900 tracking-tight leading-none">
                                                {item.activity}
                                            </h5>
                                            <div className="flex items-center gap-1.5">
                                                {item.status === 'completed' ? (
                                                    <CheckCircle2
                                                        size={12}
                                                        className="text-emerald-500"
                                                    />
                                                ) : (
                                                    <Clock
                                                        size={12}
                                                        className="text-slate-400"
                                                    />
                                                )}
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                        {item.status === 'live' ? (
                                            <Button
                                                size="icon"
                                                className="h-10 w-10 bg-indigo-600 rounded-xl shadow-md animate-pulse"
                                            >
                                                <Play className="h-4 w-4 fill-current ml-0.5" />
                                            </Button>
                                        ) : (
                                            <ChevronRight
                                                className="text-slate-200"
                                                size={18}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </main>

                {/* RIGHT: ANALYTICS (3/12) */}
                <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <Card className="rounded-[24px] border-none shadow-sm p-6 space-y-6 bg-white flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                KPI Metrics
                            </span>
                            <LineChart className="text-indigo-400" size={14} />
                        </div>
                        <div className="space-y-3">
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

                    <Card className="rounded-[24px] border-none shadow-sm p-6 bg-white border-2 border-slate-100 border-dashed">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Handover
                            </span>
                            <MessageSquareText
                                size={14}
                                className="text-slate-200"
                            />
                        </div>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed italic border-l-2 border-indigo-400 pl-4 py-1 bg-slate-50/50 rounded-r-xl">
                            "Significant improvement in Hand-eye coordination."
                        </p>
                    </Card>
                </section>
            </div>

            <SessionPlanningModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                activities={activities}
                learnerName={learner?.firstName || 'User'}
                isSubmitting={isSaving}
                onConfirm={handleConfirmSession}
            />
        </div>
    );
}

const IdentityRow = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                {label}
            </span>
            <span className="text-xs font-black text-slate-700">{value}</span>
        </div>
    </div>
);

const KPICard = ({ label, value, progress, sub, icon }: any) => (
    <Card className="rounded-[20px] border-none shadow-sm p-5 bg-white flex-1">
        <div className="flex justify-between items-center mb-4">
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                {icon}
            </div>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                {label}
            </span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-2xl font-[1000] text-slate-900 tracking-tighter">
                {value}
            </span>
            {sub && (
                <span className="text-[9px] font-black text-emerald-500 uppercase">
                    {sub}
                </span>
            )}
        </div>
        {progress !== undefined && (
            <Progress value={progress} className="h-1.5 bg-slate-100" />
        )}
    </Card>
);

const MetricRow = ({ label, value, color }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
        <div className="flex items-center gap-3">
            <div className={cn('h-2 w-2 rounded-full', color)} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                {label}
            </span>
        </div>
        <span className="text-lg font-[1000] text-slate-900 tracking-tighter">
            {value}
        </span>
    </div>
);
