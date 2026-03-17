'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    Activity,
    Radio,
    Power,
    Eye,
    Sparkles,
    UserCircle2,
    Users,
    Gamepad2,
    CheckCircle2,
    AlertTriangle,
    Ban,
    Clock,
    ShieldCheck,
    RefreshCcw,
    Download,
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    Stethoscope,
    GraduationCap,
    LayoutGrid,
    Search,
    Filter,
    Settings,
    Target,
    ShieldAlert,
    LineChart as LineChartIcon,
    BarChart as BarChartIcon,
} from 'lucide-react';
import axios from 'axios';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

// API & State
import { getUsers, me } from '@/api/users';
import { RootState } from '@/redux/store';
import {
    getActivitySessionsNew,
    updateActivitySession,
} from '@/api/activity-session';
import { getActivities } from '@/api/activity';

// UI Components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import {
    ActivitySessionEntry,
    ActivitySessionResponse,
    ActivitySessionStatus,
} from '@/types/activitiy-session';

// --- Animation Variants ---
const fadeVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', bounce: 0, duration: 0.3 },
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        interrupted: 'bg-rose-50 text-rose-700 border-rose-200',
        abandoned: 'bg-rose-100 text-rose-700 border-rose-200',
        cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
        reschedule: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return (
        <span
            className={cn(
                'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                styles[status] || styles.pending,
            )}
        >
            {status.replace('_', ' ')}
        </span>
    );
};

