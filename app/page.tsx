'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Presentation,
    TrendingUp,
    Sparkles,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Activity as ActivityIcon,
    ChevronDown,
    Bell,
    Clock,
    Zap,
    CalendarDays,
    Target,
    SmilePlus,
    UserCircle,
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

import { ScheduleAgenda } from '@/components/ScheduleAgenda';
import ActivitySessionModal from '@/components/ActivitySessionModal';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { ActivitySessionLogsTable } from '@/components/ActivitySessionLogs';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FormatService } from '@/utils/helpers';

export default function Dashboard() {
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeSection, setActiveSection] = useState(0);

    const [selectedSessionData, setSelectedSessionData] = useState<{
        primary: ActivitySessionResponse;
        allDay: ActivitySessionResponse[];
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: me });

    const { data: activitySessions, isFetching } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                // For DateTime: "2026-02-10T11:50:31.000Z"
                // For Date only: "2026-02-10"
                startAt: new Date().toISOString().split('T')[0],
            },
        ],
        queryFn: getActivitySessions,
    });

    // --- NAVIGATION LOGIC ---
    const scrollToSection = (index: number) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const sectionHeight = container.offsetHeight;
            container.scrollTo({
                top: index * sectionHeight,
                behavior: 'smooth',
            });
            setActiveSection(index);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const top = e.currentTarget.scrollTop;
        const height = e.currentTarget.offsetHeight;
        const index = Math.round(top / height);
        if (index !== activeSection) setActiveSection(index);
    };

    const handleViewSession = (
        session: ActivitySessionResponse,
        dayActivities: ActivitySessionResponse[],
    ) => {
        setSelectedSessionData({ primary: session, allDay: dayActivities });
        setIsModalOpen(true);
    };

    const handleLaunchGame = (session: ActivitySessionResponse) => {
        setIsSheetOpen(false);
        setIsModalOpen(false);
        const documentId = session.documentId || session.id;
        if (documentId) router.push(`/activity-session/${documentId}`);
    };

    if (isFetching) return <DashboardSkeleton />;

    return (
        <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-[#FDFDFF]">
            {/* --- NAVIGATION DOTS --- */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
                {[0, 1, 2].map((idx) => (
                    <button
                        key={idx}
                        onClick={() => scrollToSection(idx)}
                        className={cn(
                            'group relative flex items-center justify-center transition-all duration-500',
                            activeSection === idx ? 'h-8' : 'h-3',
                        )}
                    >
                        <span
                            className={cn(
                                'w-1.5 rounded-full transition-all duration-500',
                                activeSection === idx
                                    ? 'h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                                    : 'h-1.5 bg-slate-200 group-hover:bg-indigo-300',
                            )}
                        />
                        <span className="absolute right-6 px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                            {idx === 0
                                ? 'Overview'
                                : idx === 1
                                  ? 'Calendar'
                                  : 'Activity Logs'}
                        </span>
                    </button>
                ))}
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar"
            >
                {/* --- SECTION 1: OVERVIEW --- */}
                <section className="h-full snap-start snap-always p-6 lg:p-12 flex flex-col min-h-0">
                    <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 shrink-0">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[10px] uppercase tracking-[0.2em] ml-0.5">
                                <Zap size={14} className="fill-indigo-600" />
                                Smart Dashboard
                            </div>
                            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 leading-none">
                                Good day, {user?.firstName || 'Therapist'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => scrollToSection(1)}
                                className="rounded-xl h-12 w-12 p-0 border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
                            >
                                <CalendarDays size={18} strokeWidth={1.5} />
                            </Button>
                            <Sheet
                                open={isSheetOpen}
                                onOpenChange={setIsSheetOpen}
                            >
                                <SheetTrigger asChild>
                                    <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-semibold text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Launch Agenda
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className="w-full sm:max-w-[480px] p-0 border-none bg-transparent shadow-none h-full"
                                >
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Daily Agenda</SheetTitle>
                                        <SheetDescription>
                                            Clinical schedule overview
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="h-full flex flex-col p-4">
                                        <ScheduleAgenda
                                            sessions={activitySessions}
                                            onSessionClick={handleViewSession}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </header>

                    <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                        <div className="col-span-8 grid grid-cols-2 gap-6 content-start">
                            <StatCard
                                title="Active Sessions"
                                value={activitySessions.length}
                                trend="+12%"
                                icon={<Presentation />}
                                color="text-indigo-600 bg-indigo-50/50"
                            />
                            <StatCard
                                title="Avg. Accuracy"
                                value="84%"
                                trend="+2.4%"
                                icon={<Target />}
                                color="text-emerald-600 bg-emerald-50/50"
                            />
                            <StatCard
                                title="Session Minutes"
                                value="320m"
                                trend="+45m"
                                icon={<TrendingUp />}
                                color="text-orange-600 bg-orange-50/50"
                            />
                            <StatCard
                                title="Learner Reach"
                                value="12"
                                trend="Stable"
                                icon={<SmilePlus />}
                                color="text-slate-600 bg-slate-100/50"
                            />
                        </div>

                        <div className="col-span-4 flex flex-col">
                            <Card className="flex-1 rounded-[32px] border border-slate-200/60 bg-white shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Clock size={14} /> Live Feed
                                    </h3>
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                                    {activitySessions
                                        .slice(0, 4)
                                        .map(
                                            (
                                                session: ActivitySessionResponse,
                                                i: number,
                                            ) => (
                                                <div
                                                    key={session.documentId}
                                                    className="flex gap-4 group"
                                                >
                                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center text-indigo-500 font-semibold text-xs">
                                                        {
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={FormatService.formatStrapiMedia(
                                                                    session
                                                                        .activity
                                                                        .banner,
                                                                    'thumbnail',
                                                                )}
                                                                className="h-full w-full object-cover pointer-events-none"
                                                                alt="profile-picture"
                                                            />
                                                        }
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-slate-900 leading-tight">
                                                            Session log
                                                            generated
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight opacity-70">
                                                            Recently •{' '}
                                                            {
                                                                session.activity
                                                                    .name
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                </div>
                                <div className="p-4 mt-auto border-t border-slate-50 bg-slate-50/50">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-[10px] font-semibold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                                    >
                                        View All Activity
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* --- SECTION 2: CALENDAR --- */}
                <section className="h-full snap-start snap-always p-6 lg:p-12 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-8 shrink-0">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                                <CalendarIcon
                                    size={24}
                                    className="text-indigo-500 stroke-[1.5px]"
                                />
                                Session Schedule
                            </h2>
                            <p className="text-sm text-slate-500 font-medium ml-9">
                                Review clinical timeline
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-xs font-semibold text-indigo-600 gap-1 hover:bg-indigo-50 px-5 h-11 rounded-xl border border-indigo-100"
                        >
                            Full View <ArrowUpRight size={14} />
                        </Button>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                        <ActivityCalendar />
                    </div>
                </section>

                {/* --- SECTION 3: RECENT LOGS --- */}
                <section className="h-full snap-start snap-always p-6 lg:p-12 flex flex-col justify-center">
                    <div className="space-y-6 w-full max-w-[1500px] mx-auto h-full flex flex-col">
                        <div className="flex items-center justify-between px-1 shrink-0">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                                    <ActivityIcon
                                        size={24}
                                        className="text-emerald-500 stroke-[1.5px]"
                                    />
                                    Recent Activity Logs
                                </h2>
                                <p className="text-sm text-slate-500 font-medium ml-9">
                                    Performance metrics for active learners
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.push('/activity-sessions')
                                }
                                className="text-xs font-semibold text-slate-600 gap-2 border-slate-200 hover:bg-slate-50 px-5 h-10 rounded-xl"
                            >
                                View Full Log <ArrowUpRight size={14} />
                            </Button>
                        </div>

                        <Card className="flex-1 min-h-0 rounded-[32px] border border-slate-200/60 bg-white overflow-hidden p-2 flex flex-col shadow-sm">
                            <ActivitySessionLogsTable data={activitySessions} />
                        </Card>
                    </div>
                </section>
            </div>

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

function StatCard({ title, value, trend, icon, color }: any) {
    return (
        <Card className="border border-slate-200/60 shadow-sm rounded-[32px] bg-white p-8 flex flex-col gap-6 group hover:border-indigo-200 hover:shadow-xl transition-all duration-500">
            <div className="flex justify-between items-start">
                <div
                    className={cn(
                        'h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm',
                        color,
                    )}
                >
                    {React.cloneElement(icon as React.ReactElement, {
                        size: 24,
                        strokeWidth: 1.5,
                    })}
                </div>
                {trend && (
                    <span
                        className={cn(
                            'text-[11px] font-semibold px-3 py-1 rounded-full',
                            trend.startsWith('+')
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-500 bg-slate-50',
                        )}
                    >
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 leading-none mb-3 opacity-80">
                    {title}
                </p>
                <span className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">
                    {value}
                </span>
            </div>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-10 space-y-10 animate-pulse h-screen bg-[#FDFDFF] flex flex-col">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <div className="grid grid-cols-4 gap-6">
                <Skeleton className="h-44 rounded-[32px]" />
                <Skeleton className="h-44 rounded-[32px]" />
                <Skeleton className="h-44 rounded-[32px]" />
                <Skeleton className="h-44 rounded-[32px]" />
            </div>
            <Skeleton className="flex-1 rounded-[40px] mt-10" />
        </div>
    );
}
