'use client';

import React, { useMemo, useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { getStudent } from '@/api/students';
import { useActivities } from '@/hooks/useActivities';
import {
    createActivitySession,
    deleteActivitySession,
    getActivitySessions,
    updateActivitySession,
} from '@/api/acitivity-session';
import { cn } from '@/lib/utils';
import SessionPlanningModal from '@/components/SessionPlanningModal/index';

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

    const { data: response } = useQuery({
        // Pattern: [Key, Search, Start, End, StudentId]
        queryKey: ['activity-sessions', '', '', '', id],

        queryFn: () => getActivitySessions({ studentId: id }),
        // enabled: !!id,
    });

    const existingSessions = useMemo(() => response?.data || [], [response]);

    const { mutateAsync: savePlanAsync, isPending: isSaving } = useMutation({
        mutationFn: async (data: {
            plan: any[];
            date: string;
            start: string;
        }) => {
            const { plan, date, start } = data;
            let currentStartTime = new Date(`${date}T${start}:00`);

            if (!plan) throw new Error('Plan data is missing');

            const currentPlanSessionIds = new Set(
                plan.map((p: any) => p.documentId || p.id).filter(Boolean),
            );
            const sessionsToDelete = existingSessions.filter((s: any) => {
                const sId = s.documentId || s.id;
                return !currentPlanSessionIds.has(sId);
            });

            const deletePromises = sessionsToDelete.map((s: any) =>
                deleteActivitySession(s.documentId || s.id),
            );

            const upsertPromises = plan.map((item) => {
                const startTimeISO = currentStartTime.toISOString();
                const durationMinutes = item.duration || 30;
                const endTime = new Date(
                    currentStartTime.getTime() + durationMinutes * 60000,
                );

                const activityId = item.isBreak
                    ? null
                    : item.activity?.documentId ||
                      item.activity?.id ||
                      item.documentId ||
                      item.id;

                const payload = {
                    student: id,
                    activity: activityId,
                    startTime: startTimeISO,
                    endTime: endTime.toISOString(),
                    durationSeconds: durationMinutes * 60,
                };

                currentStartTime = endTime;

                const isExistingSession = existingSessions.some(
                    (s: any) =>
                        (s.documentId || s.id) === (item.documentId || item.id),
                );

                if (isExistingSession) {
                    const sessionId = item.documentId || item.id;
                    return updateActivitySession(sessionId, payload);
                } else {
                    return createActivitySession(payload);
                }
            });

            return Promise.all([...deletePromises, ...upsertPromises]);
        },
        onSuccess: () => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['activity-sessions'] });
            toast.success('Schedule Synchronized');
        },
        onError: (error) => {
            console.error('Sync Error:', error);
            toast.error('Failed to sync changes');
        },
    });
    const handleConfirmSession = (data: any) => {
        const syncPromise = savePlanAsync(data);

        toast.promise(syncPromise, {
            loading: 'Syncing session plan...',
            success: 'Session Plan Synchronized',
            error: (err) =>
                `Sync failed: ${err.message || 'Check console for details'}`,
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
            <div className="h-screen flex items-center justify-center font-semibold text-indigo-600">
                LOADING...
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
            <Toaster position="top-right" richColors />

            <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-xl h-10 w-10 bg-white border-slate-200 shadow-sm"
                    >
                        <ArrowLeft size={18} strokeWidth={1.5} />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-md">
                            <AvatarFallback className="bg-indigo-600 text-white font-semibold text-lg">
                                {learner?.fullName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                                {learner?.fullName}’s Workspace
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-emerald-500 text-white border-none font-semibold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Live
                                </Badge>
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={12} strokeWidth={1.5} /> Feb
                                    2026
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="flex-1 md:flex-none h-10 px-4 rounded-xl border-slate-200 font-semibold text-xs bg-white text-slate-600"
                    >
                        <Printer size={14} strokeWidth={1.5} className="mr-2" />{' '}
                        Export
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-semibold text-xs transition-transform active:scale-95"
                    >
                        <Plus size={16} strokeWidth={2} className="mr-2" />{' '}
                        Initialize Session
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6 items-stretch">
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <Card className="rounded-[24px] border border-slate-200/60 shadow-sm bg-white flex-1">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-0.5">
                                    Profile
                                </span>
                                <p className="text-lg font-semibold text-slate-900 leading-tight">
                                    {learner?.fullName}
                                </p>
                                <p className="text-xs font-medium text-indigo-500">
                                    {learner?.diagnosis || 'Standard Profile'}
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
                                    value="#2026-HQ"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[24px] bg-indigo-600 text-white border-none shadow-lg overflow-hidden relative group">
                        <CardContent className="p-6 space-y-3 relative z-10">
                            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest opacity-80">
                                <Zap size={12} fill="white" strokeWidth={1.5} />{' '}
                                AI Recommendation
                            </div>
                            <p className="text-sm font-medium leading-tight">
                                Focus peaking.{' '}
                                <span className="text-indigo-200">
                                    Switch to tactile.
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                </aside>

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

                    <Card className="rounded-[32px] border border-slate-200/60 shadow-sm p-6 relative bg-white overflow-hidden">
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                                Session Timeline
                            </h4>
                            <Badge className="bg-slate-50 text-slate-500 border border-slate-100 font-semibold px-2 py-0.5 text-[9px]">
                                {todaySchedule.length} Items
                            </Badge>
                        </div>

                        <div className="absolute left-[110px] top-0 bottom-0 w-px bg-slate-200 z-0" />

                        <div className="space-y-4 relative z-10">
                            {todaySchedule.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'relative flex gap-12 group',
                                        item.status === 'completed' &&
                                            'opacity-50',
                                    )}
                                >
                                    <div className="w-16 pt-1 flex flex-col items-end shrink-0">
                                        <span className="text-[11px] font-semibold text-slate-900 tabular-nums">
                                            {item.time.split(' ')[0]}
                                        </span>
                                        <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter">
                                            {item.time.split(' ')[1]}
                                        </span>
                                    </div>

                                    <div
                                        className={cn(
                                            'absolute left-[73px] top-2.5 h-3 w-3 rounded-full border-2 bg-white z-20 shadow-sm transition-all duration-300',
                                            item.status === 'live'
                                                ? 'border-indigo-600 scale-125 bg-indigo-600'
                                                : 'border-slate-300 group-hover:border-indigo-400',
                                        )}
                                    />

                                    <div
                                        className={cn(
                                            'flex-1 p-3 rounded-[20px] border transition-all duration-300 flex items-center justify-between',
                                            item.status === 'live'
                                                ? 'bg-white border-indigo-500 shadow-md scale-[1.01] z-10'
                                                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-white',
                                        )}
                                    >
                                        <div className="space-y-1 flex flex-col">
                                            <h5 className="text-[13px] font-semibold text-slate-900 tracking-tight leading-none">
                                                {item.activity}
                                            </h5>
                                            <div className="flex items-center gap-2">
                                                {item.status === 'completed' ? (
                                                    <span className="text-[8px] font-semibold text-emerald-600 uppercase tracking-tight">
                                                        Finished
                                                    </span>
                                                ) : item.status === 'live' ? (
                                                    <div className="flex items-center gap-1 text-indigo-600 text-[8px] font-semibold uppercase tracking-tight">
                                                        <div className="h-1 w-1 rounded-full bg-indigo-600 animate-pulse" />{' '}
                                                        In Progress
                                                    </div>
                                                ) : (
                                                    <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-tight">
                                                        Upcoming
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {item.status === 'live' ? (
                                            <Button
                                                size="icon"
                                                className="h-7 w-7 bg-indigo-600 rounded-lg shadow-sm"
                                            >
                                                <Play className="h-2.5 w-2.5 fill-current text-white" />
                                            </Button>
                                        ) : (
                                            <ChevronRight
                                                size={14}
                                                className="text-slate-300"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </main>

                <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
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
                                Handover
                            </span>
                            <MessageSquareText
                                size={14}
                                className="text-slate-300"
                                strokeWidth={1.5}
                            />
                        </div>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed italic border-l-2 border-indigo-500/50 pl-4 py-1.5 bg-slate-50/50 rounded-r-xl">
                            "Significant improvement in Hand-eye coordination."
                        </p>
                    </Card>
                </section>
            </div>

            <SessionPlanningModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                activities={activities}
                student={learner}
                isSubmitting={isSaving}
                activitySessions={existingSessions}
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
            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest ml-0.5">
                {label}
            </span>
            <span className="text-xs font-semibold text-slate-700">
                {value}
            </span>
        </div>
    </div>
);

const KPICard = ({ label, value, progress, sub, icon }: any) => (
    <Card className="rounded-[20px] border border-slate-200/60 shadow-sm p-4 bg-white flex-1">
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

const MetricRow = ({ label, value, color }: any) => (
    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100">
        <div className="flex items-center gap-3">
            <div className={cn('h-1.5 w-1.5 rounded-full', color)} />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                {label}
            </span>
        </div>
        <span className="text-lg font-semibold text-slate-900 tracking-tighter">
            {value}
        </span>
    </div>
);