// --- Custom Chart Tooltips ---
const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg">
                <p className="text-xs font-bold text-slate-900 mb-2">
                    {payload[0].payload.fullDisplay}
                </p>
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-4 text-[11px] font-medium mb-1 last:mb-0"
                    >
                        <div className="flex items-center gap-1.5">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor:
                                        entry.color || entry.payload.fill,
                                }}
                            />
                            <span className="text-slate-600">
                                {entry.name}:
                            </span>
                        </div>
                        <span className="font-bold text-slate-900">
                            {entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-lg">
                <p className="text-[11px] font-bold text-slate-900 mb-1">
                    {payload[0].payload.name}
                </p>
                <div className="flex items-center justify-between gap-3 text-[10px] font-medium">
                    <span className="text-slate-500">Total Uses:</span>
                    <span className="font-black text-indigo-600">
                        {payload[0].value}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function AppAdminDashboard() {
    const { token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth,
    );

    // --- STATE FOR MONTHLY CALENDAR ---
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d;
    });

    // --- STATE FOR TERMINATION MODAL ---
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
    const [isTerminating, setIsTerminating] = useState(false);

    const handlePrevMonth = () => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    // --- QUERIES ---
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['me'],
        queryFn: me,
        enabled: isAuthenticated && !!token,
    });

    const {
        data: sessions = [],
        refetch: refetchSessions,
        isLoading: isSessionsLoading,
        isFetching: isSessionsFetching,
    } = useQuery({
        queryKey: [
            'admin-sessions',
            {
                sort: ['updatedAt:desc'],
                pagination: { limit: 1000 },
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                    therapist: { populate: '*' },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!token && isAuthenticated,
        refetchInterval: 3000,
    });

    const { data: activities = [] } = useQuery({
        queryKey: [
            'activities',
            {
                pagination: { limit: 100 },
                populate: ['categories'],
            },
        ],
        queryFn: getActivities,
        enabled: !!token && isAuthenticated,
    });

    const { data: platformUsers = [] } = useQuery({
        queryKey: ['users', { populate: '*' }],
        queryFn: getUsers,
        enabled: !!token && isAuthenticated,
    });

    // --- SENSIBLE METRICS PROCESSING ---
    const metrics = useMemo(() => {
        const liveSessions = sessions.filter(
            (s: any) => s.activitySessionStatus === 'in_progress',
        );
        const historicalSessions = sessions.filter(
            (s: any) => s.activitySessionStatus !== 'in_progress',
        );

        const therapists = platformUsers.filter(
            (u: any) => u.role?.name === 'Therapist',
        );
        const students = platformUsers.filter(
            (u: any) => u.role?.name === 'Student' || u.role?.name === 'User',
        );

        const activeActivities = activities.filter(
            (a: any) => a.activityStatus === 'active',
        ).length;
        const disabledActivities = activities.filter(
            (a: any) => a.activityStatus === 'disabled',
        ).length;

        const interruptedCount = historicalSessions.filter((s: any) =>
            ['interrupted', 'abandoned'].includes(s.activitySessionStatus),
        ).length;

        // --- 1. AREA CHART: REAL MONTHLY DATA ---
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthDays = Array.from({ length: daysInMonth }).map((_, i) => {
            const d = new Date(year, month, i + 1);
            const localYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            return {
                fullDate: localYMD,
                shortDisplay: String(d.getDate()),
                fullDisplay: d.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            };
        });

        const trendData = monthDays.map((dayObj) => {
            const sessionsOnDay = sessions.filter((s: any) => {
                const targetDate = s.createdAt || s.startAt;
                if (!targetDate) return false;
                return (
                    new Date(targetDate).toISOString().split('T')[0] ===
                    dayObj.fullDate
                );
            });

            const completed = sessionsOnDay.filter(
                (s: any) => s.activitySessionStatus === 'completed',
            ).length;
            const dropped = sessionsOnDay.filter((s: any) =>
                ['interrupted', 'abandoned', 'cancelled'].includes(
                    s.activitySessionStatus,
                ),
            ).length;
            const activeOrPending = sessionsOnDay.filter((s: any) =>
                ['pending', 'in_progress', 'reschedule'].includes(
                    s.activitySessionStatus,
                ),
            ).length;

            return {
                name: dayObj.shortDisplay,
                fullDisplay: dayObj.fullDisplay,
                Completed: completed,
                Dropped: dropped,
                Pending: activeOrPending,
            };
        });

        // --- 2. BAR CHART: TOP 5 ACTIVITIES ---
        const activityCounts = sessions.reduce((acc: any, s: any) => {
            const name = s.activity?.name || 'Manual Session';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});

        const topActivities = Object.entries(activityCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 5);

        return {
            liveSessions,
            historicalSessions,
            therapistsCount: therapists.length,
            studentsCount: students.length,
            activeActivities,
            disabledActivities,
            interruptedCount,
            trendData,
            topActivities,
        };
    }, [sessions, platformUsers, activities, currentDate]);

    // --- TERMINATE ALL LOGIC ---
    const handleTerminateAll = async () => {
        if (metrics.liveSessions.length === 0) {
            setIsTerminateModalOpen(false);
            return;
        }

        setIsTerminating(true);

        const terminationTime = new Date().toISOString();

        try {
            await Promise.all(
                metrics.liveSessions.map((session: any) => {
                    const targetId = session.documentId || session.id;

                    // Pass the properties directly (no 'data' wrapper!)
                    return updateActivitySession(targetId, {
                        activitySessionStatus:
                            ActivitySessionStatus.Interrupted,
                        actualEndAt: terminationTime,
                    });
                }),
            );

            await refetchSessions();
            setIsTerminateModalOpen(false);
        } catch (error) {
            console.error('Failed to terminate sessions:', error);
        } finally {
            setIsTerminating(false);
        }
    };

    if (isUserLoading)
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Loading Dashboard
                </span>
            </div>
        );

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 pb-12 relative">
            {/* --- TOP NAVIGATION --- */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                        <ShieldCheck className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                            Platform Dashboard
                        </h1>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            Therapy & Session Administration
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        className="h-10 gap-2 border-slate-200 text-sm font-bold shadow-sm text-slate-600 w-36 transition-all duration-300"
                        onClick={() => refetchSessions()}
                        disabled={isSessionsFetching}
                    >
                        <RefreshCcw
                            size={14}
                            className={cn(
                                isSessionsFetching &&
                                    'animate-spin text-indigo-500',
                            )}
                        />
                        {isSessionsFetching ? 'Syncing...' : 'Sync Data'}
                    </Button>
                </div>
            </header>
            <main className="max-w-[1600px] mx-auto p-4 lg:p-6 xl:p-8 space-y-6 lg:space-y-8 pb-24">
                {/* --- 1. PLATFORM OVERVIEW KPIs --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
                    <Card className="bg-white border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                                Therapists
                            </p>
                            <h2 className="text-2xl font-black text-slate-900">
                                {metrics.therapistsCount}
                            </h2>
                        </div>
                    </Card>
                    <Card className="bg-white border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                                Students
                            </p>
                            <h2 className="text-2xl font-black text-slate-900">
                                {metrics.studentsCount}
                            </h2>
                        </div>
                    </Card>
                    <Card className="bg-white border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                                Active Content
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-2xl font-black text-slate-900 leading-none">
                                    {metrics.activeActivities}
                                </h2>
                                <span className="text-xs font-bold text-slate-400">
                                    Deployed
                                </span>
                            </div>
                        </div>
                    </Card>
                    <Card
                        className={cn(
                            'p-5 rounded-[20px] shadow-sm flex items-center gap-4 transition-all duration-500 border hover:shadow-md',
                            metrics.liveSessions.length > 0
                                ? 'bg-emerald-50/20 border-emerald-100 shadow-emerald-100/20'
                                : 'bg-slate-50 border-slate-200',
                        )}
                    >
                        <div
                            className={cn(
                                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors duration-500',
                                metrics.liveSessions.length > 0
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-slate-200 text-slate-400',
                            )}
                        >
                            <Radio
                                size={24}
                                className={cn(
                                    metrics.liveSessions.length > 0
                                        ? 'animate-pulse'
                                        : 'opacity-50',
                                )}
                            />
                        </div>
                        <div>
                            <p
                                className={cn(
                                    'text-[10px] font-bold uppercase tracking-widest mb-0.5 transition-colors duration-500',
                                    metrics.liveSessions.length > 0
                                        ? 'text-emerald-600'
                                        : 'text-slate-500',
                                )}
                            >
                                Live Activity
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h2
                                    className={cn(
                                        'text-2xl font-black leading-none transition-colors duration-500',
                                        metrics.liveSessions.length > 0
                                            ? 'text-emerald-700'
                                            : 'text-slate-400',
                                    )}
                                >
                                    {metrics.liveSessions.length}
                                </h2>
                                <span
                                    className={cn(
                                        'text-[10px] font-black uppercase transition-colors duration-500',
                                        metrics.liveSessions.length > 0
                                            ? 'text-emerald-500'
                                            : 'text-slate-400',
                                    )}
                                >
                                    {metrics.liveSessions.length > 0
                                        ? 'Online'
                                        : 'Idle'}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- 2. ANALYTICS (AREA & BAR CHARTS) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
                    {/* Area Chart: Session Volume (Spans 2 columns) */}
                    <Card className="lg:col-span-2 bg-white border-slate-200 p-6 rounded-[24px] shadow-sm h-[400px] flex flex-col">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 shrink-0 gap-4">
                            <div>
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <LineChartIcon
                                        size={18}
                                        className="text-indigo-600"
                                    />{' '}
                                    Session Analytics
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    Activity statuses categorized by month.
                                </p>
                            </div>

                            {/* SHORTER CALENDAR TOOLBAR */}
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg shadow-none"
                                    onClick={handlePrevMonth}
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-800 justify-center min-w-[100px]">
                                    <CalendarDays
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    {currentDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg shadow-none"
                                    onClick={handleNextMonth}
                                    disabled={
                                        currentDate.getMonth() >=
                                            new Date().getMonth() &&
                                        currentDate.getFullYear() >=
                                            new Date().getFullYear()
                                    }
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={metrics.trendData}
                                    margin={{
                                        top: 5,
                                        right: 0,
                                        left: -20,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorCompleted"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#10b981"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#10b981"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="colorPending"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#f59e0b"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#f59e0b"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="colorDropped"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#f43f5e"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#f43f5e"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f1f5f9"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        minTickGap={10}
                                        tick={{
                                            fontSize: 10,
                                            fill: '#64748b',
                                            fontWeight: 600,
                                        }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                        tick={{
                                            fontSize: 10,
                                            fill: '#64748b',
                                            fontWeight: 600,
                                        }}
                                    />
                                    <RechartsTooltip
                                        content={<CustomAreaTooltip />}
                                    />

                                    <Area
                                        type="monotone"
                                        name="Completed"
                                        dataKey="Completed"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCompleted)"
                                    />
                                    <Area
                                        type="monotone"
                                        name="Pending/Active"
                                        dataKey="Pending"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorPending)"
                                    />
                                    <Area
                                        type="monotone"
                                        name="Dropped/Cancelled"
                                        dataKey="Dropped"
                                        stroke="#f43f5e"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorDropped)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* TOP 5 BAR CHART (Spans 1 column) */}
                    <Card className="lg:col-span-1 bg-white border-slate-200 p-6 rounded-[24px] shadow-sm h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <BarChartIcon
                                        size={18}
                                        className="text-indigo-500"
                                    />{' '}
                                    Top 5 Activities
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    Most heavily utilized content.
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 w-full">
                            {metrics.topActivities.length === 0 ? (
                                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                                    <Gamepad2
                                        size={32}
                                        className="mb-2 opacity-50"
                                    />
                                    <span className="text-xs font-bold">
                                        No Data Available
                                    </span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={metrics.topActivities}
                                        layout="vertical"
                                        margin={{
                                            top: 0,
                                            right: 20,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            stroke="#f1f5f9"
                                        />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={100}
                                            tick={{
                                                fontSize: 10,
                                                fill: '#475569',
                                                fontWeight: 600,
                                            }}
                                        />
                                        <RechartsTooltip
                                            content={
                                                <CustomBarTooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                />
                                            }
                                        />
                                        <Bar
                                            dataKey="count"
                                            barSize={24}
                                            radius={[0, 4, 4, 0]}
                                        >
                                            {metrics.topActivities.map(
                                                (entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            index === 0
                                                                ? '#4f46e5'
                                                                : '#818cf8'
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </div>

                {/* --- 3. LIVE SESSIONS & LOGS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 h-[600px]">
                    {/* LEFT: Recent Historical Sessions (Spans 2 cols) */}
                    <Card className="lg:col-span-2 flex flex-col bg-white border-slate-200 rounded-[24px] shadow-sm overflow-hidden h-full">
                        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center border border-slate-200">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-sm">
                                        Recent Session History
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                        Completed, Abandoned, and Pending AI
                                        Reviews.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-48">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        size={14}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 text-slate-600 rounded-lg border-slate-200 bg-white shadow-sm"
                                >
                                    <Filter size={12} /> Filter
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3.5 font-black text-[10px] uppercase tracking-widest text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-5 py-3.5  font-black text-[10px] uppercase tracking-widest text-slate-500">
                                            Student & Therapist
                                        </th>
                                        <th className="px-5 py-3.5 font-black text-[10px] uppercase tracking-widest text-slate-500">
                                            Activity & Score
                                        </th>
                                        <th className="px-5 py-3.5 font-black text-[10px] uppercase tracking-widest text-slate-500">
                                            AI Intelligence
                                        </th>
                                        <th className="px-5 py-3.5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">
                                            Details
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {metrics.historicalSessions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="p-8 text-center text-slate-500 text-sm"
                                            >
                                                No historical sessions
                                                available.
                                            </td>
                                        </tr>
                                    ) : (
                                        metrics.historicalSessions.map(
                                            (session: any) => (
                                                <tr
                                                    key={session.id}
                                                    className="hover:bg-slate-50 transition-colors group"
                                                >
                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            status={
                                                                session.activitySessionStatus
                                                            }
                                                        />
                                                        <div className="font-mono text-[10px] text-slate-400 mt-1.5 font-medium">
                                                            {new Date(
                                                                session.updatedAt,
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-slate-900 text-sm">
                                                            {
                                                                session.student
                                                                    ?.firstName
                                                            }{' '}
                                                            {
                                                                session.student
                                                                    ?.lastName
                                                            }
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                                                            <Stethoscope
                                                                size={10}
                                                            />{' '}
                                                            Therapist: {''}
                                                            {`${
                                                                session
                                                                    .therapist
                                                                    ?.firstName
                                                            } ${
                                                                session
                                                                    .therapist
                                                                    ?.lastName
                                                            }` || 'None'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-medium text-slate-800 text-sm flex items-center gap-1.5">
                                                            <LayoutGrid
                                                                size={12}
                                                                className="text-indigo-400"
                                                            />{' '}
                                                            {session.activity
                                                                ?.name ||
                                                                'Manual Session'}
                                                        </div>
                                                        {session.score !==
                                                            null && (
                                                            <div className="text-[10px] font-black text-indigo-700 mt-1.5 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md w-max uppercase tracking-widest">
                                                                Score:{' '}
                                                                {session.score}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {session.aiRecommendation ? (
                                                            <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max">
                                                                <Sparkles
                                                                    size={12}
                                                                    className="text-purple-500"
                                                                />{' '}
                                                                Insight Gen.
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                Pending/None
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3"
                                                        >
                                                            Review
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* RIGHT: LIVE SESSIONS & PLATFORM TOOLS (Spans 1 Col) */}
                    <div className="flex flex-col gap-6 lg:col-span-1 h-full">
                        {/* Shrinked Live Sessions Card */}
                        <Card className="bg-white rounded-[24px] shadow-sm border border-slate-200 h-[400px] flex flex-col overflow-hidden relative">
                            {/* Header with Dynamic Badge */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            'h-8 w-8 rounded-lg flex items-center justify-center transition-colors shadow-sm',
                                            metrics.liveSessions.length > 0
                                                ? 'bg-indigo-600 shadow-indigo-100'
                                                : 'bg-slate-200',
                                        )}
                                    >
                                        <Radio
                                            size={16}
                                            className={cn(
                                                'text-white',
                                                metrics.liveSessions.length >
                                                    0 && 'animate-pulse',
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black text-slate-900 tracking-tight">
                                            Live Monitor
                                        </h2>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                                            Real-time Feed
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={cn(
                                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
                                        metrics.liveSessions.length > 0
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : 'bg-slate-100 text-slate-400 border border-slate-200',
                                    )}
                                >
                                    {metrics.liveSessions.length} Active
                                </span>
                            </div>

                            {/* Scrollable Session List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 space-y-3">
                                {isSessionsLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                                        <RefreshCcw
                                            className="animate-spin"
                                            size={20}
                                        />
                                        <span className="text-[10px] font-black uppercase">
                                            Syncing...
                                        </span>
                                    </div>
                                ) : metrics.liveSessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
                                        <div className="p-4 bg-white rounded-full border border-dashed border-slate-300">
                                            <Gamepad2
                                                size={32}
                                                className="text-slate-300"
                                            />
                                        </div>
                                        <p className="font-bold text-xs text-slate-500 uppercase tracking-tighter">
                                            No sessions in progress
                                        </p>
                                    </div>
                                ) : (
                                    metrics.liveSessions.map(
                                        (session: ActivitySessionEntry) => {
                                            const startTime =
                                                session.actualStartAt
                                                    ? new Date(
                                                          session.actualStartAt,
                                                      ).getTime()
                                                    : Date.now();
                                            const elapsedMins = Math.floor(
                                                (Date.now() - startTime) /
                                                    60000,
                                            );

                                            return (
                                                <motion.div
                                                    key={session.id}
                                                    initial={{
                                                        opacity: 0,
                                                        x: -10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-indigo-300 transition-all group"
                                                >
                                                    {/* Top Row: User & Activity */}
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-9 w-9 rounded-lg border-2 border-slate-50 shadow-sm">
                                                                <AvatarImage
                                                                    src={FormatService.formatStrapiMedia(
                                                                        session
                                                                            .student
                                                                            ?.profilePicture,
                                                                        'thumbnail',
                                                                    )}
                                                                />
                                                                <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-black">
                                                                    {session.student?.firstName?.charAt(
                                                                        0,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 text-[12px] leading-tight">
                                                                    {
                                                                        session
                                                                            .student
                                                                            ?.firstName
                                                                    }{' '}
                                                                    {
                                                                        session
                                                                            .student
                                                                            ?.lastName
                                                                    }
                                                                </h4>
                                                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                    <Stethoscope
                                                                        size={
                                                                            10
                                                                        }
                                                                        className="text-indigo-400"
                                                                    />
                                                                    Therapist:{' '}
                                                                    {session
                                                                        .therapist
                                                                        ?.lastName ||
                                                                        'Unassigned'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Live Timer Badge */}
                                                        <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">
                                                            <Clock
                                                                size={10}
                                                                className="animate-spin-slow"
                                                            />
                                                            <span className="text-[10px] font-mono font-black">
                                                                {elapsedMins}m
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Middle Row: Content Meta */}
                                                    <div className="bg-slate-50 rounded-lg p-2 flex items-center justify-between mb-3 border border-slate-100">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <LayoutGrid
                                                                size={12}
                                                                className="text-slate-400 shrink-0"
                                                            />
                                                            <span className="text-[10px] font-black text-slate-600 truncate uppercase tracking-tighter">
                                                                {session
                                                                    .activity
                                                                    ?.name ||
                                                                    'Manual Evaluation'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[8px] font-black text-slate-400 uppercase">
                                                                Live
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Bottom Row: Control Center */}
                                                    <div className="flex gap-2">
                                                        {/* <Button
                                                            variant="outline"
                                                            className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest gap-2 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
                                                        >
                                                            <Eye size={14} />{' '}
                                                            Observe
                                                        </Button> */}
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 shrink-0 border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                                                            title="Force End Session"
                                                        >
                                                            <Power size={14} />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            );
                                        },
                                    )
                                )}
                            </div>

                            {/* Footer: Detailed Legend */}
                            <div className="px-4 py-2 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                            Stable
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                            Idle 5m+
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black text-indigo-500/50 uppercase tracking-widest">
                                    v2.4.0 Live
                                </span>
                            </div>
                        </Card>

                        {/* System Actions Arsenal */}
                        <Card className="bg-white border-slate-200 rounded-[24px] shadow-sm flex-1 flex flex-col p-5">
                            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
                                <Settings
                                    size={16}
                                    className="text-slate-500"
                                />{' '}
                                Platform Tools
                            </h3>

                            {/* <div className="space-y-2 flex-1 overflow-y-auto">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-9 text-[11px] font-bold text-slate-700 bg-white border-slate-200 shadow-sm gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                    <Users
                                        size={14}
                                        className="text-slate-400"
                                    />{' '}
                                    Manage User Approvals
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-9 text-[11px] font-bold text-slate-700 bg-white border-slate-200 shadow-sm gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                    <Download
                                        size={14}
                                        className="text-slate-400"
                                    />{' '}
                                    Export Audit Logs
                                </Button>
                            </div> */}

                            <div className="pt-4 border-t border-slate-100 mt-4 shrink-0">
                                <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5 mb-2">
                                    <ShieldAlert size={10} /> Emergency
                                </span>
                                {/* UPDATED: Button text contrast, size, and added click handler */}
                                <Button
                                    variant="destructive"
                                    className="w-full justify-start h-9 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 gap-3 shadow-md mb-2 transition-colors"
                                    onClick={() =>
                                        setIsTerminateModalOpen(true)
                                    }
                                    disabled={metrics.liveSessions.length === 0}
                                >
                                    <Power size={14} /> Terminate All Sessions
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
                <div className="h-12 w-full" aria-hidden="true" />
            </main>

            {/* --- CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {isTerminateModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <motion.div
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 overflow-hidden border border-slate-200"
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                                        Terminate All
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Emergency Action
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-6 font-medium">
                                Are you absolutely sure you want to
                                force-terminate all{' '}
                                <span className="font-black text-slate-900">
                                    {metrics.liveSessions.length} active
                                    sessions
                                </span>
                                ? This will immediately interrupt the users and
                                update their logs.
                            </p>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 font-bold text-slate-600"
                                    onClick={() =>
                                        setIsTerminateModalOpen(false)
                                    }
                                    disabled={isTerminating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 font-bold bg-rose-600 hover:bg-rose-700 text-white gap-2"
                                    onClick={handleTerminateAll}
                                    disabled={isTerminating}
                                >
                                    {isTerminating ? (
                                        <>
                                            <RefreshCcw
                                                size={14}
                                                className="animate-spin"
                                            />
                                            Processing
                                        </>
                                    ) : (
                                        'Yes, Terminate'
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
