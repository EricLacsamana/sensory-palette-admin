'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    Activity,
    Radio,
    Power,
    Users,
    CheckCircle2,
    AlertTriangle,
    Clock,
    ShieldCheck,
    RefreshCcw,
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    Stethoscope,
    GraduationCap,
    LayoutGrid,
    Search,
    Filter,
    Settings,
    ShieldAlert,
    LineChart as LineChartIcon,
    BarChart as BarChartIcon,
    Database,
    Shield,
    TrendingUp,
    Gamepad2,
    Sparkles,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { ActivitySessionStatus } from '@/types/activitiy-session';
import { useRouter } from 'next/navigation';

// --- Animation Variants ---
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

// --- UNIFIED DASHBOARD STAT CARD ---
const DashboardStatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    colorClass,
    isLoading,
    customAction,
}: any) => (
    <div
        className={cn(
            'bg-white rounded-[24px] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group h-full',
            customAction && 'cursor-pointer hover:border-indigo-300',
        )}
        onClick={customAction}
    >
        <div
            className={cn(
                'absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:opacity-[0.07]',
                colorClass,
            )}
        >
            <Icon size={90} />
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div
                className={cn(
                    'p-2.5 rounded-xl shrink-0',
                    colorClass
                        .replace('text-', 'bg-')
                        .replace('600', '50')
                        .replace('500', '50'),
                )}
            >
                <Icon size={18} className={colorClass} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                {title}
            </span>
        </div>
        <div className="relative z-10">
            {isLoading ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-xl mb-1" />
            ) : (
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                        {value}
                    </div>
                </div>
            )}
            {trend && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    {trend !== 'Idle' && (
                        <TrendingUp size={12} className={colorClass} />
                    )}{' '}
                    {trend}
                </div>
            )}
        </div>
    </div>
);

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
    const router = useRouter();
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
        staleTime: 5 * 60 * 1000, // 5 minutes cache
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
        refetchInterval: 30000, // Reduced polling: every 30 seconds
        staleTime: 15000, // Avoid duplicate fetches within 15 seconds
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
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    const { data: platformUsers = [] } = useQuery({
        queryKey: ['users', { populate: '*' }],
        queryFn: getUsers,
        enabled: !!token && isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    // --- SENSIBLE METRICS PROCESSING ---
    const metrics = useMemo(() => {
        const liveSessions = sessions.filter(
            (s: any) => s.activitySessionStatus === 'in_progress',
        );
        const historicalSessions = sessions.filter(
            (s: any) => s.activitySessionStatus !== 'in_progress',
        );

        const totalUsers = platformUsers.length;
        const admins = platformUsers.filter(
            (u: any) =>
                u.role?.name?.toLowerCase().includes('admin') ||
                u.role === 'admin',
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
            .sort((a: any, b: any) => (b.count as number) - (a.count as number))
            .slice(0, 5);

        return {
            liveSessions,
            historicalSessions,
            totalUsersCount: totalUsers,
            adminsCount: admins.length,
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
        <div className="min-h-screen bg-[#F8FAFC]">
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

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-8 pb-24">
                {/* --- UNIFIED DASHBOARD HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5 mb-2">
                            <ShieldCheck
                                size={14}
                                className="text-indigo-600"
                            />{' '}
                            Platform Dashboard
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">
                            Admin Overview
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl">
                            Global therapy and session administration center.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-12 w-full md:w-auto rounded-2xl border-slate-200 text-xs font-bold shadow-sm text-slate-600 px-6 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100"
                            onClick={() => refetchSessions()}
                            disabled={isSessionsFetching}
                        >
                            <RefreshCcw
                                size={14}
                                className={cn(
                                    'mr-2',
                                    isSessionsFetching &&
                                        'animate-spin text-indigo-500',
                                )}
                            />
                            {isSessionsFetching ? 'Syncing...' : 'Sync Data'}
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-6">
                    <DashboardStatCard
                        title="Total Users"
                        value={metrics.totalUsersCount}
                        trend="Total Members"
                        icon={Database}
                        colorClass="text-slate-600"
                        isLoading={isUserLoading}
                    />
                    <DashboardStatCard
                        title="Sys Admins"
                        value={metrics.adminsCount}
                        trend="System Core"
                        icon={Shield}
                        colorClass="text-rose-600"
                        isLoading={isUserLoading}
                    />
                    <DashboardStatCard
                        title="Therapists"
                        value={metrics.therapistsCount}
                        trend="Active Staff"
                        icon={Stethoscope}
                        colorClass="text-indigo-600"
                        isLoading={isUserLoading}
                    />
                    <DashboardStatCard
                        title="Students"
                        value={metrics.studentsCount}
                        trend="Enrolled"
                        icon={GraduationCap}
                        colorClass="text-blue-600"
                        isLoading={isUserLoading}
                    />
                    <DashboardStatCard
                        title="Deployed"
                        value={metrics.activeActivities}
                        trend="Active Modules"
                        icon={CheckCircle2}
                        colorClass="text-emerald-600"
                        isLoading={isUserLoading}
                    />
                    <DashboardStatCard
                        title="Live Activity"
                        value={metrics.liveSessions.length}
                        trend={
                            metrics.liveSessions.length > 0 ? 'Online' : 'Idle'
                        }
                        icon={Radio}
                        colorClass={
                            metrics.liveSessions.length > 0
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                        }
                        isLoading={isSessionsLoading}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
                    {/* Area Chart: Session Volume */}
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

                    {/* TOP 5 BAR CHART */}
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
                                                            onClick={() => {
                                                                router.push(
                                                                    `/activity-sessions/${session.documentId}`,
                                                                );
                                                            }}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3"
                                                        >
                                                            View
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

                    {/* RIGHT: System Actions Arsenal */}
                    <div className="flex flex-col gap-6 lg:col-span-1 h-full">
                        <Card className="bg-white border-slate-200 rounded-[24px] shadow-sm flex-1 flex flex-col p-5">
                            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
                                <Settings
                                    size={16}
                                    className="text-slate-500"
                                />{' '}
                                Platform Tools
                            </h3>

                            <div className="pt-4 border-t border-slate-100 mt-auto shrink-0">
                                <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5 mb-2">
                                    <ShieldAlert size={10} /> Emergency
                                </span>
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
            </div>

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
