'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
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
    BarChart,
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
    Clock,
    Target,
    Zap,
    History,
    Trophy,
    Sparkles,
    Timer,
    Gamepad2,
    AlertTriangle,
    RefreshCw,
    Focus,
    Layers,
    BrainCircuit,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { getActivitySessionsNew } from '@/api/acitivity-session';
import { getStudentAnalytics } from '@/api/analytics';
import { getStudent } from '@/api/students';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { UserAvatar } from '@/components/UserAvatar';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ActivitySessionResponse } from '@/types/activitiy-session';

// --- ICON MAPPING ---
const PATTERN_ICONS: Record<string, any> = {
    'Impulsive Responding': Zap,
    'High Distractibility': AlertTriangle,
    'Rapid Task-Switching': RefreshCw,
    Hyperfocus: Focus,
    'Repetitive Interaction Patterns': Layers,
    'Rigid Task Execution': Target,
    'Prolonged Processing Time': Timer,
    'Inconsistent Accuracy': Activity,
    'Sustained Attention': BrainCircuit,
};

// --- GENDER ICONS ---
const MarsIcon = ({ size, className }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M16 3h5v5" />
        <path d="m21 3-6.75 6.75" />
        <circle cx="10" cy="14" r="6" />
    </svg>
);
const VenusIcon = ({ size, className }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="12" x2="12" y1="15" y2="22" />
        <line x1="9" x2="15" y1="19" y2="19" />
        <circle cx="12" cy="9" r="6" />
    </svg>
);
const CakeIcon = ({ size, className }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
        <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
        <path d="M2 21h20" />
        <path d="M7 8v3" />
        <path d="M12 8v3" />
        <path d="M17 8v3" />
        <path d="M7 4h.01" />
        <path d="M12 4h.01" />
        <path d="M17 4h.01" />
    </svg>
);

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

// --- TOOLTIPS ---

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

