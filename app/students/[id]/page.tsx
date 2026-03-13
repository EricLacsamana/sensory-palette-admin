'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    LineChart,
    Line,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
    ComposedChart,
} from 'recharts';
import {
    ArrowLeft,
    Activity,
    Printer,
    Loader2,
    TrendingUp,
    CheckCircle2,
    PlayCircle,
    AlertCircle,
    CakeIcon,
    MarsIcon,
    VenusIcon,
    Clock,
    Target,
    Zap,
    History,
    Trophy,
    Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { getActivitySessionsNew } from '@/api/acitivity-session';
import { getStudentAnalytics } from '@/api/analytics';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { UserAvatar } from '@/components/UserAvatar';
import { getStudent } from '@/api/students';

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, duration: 0.4 } },
};

const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const TechnicalLabel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={cn(
            'text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none',
            className,
        )}
    >
        {children}
    </span>
);

const EmptyWidgetState = ({
    message,
    icon: Icon,
}: {
    message: string;
    icon: any;
}) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3 opacity-80 min-h-[200px]">
        <Icon size={32} className="text-slate-200" />
        <span className="text-xs font-bold uppercase tracking-widest text-center px-4">
            {message}
        </span>
    </div>
);

// --- Custom Line Tooltip (Performance Timeline) ---
const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl min-w-[200px] z-50">
                <p className="text-white font-bold text-sm mb-3 border-b border-slate-700 pb-2">
                    {label || 'Date'}
                </p>
                <div className="flex flex-col gap-2">
                    {payload.map((entry: any, index: number) => (
                        <div
                            key={index}
                            className="flex justify-between items-center gap-6"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-400 text-xs font-medium">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="text-white text-sm font-black">
                                {entry.value}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// --- Custom Radar Tooltip (Aggregated View) ---
const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl max-w-[250px] z-50">
                <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                    {data.pattern}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-300 text-xs font-medium">
                        Avg Intensity:
                    </span>
                    <span className="text-indigo-400 text-sm font-black">
                        {data.intensityScore}%
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

// --- Custom Composed Chart Tooltip for Top Activities ---
const CustomComposedTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const scoreData = payload.find(
            (p: any) => p.dataKey === 'avgStudentScore',
        );
        const playData = payload.find((p: any) => p.dataKey === 'usageCount');
        const data = scoreData?.payload || playData?.payload;

        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl max-w-[250px] z-50">
                <p className="text-white font-bold text-sm mb-3 border-b border-slate-700 pb-2">
                    {data.activityName || 'Unnamed Activity'}
                </p>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-slate-400 text-xs font-medium">
                            Avg Score
                        </span>
                        <span className="text-emerald-400 text-sm font-black">
                            {scoreData?.value ?? '--'}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-slate-400 text-xs font-medium">
                            Plays
                        </span>
                        <span className="text-amber-400 text-sm font-black">
                            {playData?.value ?? '--'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-slate-400 text-xs font-medium">
                            Type
                        </span>
                        <span className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                            {data.activityType || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function StudentDashboard() {
    const params = useParams();
    const studentId = params.id as string;
    const router = useRouter();
    const historyScrollRef = useRef<HTMLDivElement>(null);

    const [rangeType, setRangeType] = useState('all');

    const dateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        if (rangeType === '7d') start.setDate(end.getDate() - 7);
        else if (rangeType === '30d') start.setDate(end.getDate() - 30);
        else if (rangeType === '1y') start.setFullYear(end.getFullYear() - 1);
        else return { startDate: '2020-01-01', endDate: '2026-12-31' };

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, [rangeType]);

    const { data: student, isLoading: isLoadingStudent } = useQuery({
        queryKey: ['student', studentId],
        queryFn: getStudent,
        enabled: !!studentId,
        placeholderData: keepPreviousData,
    });

    const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
        queryKey: ['student-analytics', { studentId, ...dateRange }],
        queryFn: getStudentAnalytics,
        enabled: !!studentId,
        placeholderData: keepPreviousData,
    });

    const { data: activitySessions = [], isSuccess } = useQuery({
        queryKey: [
            'activity-sessions-student',
            {
                sort: ['actualStartAt:desc'],
                filters: {
                    student: { id: { $eq: studentId } },
                    $and: [
                        { actualStartAt: { $notNull: true } },
                        { actualEndAt: { $notNull: true } },
                    ],
                },
                populate: { activity: { populate: '*' } },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!studentId,
    });

    useEffect(() => {
        if (historyScrollRef.current) {
            const container = historyScrollRef.current;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [activitySessions]);

    const formatFullDate = (dateString: string) => {
        if (!dateString) return 'Unknown Date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoadingStudent || isLoadingAnalytics) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const { overviewMetrics, charts } = analytics || {};

    const displayRadarData = charts?.behavioralRadar || [];
    const displayLineData = charts?.performanceTimeline || [];

    const summaryMetrics = [
        {
            label: 'Avg Score',
            value: `${overviewMetrics?.averageScore || 0}%`,
            icon: Trophy,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
        },
        {
            label: 'Avg Accuracy',
            value: `${overviewMetrics?.averageAccuracy || 0}%`,
            icon: Target,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Therapy Time',
            value: `${overviewMetrics?.totalTherapyHours || 0}h`,
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
        },
        {
            label: 'Total Sessions',
            value: overviewMetrics?.totalSessionsCompleted || 0,
            icon: Zap,
            color: 'text-rose-500',
            bg: 'bg-rose-50',
        },
    ];

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col font-sans text-slate-900 p-6 lg:p-8">
            <motion.div
                initial="hidden"
                animate="show"
                variants={pageVariants}
                className="max-w-[1600px] w-full mx-auto flex flex-col pb-10 gap-6"
            >
                {/* --- HEADER --- */}
                <motion.header
                    variants={itemVariants}
                    className="flex flex-col xl:flex-row items-center justify-between bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm gap-8"
                >
                    <div className="flex items-center gap-6 shrink-0 w-full xl:w-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-2xl h-12 w-12 border-slate-200 hover:bg-slate-50"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="flex items-center gap-5">
                            <UserAvatar
                                src={FormatService.formatStrapiMedia(
                                    student?.profilePicture,
                                    'thumbnail',
                                )}
                                size="md"
                                showStatus={true}
                                name={student?.firstName}
                                className="shadow-sm border border-slate-100"
                            />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                                    {student?.firstName} {student?.lastName}
                                </h1>
                                <TechnicalLabel className="text-indigo-600">
                                    ID: #{studentId.padStart(4, '0')}
                                </TechnicalLabel>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-wrap items-center xl:justify-center justify-start gap-x-10 gap-y-4 px-8 border-y xl:border-y-0 xl:border-x border-slate-100 py-4 xl:py-0 w-full xl:w-auto">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                                <CakeIcon
                                    size={18}
                                    className="text-slate-400"
                                />
                            </div>
                            <div className="flex flex-col">
                                <TechnicalLabel>DOB / Age</TechnicalLabel>
                                <span className="text-sm font-bold text-slate-700">
                                    {student?.dateOfBirth
                                        ? new Date(
                                              student.dateOfBirth,
                                          ).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric',
                                          })
                                        : '--'}
                                    {student?.dateOfBirth && (
                                        <span className="text-slate-400 ml-1">
                                            ({student?.age}y)
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                                {student?.gender === 'male' ? (
                                    <MarsIcon
                                        size={18}
                                        className="text-blue-500"
                                    />
                                ) : (
                                    <VenusIcon
                                        size={18}
                                        className="text-pink-500"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <TechnicalLabel>Gender</TechnicalLabel>
                                <span className="text-sm font-bold text-slate-700 capitalize">
                                    {student?.gender || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full xl:w-auto justify-between xl:justify-end">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 transition-opacity">
                            {['7d', '30d', '1y', 'all'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setRangeType(range)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all',
                                        rangeType === range
                                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                            : 'text-slate-400 hover:text-slate-600',
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-2xl border-slate-200 h-11 w-11 flex items-center justify-center text-slate-500 hover:text-indigo-600 shrink-0 hidden sm:flex"
                        >
                            <Printer size={16} />
                        </Button>
                    </div>
                </motion.header>

                {/* --- METRICS WIDGETS --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
                >
                    {summaryMetrics.map((stat, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-sm flex items-start justify-between group hover:border-indigo-100 transition-colors"
                        >
                            <div className="flex flex-col">
                                <TechnicalLabel>{stat.label}</TechnicalLabel>
                                <p className="text-3xl font-black text-slate-900 mt-2">
                                    {stat.value}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    'p-3 rounded-2xl transition-transform group-hover:scale-110',
                                    stat.bg,
                                    stat.color,
                                )}
                            >
                                <stat.icon size={22} />
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* --- CHARTS WIDGETS --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 xl:grid-cols-5 gap-6"
                >
                    {/* Performance Line Chart */}
                    <Card className="col-span-1 xl:col-span-3 rounded-[32px] border-slate-200 shadow-sm bg-white h-[420px] flex flex-col relative overflow-hidden">
                        <CardHeader className="py-5 px-8 border-b border-slate-50 flex flex-row items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <TrendingUp
                                    size={16}
                                    className="text-indigo-500"
                                />
                                <TechnicalLabel>
                                    Overall Performance Progress
                                </TechnicalLabel>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 min-h-0 relative">
                            {displayLineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={displayLineData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -20,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <filter id="shadow" height="200%">
                                                <feDropShadow
                                                    dx="0"
                                                    dy="4"
                                                    stdDeviation="4"
                                                    floodColor="#6366f1"
                                                    floodOpacity="0.2"
                                                />
                                            </filter>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#f1f5f9"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{
                                                fontSize: 11,
                                                fill: '#94a3b8',
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#94a3b8',
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <RechartsTooltip
                                            content={<CustomLineTooltip />}
                                            cursor={{
                                                stroke: '#e2e8f0',
                                                strokeWidth: 2,
                                                strokeDasharray: '4 4',
                                            }}
                                        />
                                        <Legend
                                            iconType="circle"
                                            wrapperStyle={{
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#64748b',
                                                paddingTop: '20px',
                                            }}
                                        />
                                        <Line
                                            name="Avg Score"
                                            type="monotone"
                                            dataKey="avgScore"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                strokeWidth: 2,
                                                fill: '#fff',
                                            }}
                                            activeDot={{
                                                r: 6,
                                                stroke: '#6366f1',
                                                strokeWidth: 2,
                                                fill: '#fff',
                                            }}
                                            filter="url(#shadow)"
                                        />
                                        <Line
                                            name="Avg Accuracy"
                                            type="monotone"
                                            dataKey="avgAccuracy"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                strokeWidth: 2,
                                                fill: '#fff',
                                            }}
                                            activeDot={{
                                                r: 6,
                                                stroke: '#10b981',
                                                strokeWidth: 2,
                                                fill: '#fff',
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyWidgetState
                                    icon={Activity}
                                    message="Not enough data to plot progress"
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Cognitive Radar Chart */}
                    <Card className="col-span-1 xl:col-span-2 rounded-[32px] border-slate-200 shadow-sm bg-white h-[420px] flex flex-col">
                        <CardHeader className="py-5 px-8 border-b border-slate-50 shrink-0 flex flex-row items-center justify-between">
                            <div className="flex flex-row items-center gap-2">
                                <Target size={16} className="text-amber-500" />
                                <TechnicalLabel>
                                    Cognitive Intensity
                                </TechnicalLabel>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 min-h-0">
                            {displayRadarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart
                                        cx="50%"
                                        cy="50%"
                                        outerRadius="65%"
                                        data={displayRadarData}
                                    >
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis
                                            dataKey="pattern"
                                            tick={{
                                                fill: '#64748b',
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}
                                        />
                                        <RechartsTooltip
                                            content={<CustomRadarTooltip />}
                                        />
                                        <Radar
                                            name="Intensity"
                                            dataKey="intensityScore"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            fill="#8b5cf6"
                                            fillOpacity={0.4}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyWidgetState
                                    icon={Target}
                                    message="No cognitive data logged"
                                />
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* --- HISTORY & ACTIVITIES WIDGETS --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 xl:grid-cols-5 gap-6"
                >
                    {/* Top Activities Ranking (Composed Chart: Bar + Line) - LEFT */}
                    <Card className="col-span-1 xl:col-span-3 h-[500px] rounded-[32px] border-slate-200 shadow-sm bg-white flex flex-col overflow-hidden">
                        <CardHeader className="py-5 px-8 border-b border-slate-50 flex flex-row items-center gap-2 shrink-0">
                            <Trophy size={16} className="text-amber-500" />
                            <TechnicalLabel>
                                Top Performing Activities
                            </TechnicalLabel>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 min-h-0 relative">
                            {charts?.topActivities &&
                            charts.topActivities.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={charts.topActivities}
                                        margin={{
                                            top: 20,
                                            right: 0,
                                            left: -20,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#f1f5f9"
                                        />
                                        <XAxis
                                            dataKey="activityName"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fill: '#64748b',
                                                fontWeight: 600,
                                            }}
                                            tickFormatter={(val) =>
                                                val
                                                    ? val.length > 15
                                                        ? val.substring(0, 15) +
                                                          '...'
                                                        : val
                                                    : 'Unknown'
                                            }
                                            dy={10}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            domain={[0, 100]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#94a3b8',
                                            }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#f59e0b',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                        <RechartsTooltip
                                            content={<CustomComposedTooltip />}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="avgStudentScore"
                                            barSize={40}
                                            radius={[6, 6, 0, 0]}
                                            animationDuration={1500}
                                        >
                                            {charts.topActivities.map(
                                                (entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            index === 0
                                                                ? '#10b981'
                                                                : '#6366f1'
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Bar>
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="usageCount"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: '#f59e0b',
                                                strokeWidth: 2,
                                                stroke: '#fff',
                                            }}
                                            activeDot={{ r: 6 }}
                                            animationDuration={1500}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyWidgetState
                                    icon={Trophy}
                                    message="No Top Activities Yet"
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Interaction Timeline - RIGHT */}
                    <Card className="col-span-1 xl:col-span-2 h-[500px] flex flex-col bg-white rounded-[32px] border-slate-200 shadow-sm overflow-hidden relative">
                        <CardHeader className="py-5 px-8 border-b border-slate-50 flex flex-row items-center gap-2 shrink-0">
                            <History size={16} className="text-slate-400" />
                            <TechnicalLabel>Interaction History</TechnicalLabel>
                        </CardHeader>
                        <CardContent
                            ref={historyScrollRef}
                            className="flex-1 overflow-y-auto p-6 custom-scrollbar relative"
                        >
                            {isSuccess && activitySessions.length > 0 ? (
                                <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6 pb-6">
                                    {activitySessions.map((session: any) => (
                                        <div
                                            key={session.documentId}
                                            className="relative group cursor-pointer"
                                            onClick={() =>
                                                router.push(
                                                    `/activity-sessions/${session.documentId}`,
                                                )
                                            }
                                        >
                                            <div
                                                className={cn(
                                                    'absolute -left-[33px] top-1.5 h-4 w-4 rounded-full border-[3px] border-white shadow-sm transition-transform group-hover:scale-125 z-10',
                                                    session.activitySessionStatus ===
                                                        'completed'
                                                        ? 'bg-emerald-500'
                                                        : 'bg-amber-400',
                                                )}
                                            />
                                            <div className="flex flex-col gap-2 bg-slate-50/50 p-4 rounded-2xl border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all">
                                                <div className="flex flex-col gap-1 items-start justify-between">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <span
                                                            className={cn(
                                                                'text-xs font-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate',
                                                                !session
                                                                    .activity
                                                                    ?.name
                                                                    ? 'text-slate-400 italic'
                                                                    : 'text-slate-900',
                                                            )}
                                                        >
                                                            {session.activity
                                                                ?.name ||
                                                                'Unlinked Activity'}
                                                        </span>
                                                        {session.activitySessionStatus ===
                                                            'completed' && (
                                                            <CheckCircle2
                                                                size={14}
                                                                className="text-emerald-500 ml-auto shrink-0"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    {session.aiRecommendation && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 rounded-md border border-purple-100 text-[10px] font-bold text-purple-600 shadow-sm">
                                                            <Sparkles
                                                                size={10}
                                                            />{' '}
                                                            AI
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-md border border-slate-100 text-[10px] font-bold text-indigo-600 shadow-sm">
                                                        <Activity size={10} />
                                                        {session.score !==
                                                            null &&
                                                        session.score !==
                                                            undefined
                                                            ? `${session.score}%`
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                                                    <Clock size={10} />{' '}
                                                    {formatFullDate(
                                                        session.actualStartAt,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyWidgetState
                                    icon={History}
                                    message="No past interactions found"
                                />
                            )}
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
