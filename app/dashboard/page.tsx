'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { isSameDay, parseISO } from 'date-fns';
import {
    Users,
    Presentation,
    CheckCircle2,
    TrendingUp,
    Sparkles,
    LayoutDashboard,
    Calendar as CalendarIcon,
    ArrowRight,
    ArrowUpRight,
} from 'lucide-react';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { me } from '@/api/users';
import { getActivitySessions } from '@/api/acitivity-session';
import { cn } from '@/lib/utils';
import { LargeActivityCalendar } from '@/components/LargeActivityCalendar';
import { ScheduleAgenda } from '@/components/ScheduleAgenda';
import ActivitySessionModal from '@/components/ActivitySessionModal';

export default function Dashboard() {
    const router = useRouter();
    const [selectedSessionData, setSelectedSessionData] = useState<{
        primary: any;
        allDay: any[];
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: me });
    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['activity-sessions'],
        queryFn: getActivitySessions,
    });

    const handleViewSession = (session: any, dayActivities: any[]) => {
        setSelectedSessionData({
            primary: session,
            allDay: dayActivities,
        });
        setIsModalOpen(true);
    };

    /**
     * --- THE LAUNCHER ---
     * Redirects to: /activity-session/:documentId
     */
    const handleLaunchGame = (session: any) => {
        setIsSheetOpen(false);
        setIsModalOpen(false);

        const documentId = session.documentId || session.id;

        if (documentId) {
            router.push(`/activity-session/${documentId}`);
        }
    };

    if (isLoading) return <DashboardSkeleton />;

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-[0.25em]">
                        <LayoutDashboard size={12} strokeWidth={3} />
                        Workspace Hub
                    </div>
                    <h1 className="text-3xl font-[1000] tracking-tight text-slate-900 leading-none">
                        Hello, {user?.firstName || 'Therapist'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-11 px-8 font-bold text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95">
                                <Sparkles className="mr-2 h-4 w-4" /> View
                                Agenda
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-full sm:max-w-[420px] p-0 border-none bg-transparent shadow-none h-full"
                        >
                            <SheetHeader className="absolute opacity-0 pointer-events-none">
                                <SheetTitle>Daily Agenda</SheetTitle>
                                <SheetDescription>
                                    Schedule for learners.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="h-full flex flex-col p-4">
                                <ScheduleAgenda
                                    sessions={sessions}
                                    onSessionClick={handleViewSession}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            {/* --- STATS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Sessions"
                    value={sessions.length}
                    icon={<Presentation />}
                    color="text-indigo-600 bg-indigo-50"
                />
                <StatCard
                    title="Avg. Accuracy"
                    value="84%"
                    icon={<CheckCircle2 />}
                    color="text-emerald-600 bg-emerald-50"
                />
                <StatCard
                    title="Play Time"
                    value="320m"
                    icon={<TrendingUp />}
                    color="text-orange-600 bg-orange-50"
                />
                <StatCard
                    title="Learners"
                    value="12"
                    icon={<Users />}
                    color="text-slate-600 bg-slate-100"
                />
            </div>

            {/* --- CALENDAR --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-[1000] text-slate-900 tracking-tight flex items-center gap-2 px-1">
                    <CalendarIcon size={18} className="text-indigo-500" />{' '}
                    Session Calendar
                </h2>
                <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden p-1.5">
                    <LargeActivityCalendar sessions={sessions} />
                </Card>
            </section>

            {selectedSessionData && (
                <ActivitySessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    learnerName={`${selectedSessionData.primary.student?.firstName} ${selectedSessionData.primary.student?.lastName}`}
                    existingSession={selectedSessionData.primary}
                    activities={selectedSessionData.allDay}
                    onLaunchActivity={handleLaunchGame}
                    onLaunchFullSession={(all: any[]) =>
                        handleLaunchGame(all[0])
                    }
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <Card className="border-none shadow-sm rounded-[24px] bg-white p-5 flex items-center gap-4 group">
            <div
                className={cn(
                    'h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                    color,
                )}
            >
                {React.cloneElement(icon as React.ReactElement, { size: 20 })}
            </div>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                    {title}
                </p>
                <span className="text-2xl font-[1000] text-slate-900 leading-none">
                    {value}
                </span>
            </div>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-24 rounded-[24px]" />
            </div>
        </div>
    );
}