const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const Icon = PATTERN_ICONS[data.pattern] || BrainCircuit;

        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl min-w-[220px] pointer-events-none">
                <div className="flex items-center gap-2.5 mb-4 border-b border-slate-700 pb-3">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                        <Icon size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-white font-bold text-[11px] uppercase tracking-[0.15em] leading-tight">
                        {data.pattern}
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                            Intensity
                        </span>
                        <span className="text-indigo-400 text-xs font-black">
                            {data.intensityScore}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.intensityScore}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full bg-indigo-500 rounded-full"
                        />
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const CustomComposedTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const scoreData = payload.find((p: any) => p.dataKey === 'avgAccuracy');
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
                            Avg Accuracy
                        </span>
                        <span className="text-amber-400 text-sm font-black">
                            {scoreData?.value ?? '--'}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-slate-400 text-xs font-medium">
                            Plays
                        </span>
                        <span className="text-emerald-400 text-sm font-black">
                            {playData?.value ?? '--'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// --- ✨ OVERLAP-SAFE INTERACTIVE TICK ✨ ---
const CleanRadarTick = (props: any) => {
    const { payload, x, y, cx, cy } = props;
    const patternName = payload.value;
    const Icon = PATTERN_ICONS[patternName] || BrainCircuit;

    const isTop = y < cy - 20;
    const isBottom = y > cy + 20;
    const isRight = x > cx + 20;
    const isLeft = x < cx - 20;

    let textAnchor: 'start' | 'middle' | 'end' | 'inherit' = 'middle';

    if (isLeft && !isTop && !isBottom) textAnchor = 'end';
    if (isRight && !isTop && !isBottom) textAnchor = 'start';

    const radius = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const unitX = (x - cx) / radius;
    const unitY = (y - cy) / radius;

    const offsetIcon = 16;
    const offsetText = 36;

    const iconX = x + unitX * offsetIcon;
    const iconY = y + unitY * offsetIcon;
    const textX = x + unitX * offsetText;
    const textY = y + unitY * offsetText;

    let dyShift = 3;
    if (isTop) dyShift = -2;
    if (isBottom) dyShift = 10;

    return (
        <g className="recharts-radar-tick">
            <foreignObject
                x={iconX - 10}
                y={iconY - 10}
                width="20"
                height="20"
                style={{ pointerEvents: 'none' }}
            >
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Icon size={14} strokeWidth={2} />
                </div>
            </foreignObject>
            <text
                x={textX}
                y={textY}
                textAnchor={textAnchor}
                fill="#64748B"
                fontSize="8px"
                fontWeight="700"
                className="uppercase tracking-tight"
                dy={dyShift}
                style={{ pointerEvents: 'none' }}
            >
                {patternName.length > 14 ? (
                    <>
                        <tspan x={textX} dy="0">
                            {patternName.split(' ').slice(0, 2).join(' ')}
                        </tspan>
                        <tspan x={textX} dy="10">
                            {patternName.split(' ').slice(2).join(' ')}
                        </tspan>
                    </>
                ) : (
                    patternName
                )}
            </text>
        </g>
    );
};

export default function StudentDashboard() {
    const params = useParams();
    const studentId = params.id as string;
    const router = useRouter();
    const historyScrollRef = useRef<HTMLDivElement>(null);

    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
            from: start.toISOString().split('T')[0],
            to: end.toISOString().split('T')[0],
        };
    });

    const { data: student, isLoading: isLoadingStudent } = useQuery({
        queryKey: ['student', studentId],
        queryFn: getStudent,
        enabled: !!studentId,
        placeholderData: keepPreviousData,
    });

    const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
        queryKey: [
            'student-analytics',
            { studentId, startDate: dateRange.from, endDate: dateRange.to },
        ],
        queryFn: getStudentAnalytics,
        enabled: !!studentId,
        placeholderData: keepPreviousData,
    });

    const localStartIso = useMemo(
        () => new Date(`${dateRange.from}T00:00:00`).toISOString(),
        [dateRange.from],
    );
    const localEndIso = useMemo(
        () => new Date(`${dateRange.to}T23:59:59.999`).toISOString(),
        [dateRange.to],
    );

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
                        { actualStartAt: { $gte: localStartIso } },
                        { actualStartAt: { $lte: localEndIso } },
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

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return '--';
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        if (diffMs <= 0) return '0s';
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    // ✨ FIX: Properly merge current and previous timeline data so Recharts doesn't drop the 'Previous' line on load.
    const mergedTimelineData = useMemo(() => {
        if (!analytics?.charts?.performanceTimeline) return [];
        return analytics.charts.performanceTimeline.map((item: any) => ({
            ...item,
            currentAccuracy: item.currentAccuracy || 0,
            prevAccuracy: item.prevAccuracy || 0,
        }));
    }, [analytics?.charts?.performanceTimeline]);

    if (isLoadingStudent || isLoadingAnalytics) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const { overviewMetrics, charts } = analytics || {};
    const displayRadarData = charts?.behavioralRadar || [];

    const summaryMetrics = [
        {
            label: 'Avg Accuracy',
            value: `${overviewMetrics?.averageAccuracy || 0}%`,
            icon: Target,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Avg Score',
            value: overviewMetrics?.averageScore || 0,
            icon: Trophy,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
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
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                        <Button
                            variant="outline"
                            className="rounded-2xl border-slate-200 h-11 w-11 flex items-center justify-center text-slate-500 hover:text-indigo-600 shrink-0 hidden sm:flex"
                        >
                            <Printer size={16} />
                        </Button>
                    </div>
                </motion.header>

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

                {/* --- ROW 1: PERFORMANCE WIDGETS --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 xl:grid-cols-5 gap-6"
                >
                    {/* LINE CHART */}
                    <Card className="col-span-1 xl:col-span-3 rounded-[32px] border-slate-200 shadow-sm bg-white h-[420px] flex flex-col relative overflow-hidden">
                        <CardHeader className="py-5 px-8 border-b border-slate-50 flex flex-row items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <TrendingUp
                                    size={16}
                                    className="text-indigo-500"
                                />
                                <TechnicalLabel>
                                    Accuracy Progress Over Time
                                </TechnicalLabel>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 min-h-0 relative">
                            {mergedTimelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={mergedTimelineData}
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
                                                    floodColor="#10b981"
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
                                            name="Current Accuracy"
                                            type="monotone"
                                            dataKey="currentAccuracy"
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
                                            filter="url(#shadow)"
                                        />
                                        <Line
                                            name="Previous Accuracy"
                                            type="monotone"
                                            dataKey="prevAccuracy"
                                            stroke="#94a3b8"
                                            strokeWidth={3}
                                            strokeDasharray="5 5"
                                            dot={{
                                                r: 4,
                                                strokeWidth: 2,
                                                fill: '#fff',
                                            }}
                                            activeDot={{
                                                r: 6,
                                                stroke: '#94a3b8',
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

                    {/* BAR CHART */}
                    <Card className="col-span-1 xl:col-span-2 h-[420px] rounded-[32px] border-slate-200 shadow-sm bg-white flex flex-col overflow-hidden">
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
                                                    ? val.length > 12
                                                        ? val.substring(0, 12) +
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
                                            dataKey="usageCount"
                                            barSize={35}
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
                                            dataKey="avgAccuracy"
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
                </motion.div>

                {/* --- ROW 2: BEHAVIORAL WEB & HISTORY --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 xl:grid-cols-5 gap-6"
                >
                    {/* RADAR CHART WIDGET */}
                    <Card className="col-span-1 xl:col-span-3 rounded-[32px] border-slate-200 shadow-sm bg-white h-[500px] flex flex-col overflow-hidden">
                        <CardHeader className="py-5 px-8 border-b border-slate-50 shrink-0 flex flex-row items-center justify-between">
                            <div className="flex flex-row items-center gap-2">
                                <Target size={16} className="text-amber-500" />
                                <TechnicalLabel>
                                    Cognitive Intensity Profile
                                </TechnicalLabel>
                            </div>
                        </CardHeader>

                        <CardContent className="p-2 flex-1 min-h-0 relative">
                            {displayRadarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart
                                        cx="50%"
                                        cy="50%"
                                        outerRadius="60%"
                                        data={displayRadarData}
                                        margin={{
                                            top: 50,
                                            bottom: 50,
                                            left: 50,
                                            right: 50,
                                        }}
                                    >
                                        <PolarGrid
                                            stroke="#e2e8f0"
                                            strokeDasharray="4 4"
                                        />
                                        <PolarAngleAxis
                                            dataKey="pattern"
                                            tick={<CleanRadarTick />}
                                        />
                                        <PolarRadiusAxis
                                            domain={[0, 100]}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Radar
                                            dataKey="intensityScore"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            fill="#8b5cf6"
                                            fillOpacity={0.12}
                                            activeDot={{
                                                r: 6,
                                                fill: '#4F46E5',
                                                stroke: '#FFF',
                                                strokeWidth: 2,
                                            }}
                                            dot={{
                                                r: 3,
                                                fill: '#8B5CF6',
                                                strokeWidth: 0,
                                            }}
                                        />
                                        <RechartsTooltip
                                            cursor={false}
                                            content={<CustomRadarTooltip />}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyWidgetState
                                    icon={Target}
                                    message="No AI data found"
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* INTERACTION HISTORY WIDGET */}
                    <Card className="col-span-1 xl:col-span-2 h-[500px] flex flex-col bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden relative">
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
                                    {activitySessions
                                        .slice()
                                        .sort(
                                            (
                                                a: ActivitySessionResponse,
                                                b: ActivitySessionResponse,
                                            ) =>
                                                new Date(
                                                    a.actualStartAt || 0,
                                                ).getTime() -
                                                new Date(
                                                    b.actualStartAt || 0,
                                                ).getTime(),
                                        )
                                        .map(
                                            (
                                                session: ActivitySessionResponse,
                                            ) => {
                                                const isGameActivity =
                                                    session.activity?.activityType?.toLowerCase() ===
                                                    'game';
                                                const timeDuration =
                                                    calculateDuration(
                                                        session.actualStartAt,
                                                        session.actualEndAt,
                                                    );

                                                return (
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
                                                                'absolute -left-[33px] top-15.5 h-4 w-4 rounded-full border-[3px] border-white shadow-sm transition-transform group-hover:scale-125 z-10',
                                                                session.activitySessionStatus ===
                                                                    'completed'
                                                                    ? 'bg-emerald-500'
                                                                    : 'bg-amber-400',
                                                            )}
                                                        />
                                                        <div className="flex flex-col gap-3 bg-slate-50/50 p-4 rounded-2xl border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all shadow-sm group-hover:shadow-md">
                                                            <div className="flex flex-col gap-1 items-start justify-between">
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <span
                                                                        className={cn(
                                                                            'text-sm font-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate',
                                                                            !session
                                                                                .activity
                                                                                ?.name
                                                                                ? 'text-slate-400 italic'
                                                                                : 'text-slate-700',
                                                                        )}
                                                                    >
                                                                        {session
                                                                            .activity
                                                                            ?.name ||
                                                                            'Unlinked Activity'}
                                                                    </span>
                                                                    {session.activitySessionStatus ===
                                                                        'completed' && (
                                                                        <CheckCircle2
                                                                            size={
                                                                                16
                                                                            }
                                                                            className="text-emerald-500 ml-auto shrink-0"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                {session.aiRecommendation && (
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-lg border border-purple-100 text-[10px] font-bold text-purple-600 shadow-sm">
                                                                        <Sparkles
                                                                            size={
                                                                                12
                                                                            }
                                                                        />{' '}
                                                                        AI
                                                                    </div>
                                                                )}
                                                                {isGameActivity && (
                                                                    <>
                                                                        <div
                                                                            className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 text-[10px] font-bold text-emerald-700 shadow-sm"
                                                                            title="Accuracy"
                                                                        >
                                                                            <Target
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-emerald-500"
                                                                            />
                                                                            {session.accuracy ??
                                                                                0}
                                                                            %
                                                                        </div>
                                                                        <div
                                                                            className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100 text-[10px] font-bold text-indigo-700 shadow-sm"
                                                                            title="Score / Total Rounds"
                                                                        >
                                                                            <Trophy
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-indigo-500"
                                                                            />
                                                                            {session.score ??
                                                                                0}{' '}
                                                                            /{' '}
                                                                            {session.rounds ??
                                                                                0}
                                                                        </div>
                                                                        <div
                                                                            className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 text-[10px] font-bold text-amber-700 shadow-sm"
                                                                            title="Time Duration"
                                                                        >
                                                                            <Timer
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-amber-500"
                                                                            />
                                                                            {
                                                                                timeDuration
                                                                            }
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-2 pt-2 border-t border-slate-100">
                                                                <Clock
                                                                    size={12}
                                                                />{' '}
                                                                {formatFullDate(
                                                                    session.actualStartAt,
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
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
