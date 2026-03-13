'use client';

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
    useQuery,
    useMutation,
    useQueryClient,
    useQueries,
} from '@tanstack/react-query';
import {
    motion,
    AnimatePresence,
    useDragControls,
    useMotionValue,
    animate,
} from 'framer-motion';
import {
    Presentation,
    TrendingUp,
    Sparkles,
    Calendar as CalendarIcon,
    Activity as ActivityIcon,
    Zap,
    Target,
    SmilePlus,
    Clock,
    CalendarDays,
    Minimize2,
    Maximize2,
    Square,
    Loader2,
    ListTodo,
    PanelRightClose,
    PanelRightOpen,
    Flag,
    Play as PlayIcon,
    SkipForward,
    User,
    MonitorPlay,
    AlertCircle,
    CalendarClock,
    Trash2,
    PlayCircle,
    Lock,
    Unlock,
    Pause,
    Droplets,
    BrainCircuit,
    MonitorX,
    BatteryWarning,
    HelpCircle,
    Plus,
    Minus,
    MousePointer2,
    Check,
    X,
    ActivitySquare,
    ArrowUpCircle,
    ArrowDownCircle,
    Settings2,
    StickyNote,
    Save,
    ChevronDown,
    History,
    ChevronRight,
    Users,
    AlertOctagon,
    RefreshCw,
    Copy,
    Info,
    TowerControlIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
} from 'recharts';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from '@/components/ui/collapsible';

import { me, updateStudentPasscode } from '@/api/users';
import {
    getActivitySessionsNew,
    updateActivitySession,
} from '@/api/acitivity-session';
import { getGlobalAnalytics, getStudentAnalytics } from '@/api/analytics';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import {
    ActivitySessionResponse,
    ActivitySessionStatus,
    TimeLog,
} from '@/types/activitiy-session';

import { ScheduleQueue } from '@/components/ScheduleQueue';
import ActivitySequenceLauncher from '@/components/ActivitySequenceLauncher';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { NotificationCenter } from './NotificationCenter';

// ============================================================================
// --- SUB-COMPONENT: CUSTOM RADAR TICK (TEXT WRAPPER) ---
// ============================================================================
// ✨ FIX: This safely wraps long AI pattern names into 2 lines so they don't overlap!
const renderRadarTick = (props: any) => {
    const { payload, x, y, textAnchor, stroke, radius } = props;

    // Split the label into two relatively even lines if it's long
    const words = payload.value.split(' ');
    let line1 = payload.value;
    let line2 = '';

    if (words.length > 1) {
        const mid = Math.ceil(words.length / 2);
        line1 = words.slice(0, mid).join(' ');
        line2 = words.slice(mid).join(' ');
    }

    return (
        <g className="recharts-layer recharts-polar-angle-axis-tick">
            <text
                radius={radius}
                stroke={stroke}
                x={x}
                y={y}
                textAnchor={textAnchor}
                fill="#64748b"
                fontSize={9}
                fontWeight={700}
            >
                <tspan x={x} dy={0}>
                    {line1}
                </tspan>
                {line2 && (
                    <tspan x={x} dy={12}>
                        {line2}
                    </tspan>
                )}
            </text>
        </g>
    );
};

// ============================================================================
// --- SUB-COMPONENT: ADVANCED STUDENT COMPARISON CHART ---
// ============================================================================

const CHART_COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#a855f7', // Purple
    '#0ea5e9', // Sky Blue
    '#ec4899', // Pink
    '#14b8a6', // Teal
];

const StudentComparisonPanel = ({
    uniqueStudents,
    dateRange,
}: {
    uniqueStudents: any[];
    dateRange: any;
}) => {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [lookbackDays, setLookbackDays] = useState<number>(30);

    const dynamicDateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - lookbackDays);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, [lookbackDays]);

    const toggleStudent = (id: number) => {
        setSelectedIds((prev) => {
            if (prev.includes(id))
                return prev.filter((existingId) => existingId !== id);
            if (prev.length >= 4) {
                toast.error('Maximum 4 learners allowed for comparison.');
                return prev;
            }
            return [...prev, id];
        });
    };

    const getStudentColor = useCallback(
        (studentId: number) => {
            const index = uniqueStudents.findIndex((s) => s.id === studentId);
            return CHART_COLORS[(index >= 0 ? index : 0) % CHART_COLORS.length];
        },
        [uniqueStudents],
    );

    const studentQueries = useQueries({
        queries: selectedIds.map((id) => ({
            queryKey: [
                'student-analytics',
                {
                    studentId: id,
                    ...dynamicDateRange,
                },
            ],
            queryFn: getStudentAnalytics,
            staleTime: 5 * 60 * 1000,
        })),
    });

    const isLoading = studentQueries.some((q) => q.isLoading);

    // ✨ FIX: Chronologically sorted Timeline Data
    const mergedTimelineData = useMemo(() => {
        const rawDates = new Set<string>();

        // 1. Collect every single date where ANY selected student played
        studentQueries.forEach((q) => {
            if (!q.data?.charts?.performanceTimeline) return;
            q.data.charts.performanceTimeline.forEach((entry: any) => {
                rawDates.add(entry.date); // e.g. "2026-03-01"
            });
        });

        // 2. Sort the dates chronologically (Oldest to Newest)
        const sortedDates = Array.from(rawDates).sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        );

        // 3. Map the sorted dates to the students' scores
        return sortedDates.map((dateStr) => {
            const formattedDate = format(new Date(dateStr), 'MMM dd');
            const row: any = { date: formattedDate };

            studentQueries.forEach((q, idx) => {
                if (!q.data?.charts?.performanceTimeline) return;
                const student = uniqueStudents.find(
                    (s) => s.id === selectedIds[idx],
                );
                const name = student?.firstName || `Student ${idx + 1}`;

                const studentEntry = q.data.charts.performanceTimeline.find(
                    (e: any) => e.date === dateStr,
                );
                if (studentEntry) {
                    row[name] = studentEntry.avgAccuracy;
                }
            });
            return row;
        });
    }, [studentQueries, selectedIds, uniqueStudents]);

    const mergedRadarData = useMemo(() => {
        const patternMap = new Map();
        studentQueries.forEach((q, idx) => {
            if (!q.data?.charts?.behavioralRadar) return;
            const student = uniqueStudents.find(
                (s) => s.id === selectedIds[idx],
            );
            const name = student?.firstName || `Student ${idx + 1}`;

            q.data.charts.behavioralRadar.forEach((entry: any) => {
                if (!patternMap.has(entry.pattern))
                    patternMap.set(entry.pattern, { pattern: entry.pattern });
                const existing = patternMap.get(entry.pattern);
                existing[name] = entry.intensityScore;
            });
        });

        const result = Array.from(patternMap.values());

        const defaultPatterns = [
            'Sustained Attention',
            'Task Execution',
            'Processing Speed',
        ];
        let padIndex = 0;

        while (result.length > 0 && result.length < 3) {
            const patName = defaultPatterns[padIndex % defaultPatterns.length];
            if (!result.find((r) => r.pattern === patName)) {
                result.push({ pattern: patName });
            }
            padIndex++;
        }

        return result;
    }, [studentQueries, selectedIds, uniqueStudents]);

    return (
        <Card className="rounded-[32px] border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
            <CardHeader className="border-b border-slate-50 px-8 py-6 bg-white">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                            <Users size={20} className="text-indigo-600" />{' '}
                            Multi-Learner Analytics
                        </CardTitle>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                            Compare cognitive and behavioral trends
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl w-full md:w-auto">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 w-24 text-right">
                                Last {lookbackDays} Days
                            </span>
                            <input
                                type="range"
                                min="7"
                                max="90"
                                step="1"
                                value={lookbackDays}
                                onChange={(e) =>
                                    setLookbackDays(Number(e.target.value))
                                }
                                className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 mr-2">
                                {selectedIds.map((id) => {
                                    const student = uniqueStudents.find(
                                        (s) => s.id === id,
                                    );
                                    if (!student) return null;
                                    const studentColor = getStudentColor(id);

                                    return (
                                        <Badge
                                            key={id}
                                            variant="outline"
                                            className="h-8 px-2.5 gap-1.5 bg-white shadow-sm border transition-all"
                                            style={{
                                                borderColor: studentColor,
                                                color: studentColor,
                                            }}
                                        >
                                            <div
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        studentColor,
                                                }}
                                            />
                                            {student.firstName}
                                            <button
                                                onClick={() =>
                                                    toggleStudent(id)
                                                }
                                                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} strokeWidth={3} />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-10 rounded-xl border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-widest bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm"
                                    >
                                        <Plus size={14} className="mr-2" /> Add
                                        Learner ({selectedIds.length}/4)
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 rounded-xl p-1 z-[100] shadow-xl border-slate-100"
                                >
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
                                        Select Students
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                        {uniqueStudents.length === 0 ? (
                                            <div className="p-3 text-xs text-slate-500 text-center">
                                                No learners found
                                            </div>
                                        ) : (
                                            uniqueStudents.map((student) => (
                                                <DropdownMenuCheckboxItem
                                                    key={student.id}
                                                    checked={selectedIds.includes(
                                                        student.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleStudent(
                                                            student.id,
                                                        )
                                                    }
                                                    className="rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded-full mr-2"
                                                        style={{
                                                            backgroundColor:
                                                                getStudentColor(
                                                                    student.id,
                                                                ),
                                                        }}
                                                    />
                                                    {student.firstName}{' '}
                                                    {student.lastName}
                                                </DropdownMenuCheckboxItem>
                                            ))
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8 bg-slate-50/30">
                {selectedIds.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                        <Target size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                            Select learners to generate charts
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-3">
                        <Loader2
                            size={32}
                            className="animate-spin text-indigo-500"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Compiling Data...
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* LINE CHART: Performance Over Time */}
                        <div className="col-span-1 lg:col-span-8 h-[350px]">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                Accuracy Trends Over Time
                            </h4>
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
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e2e8f0"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
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
                                        tick={{
                                            fontSize: 10,
                                            fill: '#64748b',
                                            fontWeight: 600,
                                        }}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow:
                                                '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        }}
                                        itemStyle={{
                                            fontSize: '12px',
                                            fontWeight: 700,
                                        }}
                                        labelStyle={{
                                            fontSize: '10px',
                                            color: '#94a3b8',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            marginBottom: '4px',
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        wrapperStyle={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            marginTop: '20px',
                                        }}
                                    />
                                    {selectedIds.map((id) => {
                                        const student = uniqueStudents.find(
                                            (s) => s.id === id,
                                        );
                                        if (!student) return null;
                                        const studentColor =
                                            getStudentColor(id);

                                        return (
                                            <Line
                                                key={id}
                                                type="monotone"
                                                dataKey={student.firstName}
                                                stroke={studentColor}
                                                strokeWidth={3}
                                                // ✨ FIX: connectNulls ensures the line bridges empty days smoothly!
                                                connectNulls={true}
                                                dot={{
                                                    r: 4,
                                                    strokeWidth: 2,
                                                    fill: '#fff',
                                                }}
                                                activeDot={{
                                                    r: 6,
                                                    strokeWidth: 0,
                                                }}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* RADAR CHART: Behavioral Profile */}
                        <div className="col-span-1 lg:col-span-4 h-[350px] flex flex-col items-center">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 w-full text-left">
                                Behavioral Overlap
                            </h4>
                            <div className="w-full flex-1">
                                {mergedRadarData.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        {/* ✨ FIX: Shrunk outerRadius from 70% to 55% so text labels have room to render */}
                                        <RadarChart
                                            cx="50%"
                                            cy="50%"
                                            outerRadius="55%"
                                            data={mergedRadarData}
                                        >
                                            <PolarGrid stroke="#e2e8f0" />
                                            {/* ✨ FIX: Used our new custom tick component to text-wrap the labels */}
                                            <PolarAngleAxis
                                                dataKey="pattern"
                                                tick={renderRadarTick}
                                            />
                                            <PolarRadiusAxis
                                                angle={30}
                                                domain={[0, 100]}
                                                tick={false}
                                                axisLine={false}
                                            />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow:
                                                        '0 4px 15px rgba(0,0,0,0.1)',
                                                }}
                                            />
                                            {selectedIds.map((id) => {
                                                const student =
                                                    uniqueStudents.find(
                                                        (s) => s.id === id,
                                                    );
                                                if (!student) return null;
                                                const studentColor =
                                                    getStudentColor(id);

                                                return (
                                                    <Radar
                                                        key={id}
                                                        name={student.firstName}
                                                        dataKey={
                                                            student.firstName
                                                        }
                                                        stroke={studentColor}
                                                        fill={studentColor}
                                                        fillOpacity={0.15}
                                                        strokeWidth={2}
                                                    />
                                                );
                                            })}
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Not enough AI data
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- SUB-COMPONENT: Stat Card ---
const DashboardStatCard = ({
    title,
    value,
    trend,
    icon,
    colorClass,
    isLoading,
}: any) => (
    <div className="bg-white rounded-[24px] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group h-full">
        <div
            className={cn(
                'absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:opacity-[0.07]',
                colorClass,
            )}
        >
            {React.cloneElement(icon as React.ReactElement<{ size?: number }>, {
                size: 90,
            })}
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div
                className={cn(
                    'p-2.5 rounded-xl',
                    colorClass
                        .replace('text-', 'bg-')
                        .replace('600', '50')
                        .replace('500', '50'),
                )}
            >
                {React.cloneElement(
                    icon as React.ReactElement<{
                        size?: number;
                        className?: string;
                    }>,
                    {
                        size: 18,
                        className: colorClass,
                    },
                )}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                {title}
            </span>
        </div>
        <div className="relative z-10">
            {isLoading ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-xl mb-1" />
            ) : (
                <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    {value}
                </div>
            )}
            {trend && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-500" />{' '}
                    {trend}
                </div>
            )}
        </div>
    </div>
);

// --- SUB-COMPONENT: Pending Feed Item ---
const ActivityFeedItem = ({
    session,
    isLast,
}: {
    session: ActivitySessionResponse;
    isLast: boolean;
}) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
        [ActivitySessionStatus.Completed]: {
            label: 'Done',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        },
        [ActivitySessionStatus.InProgress]: {
            label: 'Live',
            className:
                'bg-indigo-50 text-indigo-700 border-indigo-200/60 animate-pulse',
        },
        [ActivitySessionStatus.Queued]: {
            label: 'Queued',
            className: 'bg-blue-50 text-blue-700 border-blue-200/60',
        },
        [ActivitySessionStatus.Pending]: {
            label: 'Pending',
            className: 'bg-amber-50 text-amber-700 border-amber-200/60',
        },
        [ActivitySessionStatus.Cancelled]: {
            label: 'Void',
            className: 'bg-rose-50 text-rose-700 border-rose-200/60',
        },
        [ActivitySessionStatus.Paused]: {
            label: 'Paused',
            className: 'bg-orange-50 text-orange-700 border-orange-200/60',
        },
        [ActivitySessionStatus.Abandoned]: {
            label: 'Dropped',
            className: 'bg-slate-50 text-slate-600 border-slate-200/60',
        },
        [ActivitySessionStatus.Reschedule]: {
            label: 'Resched',
            className: 'bg-violet-50 text-violet-700 border-violet-200/60',
        },
    };

    const statusKey =
        session.activitySessionStatus || ActivitySessionStatus.Pending;
    const { label, className } =
        statusConfig[statusKey] || statusConfig[ActivitySessionStatus.Pending];

    return (
        <div className="flex gap-4 relative group">
            <div className="flex flex-col items-center shrink-0 w-10">
                <div className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 z-10 group-hover:border-indigo-200 group-hover:shadow-sm transition-all overflow-hidden">
                    <Avatar className="h-full w-full rounded-xl">
                        <AvatarImage
                            src={FormatService.formatStrapiMedia(
                                session.activity?.banner,
                                'thumbnail',
                            )}
                            className="object-cover"
                        />
                        <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600 font-black uppercase">
                            {session.activity?.name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </div>
                {!isLast && (
                    <div className="w-px flex-1 bg-slate-100 my-1 group-hover:bg-slate-200 transition-colors" />
                )}
            </div>
            <div className="flex-1 pb-6 pt-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                            {session.activity?.name || 'Unnamed Activity'}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="text-indigo-600">
                                {session.student?.firstName}{' '}
                                {session.student?.lastName?.charAt(0)}.
                            </span>
                            <span className="opacity-40">•</span>
                            <span className="tabular-nums flex items-center gap-1">
                                <Clock size={10} />{' '}
                                {session.startAt
                                    ? format(
                                          new Date(session.startAt),
                                          'h:mm a',
                                      )
                                    : '--:--'}
                            </span>
                        </p>
                    </div>
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-[9px] h-5 px-2 font-black uppercase tracking-widest border',
                            className,
                        )}
                    >
                        {label}
                    </Badge>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Recent Log Item ---
const RecentLogItem = ({ session }: { session: ActivitySessionResponse }) => {
    const status = session.activitySessionStatus?.toLowerCase();
    const isCompleted = status === 'completed';
    const isAbandoned = status === 'abandoned' || status === 'cancelled';

    const effectiveDate =
        session.actualEndAt || session.updatedAt || session.actualStartAt;
    const timeAgo =
        effectiveDate && !isNaN(new Date(effectiveDate).getTime())
            ? formatDistanceToNow(new Date(effectiveDate), { addSuffix: true })
            : 'Unknown time';

    return (
        <Link
            href={`/activity-sessions/${session.documentId}`}
            className="group flex flex-col p-4 border-b border-slate-100 hover:bg-slate-50/80 transition-colors last:border-0 relative overflow-hidden"
        >
            <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-start gap-3 min-w-0">
                    <div
                        className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110',
                            isCompleted
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : isAbandoned
                                  ? 'bg-rose-50 border-rose-100 text-rose-600'
                                  : 'bg-slate-50 border-slate-200 text-slate-600',
                        )}
                    >
                        {isCompleted ? (
                            <Check size={14} strokeWidth={3} />
                        ) : isAbandoned ? (
                            <X size={14} strokeWidth={3} />
                        ) : (
                            <History size={14} />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                            {session.activity?.name || 'Session Activity'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span className="text-slate-700">
                                {session.student?.firstName}{' '}
                                {session.student?.lastName?.charAt(0)}.
                            </span>
                            <span className="opacity-40">•</span>
                            <span className="lowercase normal-case tracking-normal font-medium flex items-center gap-1">
                                <Clock size={10} /> {timeAgo}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5">
                    {session.aiRecommendation ? (
                        <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200 text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5"
                        >
                            AI Ready
                        </Badge>
                    ) : (
                        <div className="h-5 flex items-center">
                            <ChevronRight
                                size={14}
                                className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                            />
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function Dashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSessionData, setSelectedSessionData] = useState<{
        primary: ActivitySessionResponse;
        allDay: ActivitySessionResponse[];
    } | null>(null);

    const [visibleLogsCount, setVisibleLogsCount] = useState(5);

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: me });

    const { data: activitySessions = [] } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                populate: {
                    student: { populate: '*' },
                    activity: { populate: '*' },
                },
                sort: ['updatedAt:desc'],
            },
        ],
        queryFn: getActivitySessionsNew,
    });

    const dateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, []);

    const { data: globalAnalytics, isLoading: isLoadingAnalytics } = useQuery({
        queryKey: ['global-analytics', dateRange],
        queryFn: getGlobalAnalytics,
    });

    // ✨ FIX: Extract Unique Students strictly by Integer ID
    const uniqueStudents = useMemo(() => {
        const map = new Map();
        activitySessions.forEach((s: any) => {
            if (s.student && s.student.id) {
                map.set(s.student.id, s.student);
            }
        });
        return Array.from(map.values());
    }, [activitySessions]);

    const pendingQueue = activitySessions
        .filter(
            (s: any) =>
                s.activitySessionStatus === ActivitySessionStatus.Pending ||
                s.activitySessionStatus === ActivitySessionStatus.Queued,
        )
        .sort(
            (a: any, b: any) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );

    const pastSessions = useMemo(() => {
        return activitySessions
            .filter((s: any) => {
                const stat = s.activitySessionStatus?.toLowerCase();
                return (
                    stat === 'completed' ||
                    stat === 'abandoned' ||
                    stat === 'cancelled'
                );
            })
            .sort((a: any, b: any) => {
                const dateA = new Date(a.actualEndAt || a.updatedAt).getTime();
                const dateB = new Date(b.actualEndAt || b.updatedAt).getTime();
                return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
            });
    }, [activitySessions]);

    const strictlyQueuedSessions = pendingQueue
        .filter(
            (s: any) =>
                s.activitySessionStatus === ActivitySessionStatus.Queued,
        )
        .sort(
            (a: any, b: any) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );

    const { data: liveActivitySessionsRaw = [] } = useQuery({
        queryKey: [
            'live-activity-sessions',
            {
                populate: {
                    student: { populate: '*' },
                    activity: { populate: '*' },
                },
                filters: {
                    $or: [
                        {
                            activitySessionStatus: {
                                $eq: ActivitySessionStatus.InProgress,
                            },
                        },
                        {
                            activitySessionStatus: {
                                $eq: ActivitySessionStatus.Paused,
                            },
                        },
                    ],
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        refetchInterval: 3000,
    });

    const activeSession =
        Array.isArray(liveActivitySessionsRaw) &&
        liveActivitySessionsRaw.length > 0
            ? liveActivitySessionsRaw[0]
            : null;

    const handleViewSession = (
        session: ActivitySessionResponse,
        dayActivities: ActivitySessionResponse[],
    ) => {
        setIsSheetOpen(false);
        setSelectedSessionData({ primary: session, allDay: dayActivities });
        setIsModalOpen(true);
    };

    const handleLaunchSingleGame = async (session: ActivitySessionResponse) => {
        if (activeSession) {
            toast.error('Session in Progress', {
                description:
                    'Complete current activity before starting a new block.',
            });
            return;
        }
        setIsSheetOpen(false);
        setIsModalOpen(false);
        const toastId = toast.loading('Initiating secure handshake...');
        try {
            await updateActivitySession(session.documentId, {
                activitySessionStatus: ActivitySessionStatus.InProgress,
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            toast.success('Activity Activated', { id: toastId });
        } catch (error) {
            toast.error('Failed to launch session. Check connection.', {
                id: toastId,
            });
        }
    };

    const handleLaunchSequence = async (
        selectedSessions: ActivitySessionResponse[],
    ) => {
        if (activeSession) {
            toast.error('Session in Progress', {
                description:
                    'Complete current activity before starting a new block.',
            });
            return;
        }
        if (!selectedSessions || selectedSessions.length === 0) return;
        setIsSheetOpen(false);
        setIsModalOpen(false);
        const toastId = toast.loading('Initiating Sequence...', {
            description: 'Queueing activities in the database.',
        });
        try {
            const firstSession = selectedSessions[0];
            const queuedSessions = selectedSessions.slice(1);
            await updateActivitySession(firstSession.documentId, {
                activitySessionStatus: ActivitySessionStatus.InProgress,
            });
            if (queuedSessions.length > 0) {
                await Promise.all(
                    queuedSessions.map((session) =>
                        updateActivitySession(session.documentId, {
                            activitySessionStatus: ActivitySessionStatus.Queued,
                        }),
                    ),
                );
            }
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            toast.success('Sequence Activated & Queued', { id: toastId });
        } catch (error) {
            toast.error('Failed to process sequence.', { id: toastId });
        }
    };

    const handleRemoveQueueItem = async (documentId: string) => {
        try {
            await updateActivitySession(documentId, {
                activitySessionStatus: ActivitySessionStatus.Pending,
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            toast.success('Removed from sequence queue');
        } catch (e) {
            toast.error('Failed to remove item from queue');
        }
    };

    const { overviewMetrics } = globalAnalytics || {};
    const widgetSession = activeSession || strictlyQueuedSessions[0];
    const widgetQueued = activeSession
        ? strictlyQueuedSessions
        : strictlyQueuedSessions.slice(1);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden relative">
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.2]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-10">
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                            <Zap size={14} className="fill-indigo-600" />{' '}
                            Command Center
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                            Good day, {user?.firstName || 'Therapist'}
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2">
                            You have{' '}
                            <span className="text-slate-900 font-bold">
                                {pendingQueue.length} pending sessions
                            </span>{' '}
                            scheduled for today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="relative h-12 rounded-2xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 font-bold text-[10px] uppercase tracking-widest px-6 transition-all shadow-sm"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    My Activities
                                    {pendingQueue.length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 ring-2 ring-white shadow-sm">
                                            <span className="relative inline-flex rounded-full text-[9px] font-black text-white">
                                                {pendingQueue.length > 9
                                                    ? '9+'
                                                    : pendingQueue.length}
                                            </span>
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-full sm:min-w-[320px] p-0 border-l border-slate-100 shadow-2xl flex flex-col h-full bg-slate-50/50"
                            >
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Daily Agenda</SheetTitle>
                                    <SheetDescription>
                                        Overview
                                    </SheetDescription>
                                </SheetHeader>
                                <ScheduleQueue
                                    sessions={activitySessions}
                                    onSessionClick={handleViewSession}
                                />
                            </SheetContent>
                        </Sheet>
                        <NotificationCenter />
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardStatCard
                        title="Total Sessions"
                        value={overviewMetrics?.totalSessionsCompleted || 0}
                        trend="Completed 30d"
                        icon={<Presentation />}
                        colorClass="text-indigo-600"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Global Avg Accuracy"
                        value={`${overviewMetrics?.averageAccuracy || 0}%`}
                        trend="Overall Network"
                        icon={<Target />}
                        colorClass="text-emerald-600"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Total Therapy Time"
                        value={`${overviewMetrics?.totalTherapyHours || 0}h`}
                        trend="Hours Logged 30d"
                        icon={<Clock />}
                        colorClass="text-blue-500"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Active Learners"
                        value={overviewMetrics?.totalStudentsRegistered || 0}
                        trend="Total Engaged"
                        icon={<SmilePlus />}
                        colorClass="text-amber-500"
                        isLoading={isLoadingAnalytics}
                    />
                </section>

                <section className="grid grid-cols-12 gap-6 items-start">
                    <div className="col-span-12 lg:col-span-8">
                        <Card className="rounded-[32px] border border-slate-200 shadow-sm overflow-hidden bg-white h-[650px] flex flex-col">
                            <CardHeader className="border-b border-slate-50 px-8 py-6 bg-white flex flex-row items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                                        <CalendarIcon
                                            size={18}
                                            className="text-indigo-600"
                                        />{' '}
                                        Clinical Schedule
                                    </CardTitle>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                        Timeline view of all assigned activities
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 min-h-0 bg-slate-50/30">
                                <ActivityCalendar />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-auto lg:h-[650px]">
                        <Card className="rounded-[32px] border border-slate-200 shadow-sm bg-white flex flex-col flex-1 min-h-[313px] overflow-hidden">
                            <CardHeader className="border-b border-slate-50 px-6 py-5 flex flex-row items-center justify-between shrink-0 bg-white z-10">
                                <div className="flex items-center gap-2">
                                    <Sparkles
                                        size={16}
                                        className="text-indigo-500 fill-indigo-500"
                                    />
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                        Up Next
                                    </span>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest"
                                >
                                    {pendingQueue.length} Queue
                                </Badge>
                            </CardHeader>
                            <div className="flex-1 overflow-y-auto p-5 relative custom-scrollbar bg-slate-50/30">
                                {pendingQueue.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                                        <CalendarIcon
                                            size={32}
                                            className="mb-3 opacity-20 text-indigo-600"
                                        />
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                            No pending sessions
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        {pendingQueue.map(
                                            (
                                                session: ActivitySessionResponse,
                                                i: number,
                                            ) => (
                                                <ActivityFeedItem
                                                    key={
                                                        session.id ||
                                                        session.documentId
                                                    }
                                                    session={session}
                                                    isLast={
                                                        i ===
                                                        pendingQueue.length - 1
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="rounded-[32px] border border-slate-200 shadow-sm bg-white flex flex-col flex-1 min-h-[313px] overflow-hidden">
                            <CardHeader className="border-b border-slate-50 px-6 py-5 flex flex-row items-center justify-between shrink-0 bg-white z-10">
                                <div className="flex items-center gap-2">
                                    <History
                                        size={16}
                                        className="text-emerald-500"
                                    />
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                        Recent Logs
                                    </span>
                                </div>
                                <Link href="/activity-sessions">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[9px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest"
                                    >
                                        View All
                                    </Button>
                                </Link>
                            </CardHeader>
                            <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-slate-50/30">
                                {pastSessions.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                                        <ActivityIcon
                                            size={32}
                                            className="mb-3 opacity-20 text-emerald-600"
                                        />
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                            No historical data
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col pb-2">
                                        {pastSessions
                                            .slice(0, visibleLogsCount)
                                            .map(
                                                (
                                                    session: ActivitySessionResponse,
                                                ) => (
                                                    <RecentLogItem
                                                        key={session.documentId}
                                                        session={session}
                                                    />
                                                ),
                                            )}
                                        {visibleLogsCount <
                                            pastSessions.length && (
                                            <div className="p-4 flex justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setVisibleLogsCount(
                                                            (prev) => prev + 5,
                                                        )
                                                    }
                                                    className="rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                                >
                                                    Load More History
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </section>

                <section>
                    <StudentComparisonPanel
                        uniqueStudents={uniqueStudents}
                        dateRange={dateRange}
                    />
                </section>

                <div className="h-24 w-full shrink-0" aria-hidden="true" />
            </div>

            {selectedSessionData && (
                <ActivitySequenceLauncher
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    learnerName={`${selectedSessionData.primary.student?.firstName} ${selectedSessionData.primary.student?.lastName}`}
                    existingSession={selectedSessionData.primary}
                    activities={selectedSessionData.allDay}
                    onLaunchActivity={handleLaunchSingleGame}
                    onLaunchFullSession={handleLaunchSequence}
                />
            )}

            <AnimatePresence>
                {widgetSession && (
                    <LiveSessionWidget
                        key="live-session-widget"
                        session={widgetSession}
                        queuedSessions={widgetQueued}
                        onLaunchNext={handleLaunchSingleGame}
                        onRemoveQueueItem={handleRemoveQueueItem}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// --- LIVE SESSION WIDGET SUB-COMPONENT ---
// ============================================================================
function LiveSessionWidget({
    session,
    queuedSessions,
    onRemoveQueueItem,
}: {
    session: ActivitySessionResponse;
    queuedSessions: ActivitySessionResponse[];
    onLaunchNext: (session: ActivitySessionResponse) => void;
    onRemoveQueueItem: (documentId: string) => void;
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarView, setSidebarView] = useState<
        'queue' | 'telemetry' | 'settings'
    >('queue');

    // ✨ PIN Toggle State
    const [showBigPin, setShowBigPin] = useState(false);

    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [clinicalNotes, setClinicalNotes] = useState(
        session?.clinicalObservations || '',
    );
    const feedEndRef = useRef<HTMLDivElement>(null);

    const [autoStartEnabled, setAutoStartEnabled] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [isLearnerControlEnabled, setIsLearnerControlEnabled] = useState(
        session?.enableLearnerControls || false,
    );
    const [isHandsFree, setIsHandsFree] = useState(
        session?.isHandsFree || false,
    );
    const [isAdaptive, setIsAdaptive] = useState(
        session?.enableAdaptiveDifficulty !== false,
    );

    const queryClient = useQueryClient();
    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const isDragging = useRef(false);

    // ✨ ANTI-CRASH SAFETY: Fallbacks so the widget survives the 500ms unmount animation
    const safeStudent = session?.student || {};
    const safeActivity = session?.activity || {};
    const passcode = safeStudent.activePasscode || '------';

    // Safely enforce telemetry as an array to prevent .filter() crashes
    const telemetryLogs = Array.isArray(session?.rawTelemetry)
        ? session.rawTelemetry
        : [];

    // ✨ STATE MACHINE LOGIC ✨
    const isPreLaunch = ['pending', 'queued', 'reschedule'].includes(
        session?.activitySessionStatus,
    );
    const isPaused = session?.activitySessionStatus === 'paused';
    const isUnstarted = !session?.actualStartAt;
    const isAwaitingHandshake = !isPreLaunch && isUnstarted;

    // Always show PIN if unstarted. If active, obey the toggle button.
    const shouldDisplayPin = isUnstarted || showBigPin;

    // ✨ AUTO-REVERT PIN: Security timer to hide PIN after 10 seconds of viewing
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (showBigPin && !isUnstarted) {
            timer = setTimeout(() => setShowBigPin(false), 10000);
        }
        return () => clearTimeout(timer);
    }, [showBigPin, isUnstarted]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedHandsFree = localStorage.getItem(
                'therapist_hands_free',
            );
            if (storedHandsFree !== null)
                setIsHandsFree(storedHandsFree === 'true');
            const storedAutoStart = localStorage.getItem(
                'therapist_auto_start',
            );
            if (storedAutoStart !== null)
                setAutoStartEnabled(storedAutoStart === 'true');
        }
    }, []);

    useEffect(() => {
        if (sidebarView === 'telemetry') {
            feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [telemetryLogs.length, sidebarView]);

    const updateSessionMutation = useMutation({
        mutationFn: (data: Partial<any>) =>
            updateActivitySession(session.documentId, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
        },
    });

    const { mutateAsync } = updateSessionMutation;

    // ✨ RENEW PIN MUTATION ✨
    const renewPinMutation = useMutation({
        mutationFn: async () => {
            if (!safeStudent.id) throw new Error('Student ID missing');
            const newPin = Math.floor(
                100000 + Math.random() * 900000,
            ).toString();

            await updateStudentPasscode(safeStudent.id, newPin);

            return newPin;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            toast.success('Passcode Renewed', {
                description: 'A fresh secure PIN has been generated.',
            });
        },
        onError: () => {
            toast.error('Failed to renew PIN. Check connection.');
        },
    });

    // ✨ AUTO-GENERATE PIN IF MISSING ✨
    useEffect(() => {
        if (
            isUnstarted &&
            safeStudent.id &&
            !safeStudent.activePasscode &&
            !renewPinMutation.isPending
        ) {
            renewPinMutation.mutate();
        }
    }, [
        isUnstarted,
        safeStudent.id,
        safeStudent.activePasscode,
        renewPinMutation,
    ]);

    // ✨ COPY PIN HANDLER ✨
    const handleCopyPin = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (passcode && passcode !== '------') {
            navigator.clipboard.writeText(passcode);
            toast.success('PIN Copied!', {
                description: 'You can now paste it into the learner device.',
                icon: '📋',
            });
        } else {
            toast.error('No PIN available to copy.');
        }
    };

    type ConfirmType =
        | 'stop_unstarted'
        | 'stop_active'
        | 'confirm_skip'
        | 'confirm_hands_free'
        | 'confirm_auto_start'
        | 'stop_all'
        | null;
    const [confirmType, setConfirmType] = useState<ConfirmType>(null);

    // ✨ EMERGENCY STOP ALL SESSIONS ✨
    const handleStopAll = async () => {
        const toastId = toast.loading('Cancelling all sessions...');
        try {
            await updateActivitySession(session.documentId, {
                activitySessionStatus: ActivitySessionStatus.Cancelled,
            });

            if (queuedSessions.length > 0) {
                await Promise.all(
                    queuedSessions.map((qs) =>
                        updateActivitySession(qs.documentId, {
                            activitySessionStatus:
                                ActivitySessionStatus.Cancelled,
                        }),
                    ),
                );
            }

            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });

            toast.success('Emergency Stop: All sessions cancelled.', {
                id: toastId,
            });
            setConfirmType(null);
        } catch (e) {
            toast.error('Failed to cancel all sessions.', { id: toastId });
        }
    };

    // ✨ SEQUENTIAL SKIP LOGIC (Handles both PreLaunch and Active) ✨
    const executeSkipCurrent = async (isAuto = false) => {
        const toastId = toast.loading(
            isAuto
                ? 'Auto-advancing sequence...'
                : 'Skipping to next activity...',
        );
        try {
            // 1. Resolve the current session explicitly first
            const resolveStatus = isUnstarted
                ? ActivitySessionStatus.Cancelled
                : ActivitySessionStatus.Completed;
            await updateActivitySession(session.documentId, {
                activitySessionStatus: resolveStatus,
                actualEndAt: new Date().toISOString(),
            });

            // 2. Start the next session if it exists
            if (queuedSessions.length > 0) {
                const next = queuedSessions[0];
                const handsFreePayload = isHandsFree
                    ? { isHandsFree: true }
                    : { isHandsFree: false };

                await updateActivitySession(next.documentId, {
                    activitySessionStatus: ActivitySessionStatus.InProgress,
                    ...handsFreePayload,
                });

                toast.success(
                    `Launched Next Activity: ${next.activity?.name}`,
                    { id: toastId },
                );
            } else {
                toast.success(
                    isAuto
                        ? 'Time Limit Reached. Queue is empty.'
                        : 'Session ended. Queue is empty.',
                    { id: toastId },
                );
            }

            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            setConfirmType(null);
        } catch (e) {
            toast.error('Failed to process skip request.', { id: toastId });
        }
    };

    // ✨ RESOLVE UNSTARTED SESSIONS ✨
    const resolveUnstarted = async (choice: 'reschedule' | 'cancelled') => {
        setConfirmType(null);
        const newStatus = choice === 'reschedule' ? 'reschedule' : 'cancelled';
        const toastId = toast.loading('Updating session...');
        try {
            await mutateAsync({ activitySessionStatus: newStatus });
            toast.success(
                `Session marked as ${choice === 'reschedule' ? 'Rescheduled' : 'Cancelled'}.`,
                { id: toastId },
            );
        } catch (e) {
            toast.error('Failed to process session update.', { id: toastId });
        }
    };

    const handleSaveNotes = async () => {
        try {
            await mutateAsync({ clinicalObservations: clinicalNotes });
            toast.success('Clinical observations saved', { id: 'obs-toast' });
            setIsNotesOpen(false);
        } catch (e) {
            toast.error('Failed to save observations', { id: 'obs-toast' });
        }
    };

    const appendQuickNote = (note: string) => {
        setClinicalNotes(
            clinicalNotes ? `${clinicalNotes}\n- ${note}` : `- ${note}`,
        );
    };

    const toggleAdaptiveDifficulty = async (checked: boolean) => {
        setIsAdaptive(checked);
        try {
            await mutateAsync({ enableAdaptiveDifficulty: checked });
            toast.success(
                checked
                    ? 'Adaptive Difficulty Enabled'
                    : 'Difficulty Level Locked',
                { id: 'set-toast' },
            );
        } catch (e) {
            toast.error('Failed to update settings', { id: 'set-toast' });
        }
    };

    const handleHandsFreeToggle = (checked: boolean) => {
        if (checked && !autoStartEnabled) setConfirmType('confirm_hands_free');
        else executeHandsFreeToggle(checked);
    };

    const executeHandsFreeToggle = async (
        checked: boolean,
        overrideAutoStart: boolean = false,
    ) => {
        setConfirmType(null);
        setIsHandsFree(checked);
        if (typeof window !== 'undefined')
            localStorage.setItem('therapist_hands_free', String(checked));
        if (overrideAutoStart) {
            setAutoStartEnabled(true);
            if (typeof window !== 'undefined')
                localStorage.setItem('therapist_auto_start', 'true');
        }
        try {
            await mutateAsync({ isHandsFree: checked });
            toast.success(
                checked
                    ? 'Hands-Free Flow Active'
                    : 'Manual Handshake Restored',
                { id: 'set-toast' },
            );
        } catch (e) {
            toast.error('Failed to update Flow Mode', { id: 'set-toast' });
        }
    };

    const handleAutoStartToggle = (checked: boolean) => {
        if (!checked && isHandsFree) setConfirmType('confirm_auto_start');
        else executeAutoStartToggle(checked);
    };

    const executeAutoStartToggle = async (
        checked: boolean,
        overrideHandsFree: boolean = false,
    ) => {
        setConfirmType(null);
        setAutoStartEnabled(checked);
        if (typeof window !== 'undefined')
            localStorage.setItem('therapist_auto_start', String(checked));
        if (overrideHandsFree) {
            setIsHandsFree(false);
            if (typeof window !== 'undefined')
                localStorage.setItem('therapist_hands_free', 'false');
            try {
                await mutateAsync({ isHandsFree: false });
                toast.info('Hands-Free automatically disabled.', {
                    id: 'set-toast',
                });
            } catch (e) {
                console.error(e);
            }
        }
    };

    const toggleStudentControls = async (checked: boolean) => {
        setIsLearnerControlEnabled(checked);
        try {
            await mutateAsync({ enableLearnerControls: checked });
            toast.success(
                checked
                    ? 'Learner controls enabled'
                    : 'Learner controls locked',
                { id: 'set-toast' },
            );
        } catch (e) {
            toast.error('Failed to update settings', { id: 'set-toast' });
        }
    };

    const [dragOverLive, setDragOverLive] = useState(false);
    const [dragOverQueueId, setDragOverQueueId] = useState<string | null>(null);

    const constraintsRef = useRef<HTMLDivElement>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [localExtraTime, setLocalExtraTime] = useState(
        session?.extraTimeSeconds || 0,
    );

    useEffect(() => {
        if (!debounceTimerRef.current) {
            setLocalExtraTime(session?.extraTimeSeconds || 0);
        }
    }, [session?.extraTimeSeconds]);

    const durationMinutes = safeActivity.durationMinutes;
    const hasTimer =
        durationMinutes !== null &&
        durationMinutes !== undefined &&
        durationMinutes > 0;
    const durationSeconds = hasTimer
        ? durationMinutes * 60 + localExtraTime
        : 0;
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timeLeft = hasTimer
        ? Math.max(0, durationSeconds - elapsedSeconds)
        : 0;
    const isReady =
        !session?.actualStartAt ||
        elapsedSeconds > 0 ||
        timeLeft < durationSeconds;

    const handleAdjustTime = (secondsDelta: number) => {
        const predictedTimeLeft = timeLeft + secondsDelta;
        if (hasTimer && predictedTimeLeft < 0) {
            toast.error('Cannot reduce time below zero', { id: 'time-toast' });
            return;
        }

        const newExtra = localExtraTime + secondsDelta;
        setLocalExtraTime(newExtra);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(async () => {
            try {
                await mutateAsync({ extraTimeSeconds: newExtra });
                const offsetMins = newExtra / 60;
                const sign = offsetMins > 0 ? '+' : '';
                toast.success(
                    `Time Adjusted: ${sign}${offsetMins} min total offset`,
                    { id: 'time-toast' },
                );
            } catch (e) {
                setLocalExtraTime(session?.extraTimeSeconds || 0);
                toast.error('Failed to sync timer', { id: 'time-toast' });
            } finally {
                debounceTimerRef.current = null;
            }
        }, 1000);
    };

    const totalAnswers = telemetryLogs.length;
    const correctAnswers = telemetryLogs.filter(
        (log: any) => log?.isCorrect === true,
    ).length;
    const liveAccuracy =
        totalAnswers > 0
            ? Math.round((correctAnswers / totalAnswers) * 100)
            : 0;

    const handleSwapWithLive = async (droppedDocId: string) => {
        setDragOverLive(false);
        if (
            isLocked ||
            session?.actualStartAt ||
            droppedDocId === session?.documentId
        )
            return;
        const droppedItem = queuedSessions.find(
            (q) => q.documentId === droppedDocId,
        );
        if (!droppedItem) return;

        const toastId = toast.loading('Swapping sessions...');
        try {
            await updateActivitySession(session.documentId, {
                activitySessionStatus: ActivitySessionStatus.Queued,
                startAt: droppedItem.startAt,
            });
            await updateActivitySession(droppedDocId, {
                activitySessionStatus: session.activitySessionStatus,
                actualStartAt: null,
                startAt: session.startAt,
            });
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            toast.success('Switched successfully!', { id: toastId });
        } catch (e: any) {
            toast.error('Failed to swap sessions', { id: toastId });
        }
    };

    const handleReorderQueue = async (
        droppedDocId: string,
        targetDocId: string,
    ) => {
        setDragOverQueueId(null);
        if (isLocked || droppedDocId === targetDocId) return;
        const droppedItem = queuedSessions.find(
            (q) => q.documentId === droppedDocId,
        );
        const targetItem = queuedSessions.find(
            (q) => q.documentId === targetDocId,
        );
        if (!droppedItem || !targetItem) return;

        try {
            await updateActivitySession(droppedDocId, {
                startAt: targetItem.startAt,
            });
            await updateActivitySession(targetDocId, {
                startAt: droppedItem.startAt,
            });
            await queryClient.invalidateQueries({
                queryKey: ['live-activity-sessions'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
        } catch (e) {
            toast.error('Failed to reorder');
        }
    };

    const handlePause = async (reason: string) => {
        try {
            const newLog = {
                status: 'pause',
                timestamp: new Date().toISOString(),
                reason,
            };
            await mutateAsync({
                activitySessionStatus: 'paused',
                timeLogs: [...(session?.timeLogs || []), newLog],
            });
            toast.success(`Session Paused: ${reason}`, { id: 'status-toast' });
        } catch (e) {
            toast.error('Failed to pause session.', { id: 'status-toast' });
        }
    };

    const handleResume = async () => {
        try {
            const newLog = {
                status: 'resume',
                timestamp: new Date().toISOString(),
            };
            await mutateAsync({
                activitySessionStatus: ActivitySessionStatus.InProgress,
                timeLogs: [...(session?.timeLogs || []), newLog],
            });
            toast.success('Session Resumed', { id: 'status-toast' });
        } catch (e) {
            toast.error('Failed to resume session.', { id: 'status-toast' });
        }
    };

    const handleStartQueued = async (e?: any) => {
        if (e) e.stopPropagation();
        try {
            await mutateAsync({
                activitySessionStatus: ActivitySessionStatus.InProgress,
            });
            toast.success(`Launched ${safeActivity.name}. Awaiting learner.`);
        } catch (err: any) {
            const msg = err.response?.data?.error?.message || err.message;
            if (msg.includes('active session running'))
                toast.error(
                    'Rejected: Learner already has an active session running.',
                    { duration: 5000 },
                );
            else toast.error('Failed to start session.');
        }
    };

    const handleStop = useCallback(
        async (isAuto = false, confirmed = false) => {
            if (!isAuto && !confirmed) {
                if (isUnstarted) setConfirmType('stop_unstarted');
                else setConfirmType('stop_active');
                return;
            }
            try {
                await mutateAsync({
                    activitySessionStatus: 'completed',
                    actualEndAt: new Date().toISOString(),
                });
                if (isAuto) toast.info('Time limit reached. Auto-completed.');
                else toast.success('Session Concluded.');
                setConfirmType(null);
            } catch (e) {
                toast.error('Failed to update session status.');
            }
        },
        [mutateAsync, isUnstarted],
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const enforceBounds = () => {
            if (isDragging.current) return;
            const widgetHeight = isMinimized ? 72 : isNotesOpen ? 600 : 460;
            const widgetWidth = isMinimized ? 280 : isSidebarOpen ? 700 : 380;
            const minAllowedY = widgetHeight + 48 - window.innerHeight;
            const minAllowedX = widgetWidth + 48 - window.innerWidth;
            let targetY = y.get();
            let targetX = x.get();
            let needsSnap = false;

            if (targetY < minAllowedY) {
                targetY = minAllowedY;
                needsSnap = true;
            }
            if (targetX < minAllowedX) {
                targetX = minAllowedX;
                needsSnap = true;
            }
            if (targetY > 0) {
                targetY = 0;
                needsSnap = true;
            }
            if (targetX > 0) {
                targetX = 0;
                needsSnap = true;
            }

            if (needsSnap) {
                animate(y, targetY, {
                    type: 'spring',
                    bounce: 0,
                    duration: 0.4,
                });
                animate(x, targetX, {
                    type: 'spring',
                    bounce: 0,
                    duration: 0.4,
                });
            }
        };

        enforceBounds();
        window.addEventListener('resize', enforceBounds);
        return () => window.removeEventListener('resize', enforceBounds);
    }, [isMinimized, isSidebarOpen, isNotesOpen, x, y]);

    useEffect(() => {
        if (isUnstarted || !session?.actualStartAt) return;
        let isAutoStopping = false;

        const calculateElapsed = (
            timeLogs: TimeLog[],
            startAt: string,
            sessionStatus: string,
        ) => {
            if (!startAt) return 0;
            const startMs = new Date(startAt).getTime();
            const nowMs = Date.now();
            const grossMs = nowMs - startMs;

            if (!timeLogs || timeLogs.length === 0) {
                if (sessionStatus === 'paused') return 0;
                return Math.floor(grossMs / 1000);
            }

            let totalPausedMs = 0;
            let lastPauseMs: number | null = null;
            const sortedLogs = [...timeLogs].sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
            );

            sortedLogs.forEach((log) => {
                const time = new Date(log.timestamp).getTime();
                if (log.status === 'pause') {
                    lastPauseMs = time;
                } else if (
                    (log.status === 'resume' || log.status === 'start') &&
                    lastPauseMs !== null
                ) {
                    totalPausedMs += time - lastPauseMs;
                    lastPauseMs = null;
                }
            });

            if (lastPauseMs !== null) {
                totalPausedMs += nowMs - lastPauseMs;
            }
            return Math.max(0, Math.floor((grossMs - totalPausedMs) / 1000));
        };

        const tick = () => {
            if (isAutoStopping) return false;
            const elapsed = calculateElapsed(
                session?.timeLogs || [],
                session?.actualStartAt,
                session?.activitySessionStatus,
            );
            setElapsedSeconds(elapsed);

            if (hasTimer) {
                const remaining = durationSeconds - elapsed;
                if (
                    remaining <= 0 &&
                    session?.activitySessionStatus === 'in_progress'
                ) {
                    isAutoStopping = true;
                    if (autoStartEnabled && queuedSessions.length > 0)
                        executeSkipCurrent(true);
                    else handleStop(true);
                    return false;
                }
            }
            return true;
        };
        tick();

        if (session?.activitySessionStatus === 'in_progress') {
            const interval = setInterval(() => {
                const shouldContinue = tick();
                if (!shouldContinue) clearInterval(interval);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [
        session?.actualStartAt,
        session?.activitySessionStatus,
        session?.timeLogs,
        hasTimer,
        durationSeconds,
        handleStop,
        isUnstarted,
        autoStartEnabled,
        queuedSessions.length,
    ]);

    const formatTimeDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isCritical = hasTimer && timeLeft <= 60 && !isUnstarted && !isPaused;
    const progressPercentage =
        hasTimer && !isUnstarted
            ? Math.min(100, (elapsedSeconds / durationSeconds) * 100)
            : isUnstarted
              ? 0
              : 100;

    const targetWidth = isMinimized ? 280 : isSidebarOpen ? 700 : 380;
    const targetHeight = isMinimized ? 72 : isNotesOpen ? 600 : 460;
    const targetRadius = isMinimized ? 48 : 40;

    return (
        <>
            <AnimatePresence>
                {confirmType && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            transition={{
                                type: 'spring',
                                bounce: 0,
                                duration: 0.3,
                            }}
                            className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-6"
                        >
                            {/* --- SKIP CONFIRMATION MODAL --- */}
                            {confirmType === 'confirm_skip' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
                                            <SkipForward
                                                size={32}
                                                className="fill-current"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            {isUnstarted
                                                ? 'Skip Activity?'
                                                : 'Start Next Activity?'}
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            This will safely end the current
                                            activity and immediately launch the
                                            next one in the sequence.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                executeSkipCurrent(false)
                                            }
                                            className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Yes,{' '}
                                            {isUnstarted
                                                ? 'Skip'
                                                : 'Start Next'}
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* --- EMERGENCY STOP ALL MODAL --- */}
                            {confirmType === 'stop_all' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-2">
                                            <AlertOctagon size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            Emergency Stop All?
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            This will instantly cancel the
                                            current activity and ALL upcoming
                                            queued activities for this learner.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() => handleStopAll()}
                                            className="h-12 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel All Sessions
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Go Back
                                        </Button>
                                    </div>
                                </>
                            )}
                            {confirmType === 'confirm_hands_free' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-2">
                                            <Zap
                                                size={32}
                                                className="fill-current"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            Enable Seamless Flow?
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            Hands-Free mode requires
                                            Auto-Advance to seamlessly move the
                                            student into the next activity.{' '}
                                            <strong>
                                                This will enable both settings.
                                            </strong>
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                executeHandsFreeToggle(
                                                    true,
                                                    true,
                                                )
                                            }
                                            className="h-12 w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm"
                                        >
                                            Enable Both
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                            {confirmType === 'confirm_auto_start' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
                                            <AlertCircle size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            Disable Seamless Flow?
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            Turning off Auto-Advance breaks the
                                            continuous sequence. Because of
                                            this,{' '}
                                            <strong>
                                                Hands-Free mode will also be
                                                disabled.
                                            </strong>
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                executeAutoStartToggle(
                                                    false,
                                                    true,
                                                )
                                            }
                                            className="h-12 w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm"
                                        >
                                            Disable Both
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                            {confirmType === 'stop_unstarted' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
                                            <AlertCircle size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            Cancel Activity?
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            The learner has not initiated the
                                            handshake for this activity yet.
                                            Would you like to reschedule this
                                            for later or cancel it entirely?
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                resolveUnstarted('reschedule')
                                            }
                                            className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            <CalendarClock className="mr-2 h-4 w-4" />{' '}
                                            Reschedule for Later
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                resolveUnstarted('cancelled')
                                            }
                                            variant="outline"
                                            className="h-12 w-full rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />{' '}
                                            Cancel Activity
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Go Back
                                        </Button>
                                    </div>
                                </>
                            )}
                            {confirmType === 'stop_active' && (
                                <>
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
                                            <Square
                                                size={28}
                                                className="fill-current"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            End Activity?
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                            Are you sure you want to conclude
                                            the current activity early? This
                                            will save the current progress and
                                            log the telemetry.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        <Button
                                            onClick={() =>
                                                handleStop(false, true)
                                            }
                                            className="h-12 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Yes, End Activity
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmType(null)}
                                            variant="ghost"
                                            className="h-12 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                ref={constraintsRef}
                className="fixed inset-6 pointer-events-none z-40"
            />

            <motion.div
                drag
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                dragConstraints={constraintsRef}
                dragElastic={0}
                onDragStart={() => {
                    isDragging.current = true;
                }}
                onDragEnd={() => {
                    isDragging.current = false;
                }}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    width: targetWidth,
                    height: targetHeight,
                    borderRadius: targetRadius,
                }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                className={cn(
                    'fixed bottom-6 right-6 z-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/80 ring-1 ring-slate-900/5',
                    isMinimized
                        ? 'bg-white/95 backdrop-blur-2xl'
                        : 'bg-white/90 backdrop-blur-3xl',
                )}
                style={{ x, y, touchAction: 'none' }}
            >
                <AnimatePresence mode="wait">
                    {isMinimized ? (
                        <motion.div
                            key="minimized"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full relative group cursor-grab active:cursor-grabbing p-2 pr-3.5 flex items-center gap-3 transition-colors hover:bg-white/50"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-10 w-10 rounded-full border-2 border-white shadow-sm">
                                    <AvatarImage
                                        src={FormatService.formatStrapiMedia(
                                            safeStudent.profilePicture,
                                            'thumbnail',
                                        )}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                        {safeStudent.firstName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                                    <span
                                        className={cn(
                                            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                            isPaused
                                                ? 'bg-amber-400'
                                                : isPreLaunch
                                                  ? 'bg-blue-400'
                                                  : isCritical
                                                    ? 'bg-rose-400'
                                                    : 'bg-indigo-400',
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white',
                                            isPaused
                                                ? 'bg-amber-500'
                                                : isPreLaunch
                                                  ? 'bg-blue-500'
                                                  : isCritical
                                                    ? 'bg-rose-500'
                                                    : 'bg-indigo-500',
                                        )}
                                    />
                                </span>
                            </div>

                            <div
                                className="flex flex-col justify-center min-w-[90px] cursor-pointer"
                                onPointerDownCapture={(e) =>
                                    e.stopPropagation()
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMinimized(false);
                                }}
                            >
                                {isReady ? (
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'text-base font-black tabular-nums tracking-tighter leading-none',
                                                isPaused
                                                    ? 'text-amber-500'
                                                    : isUnstarted
                                                      ? 'text-slate-700'
                                                      : isCritical
                                                        ? 'text-rose-500 animate-pulse'
                                                        : 'text-slate-900',
                                            )}
                                        >
                                            {!isUnstarted
                                                ? !session.actualStartAt
                                                    ? 'Waiting'
                                                    : formatTimeDuration(
                                                          hasTimer
                                                              ? timeLeft
                                                              : elapsedSeconds,
                                                      )
                                                : 'Ready'}
                                        </span>

                                        {isHandsFree && (
                                            <div className="flex items-center">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-emerald-50 text-emerald-600 font-bold text-[9px] px-1 border border-emerald-200"
                                                >
                                                    <Zap
                                                        size={10}
                                                        className="fill-current animate-pulse"
                                                    />
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="h-3 w-12 bg-slate-200 animate-pulse rounded" />
                                        <div className="h-1.5 w-16 bg-slate-100 animate-pulse rounded" />
                                    </div>
                                )}
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[100px] mt-0.5">
                                    {isPaused
                                        ? 'Paused'
                                        : isPreLaunch
                                          ? 'Queued'
                                          : isUnstarted
                                            ? 'Awaiting'
                                            : safeActivity.name}
                                </span>
                            </div>

                            <div className="h-6 w-px bg-slate-200/60 mx-0.5" />
                            <div className="flex items-center gap-0.5">
                                {isPreLaunch ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={
                                            updateSessionMutation.isPending
                                        }
                                        className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartQueued(e);
                                        }}
                                    >
                                        <PlayIcon
                                            size={14}
                                            className="fill-current"
                                        />
                                    </Button>
                                ) : isPaused ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={
                                            updateSessionMutation.isPending
                                        }
                                        className="h-8 w-8 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleResume();
                                        }}
                                    >
                                        <PlayIcon
                                            size={14}
                                            className="fill-current"
                                        />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={
                                            updateSessionMutation.isPending
                                        }
                                        className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmType('stop_active');
                                        }}
                                    >
                                        <Square
                                            size={14}
                                            className={
                                                isCritical
                                                    ? 'fill-rose-500 text-rose-500'
                                                    : 'fill-current'
                                            }
                                        />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMinimized(false);
                                    }}
                                >
                                    <Maximize2 size={14} />
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-row w-full h-full relative"
                        >
                            {/* --- LEFT PANEL (MAIN WIDGET) --- */}
                            <div className="w-[380px] shrink-0 h-full flex flex-col relative z-10">
                                <div
                                    onPointerDown={(e) => dragControls.start(e)}
                                    className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing group shrink-0"
                                >
                                    <div className="w-12 h-1.5 rounded-full bg-slate-300/60 group-hover:bg-slate-400 transition-colors" />
                                </div>

                                <div className="px-7 pb-7 flex-1 flex flex-col justify-between">
                                    <div className="flex flex-row items-start justify-between">
                                        <div className="flex gap-3 items-center">
                                            <Avatar className="h-12 w-12 rounded-2xl shadow-sm border border-white/80">
                                                <AvatarImage
                                                    src={FormatService.formatStrapiMedia(
                                                        safeStudent.profilePicture,
                                                        'thumbnail',
                                                    )}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-slate-100 text-indigo-600 font-bold text-base rounded-2xl">
                                                    {safeStudent.firstName?.charAt(
                                                        0,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span
                                                            className={cn(
                                                                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                                                isPaused
                                                                    ? 'bg-amber-400'
                                                                    : isPreLaunch
                                                                      ? 'bg-blue-400'
                                                                      : 'bg-indigo-400',
                                                            )}
                                                        />
                                                        <span
                                                            className={cn(
                                                                'relative inline-flex rounded-full h-1.5 w-1.5',
                                                                isPaused
                                                                    ? 'bg-amber-500'
                                                                    : isPreLaunch
                                                                      ? 'bg-blue-500'
                                                                      : 'bg-indigo-500',
                                                            )}
                                                        />
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'text-[9px] font-bold uppercase tracking-widest',
                                                            isPaused
                                                                ? 'text-amber-600'
                                                                : 'text-indigo-600',
                                                        )}
                                                    >
                                                        {isPaused
                                                            ? 'Session Paused'
                                                            : isPreLaunch
                                                              ? 'Queued Activity'
                                                              : isUnstarted
                                                                ? 'Awaiting Handshake'
                                                                : 'Live Session'}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-slate-900 leading-tight truncate max-w-[160px]">
                                                    {safeActivity.name}
                                                </h3>

                                                {!isUnstarted &&
                                                    session.actualStartAt &&
                                                    (isHandsFree ? (
                                                        <div className="mt-1 flex items-center">
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-emerald-50 text-emerald-600 font-bold text-[9px] px-2 border border-emerald-200"
                                                            >
                                                                <Zap
                                                                    size={10}
                                                                    className="mr-1 fill-current animate-pulse"
                                                                />{' '}
                                                                Hands-Free
                                                                Active
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-1 flex items-center gap-2 max-w-[180px]">
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-indigo-50 text-indigo-700 font-black text-[9px] px-1.5 shrink-0 border border-indigo-100"
                                                            >
                                                                {liveAccuracy}%
                                                                Accuracy
                                                            </Badge>
                                                            {telemetryLogs.length >
                                                                0 &&
                                                                (() => {
                                                                    const lastLog =
                                                                        telemetryLogs[
                                                                            telemetryLogs.length -
                                                                                1
                                                                        ] as {
                                                                            isCorrect: boolean;
                                                                            targetId: string;
                                                                        };
                                                                    return (
                                                                        <span className="text-[10px] text-slate-500 font-medium truncate">
                                                                            {lastLog.isCorrect
                                                                                ? '✅'
                                                                                : '❌'}{' '}
                                                                            Last:{' '}
                                                                            <span className="font-bold">
                                                                                {
                                                                                    lastLog.targetId
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                    );
                                                                })()}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-1 bg-white/50 rounded-full p-1 shadow-sm border border-white shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        'h-8 w-8 rounded-full transition-colors',
                                                        isSidebarOpen
                                                            ? 'bg-white text-indigo-600 shadow-sm'
                                                            : 'text-slate-500 hover:text-indigo-600 hover:bg-white',
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsSidebarOpen(
                                                            !isSidebarOpen,
                                                        );
                                                    }}
                                                    onPointerDown={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {isSidebarOpen ? (
                                                        <PanelRightClose
                                                            size={15}
                                                        />
                                                    ) : (
                                                        <PanelRightOpen
                                                            size={15}
                                                        />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsMinimized(true);
                                                    }}
                                                    onPointerDown={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Minimize2 size={15} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ✨ PERFECTED DROPZONE vs NEW PRO PIN UI ✨ */}
                                    <div
                                        className={cn(
                                            'w-full flex flex-col items-center justify-center py-2 transition-all duration-300 relative',
                                            dragOverLive &&
                                                !session.actualStartAt &&
                                                !isLocked
                                                ? 'bg-indigo-50/80 rounded-[2rem] ring-2 ring-indigo-400 border-dashed border-2 border-indigo-300 scale-[1.02] shadow-inner mt-4'
                                                : 'bg-transparent ring-0 mt-2',
                                        )}
                                        onDragOver={(e) => {
                                            if (
                                                !session.actualStartAt &&
                                                !isLocked
                                            ) {
                                                e.preventDefault();
                                                setDragOverLive(true);
                                            }
                                        }}
                                        onDragLeave={() =>
                                            setDragOverLive(false)
                                        }
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            handleSwapWithLive(
                                                e.dataTransfer.getData(
                                                    'text/plain',
                                                ),
                                            );
                                        }}
                                    >
                                        <div className="w-full flex flex-col items-center justify-center min-h-[140px]">
                                            {/* Priority 1: If dragging, ONLY show the dropzone */}
                                            {dragOverLive &&
                                            !session.actualStartAt &&
                                            !isLocked ? (
                                                <div className="text-center w-full pointer-events-none py-6">
                                                    <RefreshCw
                                                        size={32}
                                                        className="text-indigo-400 mx-auto mb-2 animate-spin"
                                                    />
                                                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                                                        Drop to Swap Activity
                                                    </span>
                                                </div>
                                            ) : !isReady ? (
                                                <div className="h-16 w-48 bg-slate-100 animate-pulse rounded-2xl" />
                                            ) : shouldDisplayPin ? (
                                                <motion.div
                                                    key="pin-view"
                                                    initial={{
                                                        opacity: 0,
                                                        y: 5,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex flex-col items-center w-full pointer-events-auto"
                                                >
                                                    {/* ✨ NEW SECURE PIN CARD DESIGN ✨ */}
                                                    <div className="bg-white border border-slate-200/60 rounded-[24px] p-5 shadow-sm w-full max-w-[280px] relative transition-all group">
                                                        {/* Top Right Tool Actions */}
                                                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                                onClick={
                                                                    handleCopyPin
                                                                }
                                                                title="Copy PIN"
                                                            >
                                                                <Copy
                                                                    size={13}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={
                                                                    renewPinMutation.isPending
                                                                }
                                                                className="h-7 w-7 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    renewPinMutation.mutate();
                                                                }}
                                                                title="Generate New PIN"
                                                            >
                                                                <RefreshCw
                                                                    size={13}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                    className={
                                                                        renewPinMutation.isPending
                                                                            ? 'animate-spin'
                                                                            : ''
                                                                    }
                                                                />
                                                            </Button>
                                                        </div>

                                                        {/* Header & Info */}
                                                        <div className="flex items-center gap-1.5 mb-4 text-indigo-400">
                                                            <Lock
                                                                size={14}
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                                                                Learner PIN
                                                            </span>
                                                            <div className="group/tooltip relative">
                                                                <Info
                                                                    size={12}
                                                                    className="text-slate-300 hover:text-indigo-400 cursor-help transition-colors"
                                                                />
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-[9px] font-medium leading-relaxed rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity text-center z-50 shadow-lg">
                                                                    Give this
                                                                    6-digit PIN
                                                                    to the
                                                                    student.
                                                                    They will
                                                                    enter it on
                                                                    their device
                                                                    to connect.
                                                                    {/* Little triangle arrow pointing down */}
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* The PIN Block (Fully Selectable) */}
                                                        <div className="flex items-center justify-center w-full bg-slate-50 rounded-[14px] py-4 border border-slate-100/50 relative overflow-hidden">
                                                            {/* Subtle shine effect */}
                                                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />

                                                            <span
                                                                title="Double click to copy"
                                                                className={cn(
                                                                    'text-4xl font-black text-indigo-600 tracking-[0.4em] ml-3 font-mono leading-none select-all cursor-text',
                                                                    renewPinMutation.isPending
                                                                        ? 'opacity-50 blur-[2px] animate-pulse'
                                                                        : 'opacity-100 transition-all duration-300',
                                                                )}
                                                            >
                                                                {passcode}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {!isUnstarted ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setShowBigPin(
                                                                    false,
                                                                )
                                                            }
                                                            className="mt-4 h-8 rounded-full px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        >
                                                            Return to Timer
                                                            (10s)
                                                        </Button>
                                                    ) : (
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4">
                                                            Awaiting Learner
                                                            Handshake
                                                        </p>
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="timer-view"
                                                    initial={{
                                                        opacity: 0,
                                                        y: 5,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex flex-col items-center w-full pointer-events-auto"
                                                >
                                                    <div className="flex items-center justify-center gap-6 w-full px-4">
                                                        {hasTimer ? (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-10 w-10 rounded-full border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
                                                                onClick={() =>
                                                                    handleAdjustTime(
                                                                        -60,
                                                                    )
                                                                }
                                                                disabled={
                                                                    updateSessionMutation.isPending ||
                                                                    timeLeft <=
                                                                        60
                                                                }
                                                                title="Reduce 1 minute"
                                                            >
                                                                <Minus
                                                                    size={16}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            </Button>
                                                        ) : (
                                                            <div className="w-10" />
                                                        )}

                                                        <div className="flex flex-col items-center justify-center min-w-[150px]">
                                                            <span
                                                                className={cn(
                                                                    'text-6xl font-black tabular-nums tracking-tighter leading-none',
                                                                    isPaused
                                                                        ? 'text-amber-500'
                                                                        : isCritical
                                                                          ? 'text-rose-500 animate-pulse'
                                                                          : 'text-slate-800',
                                                                )}
                                                            >
                                                                {formatTimeDuration(
                                                                    hasTimer
                                                                        ? timeLeft
                                                                        : elapsedSeconds,
                                                                )}
                                                            </span>
                                                        </div>

                                                        {hasTimer ? (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-10 w-10 rounded-full border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
                                                                onClick={() =>
                                                                    handleAdjustTime(
                                                                        60,
                                                                    )
                                                                }
                                                                disabled={
                                                                    updateSessionMutation.isPending
                                                                }
                                                                title="Add 1 minute"
                                                            >
                                                                <Plus
                                                                    size={16}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            </Button>
                                                        ) : (
                                                            <div className="w-10" />
                                                        )}
                                                    </div>

                                                    {safeStudent.activePasscode && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setShowBigPin(
                                                                    true,
                                                                )
                                                            }
                                                            className="mt-3 h-7 rounded-full px-4 text-[9px] uppercase tracking-widest font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        >
                                                            View Session PIN
                                                        </Button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* PROGRESS BAR */}
                                        {session.actualStartAt &&
                                            !isUnstarted &&
                                            !dragOverLive &&
                                            !showBigPin && (
                                                <div className="w-full px-3 mt-5 flex flex-col gap-1.5 pointer-events-none">
                                                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                                        <span className="flex items-center gap-1">
                                                            <PlayIcon
                                                                size={8}
                                                            />{' '}
                                                            {format(
                                                                new Date(
                                                                    session.actualStartAt,
                                                                ),
                                                                'h:mm a',
                                                            )}
                                                        </span>
                                                        {hasTimer && (
                                                            <span className="flex items-center gap-1">
                                                                <Flag
                                                                    size={8}
                                                                />{' '}
                                                                {format(
                                                                    new Date(
                                                                        new Date(
                                                                            session.actualStartAt,
                                                                        ).getTime() +
                                                                            durationSeconds *
                                                                                1000,
                                                                    ),
                                                                    'h:mm a',
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={cn(
                                                                'h-full rounded-full transition-all duration-1000 shadow-sm',
                                                                isPaused
                                                                    ? 'bg-amber-400'
                                                                    : isCritical
                                                                      ? 'bg-rose-500'
                                                                      : 'bg-indigo-500',
                                                            )}
                                                            style={{
                                                                width: `${progressPercentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                    </div>

                                    <div
                                        className="flex flex-col w-full mt-2"
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                    >
                                        <div className="flex items-center justify-between gap-2 w-full">
                                            {isPreLaunch ? (
                                                <>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmType(
                                                                'stop_unstarted',
                                                            );
                                                        }}
                                                        disabled={
                                                            updateSessionMutation.isPending
                                                        }
                                                        variant="outline"
                                                        className="flex-1 h-10 rounded-xl border-slate-200/60 bg-white/50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all px-2"
                                                    >
                                                        <Square className="mr-1.5 h-3.5 w-3.5 fill-current shrink-0" />
                                                        Cancel
                                                    </Button>

                                                    {queuedSessions.length >
                                                        0 && (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmType(
                                                                    'confirm_skip',
                                                                );
                                                            }}
                                                            disabled={
                                                                updateSessionMutation.isPending
                                                            }
                                                            className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all border border-slate-700 px-2"
                                                        >
                                                            <SkipForward className="mr-1.5 h-3.5 w-3.5 fill-current shrink-0" />
                                                            Skip
                                                        </Button>
                                                    )}

                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartQueued(
                                                                e,
                                                            );
                                                        }}
                                                        disabled={
                                                            updateSessionMutation.isPending
                                                        }
                                                        className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all border border-indigo-500 shadow-indigo-600/20 px-2"
                                                    >
                                                        {updateSessionMutation.isPending ? (
                                                            <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5 shrink-0" />
                                                        ) : (
                                                            <PlayIcon className="mr-1.5 h-3.5 w-3.5 fill-current shrink-0" />
                                                        )}{' '}
                                                        Start
                                                    </Button>
                                                </>
                                            ) : isAwaitingHandshake ? (
                                                <>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmType(
                                                                'stop_unstarted',
                                                            );
                                                        }}
                                                        disabled={
                                                            updateSessionMutation.isPending
                                                        }
                                                        variant="outline"
                                                        className="flex-1 h-10 rounded-xl border-slate-200/60 bg-white/50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                                                    >
                                                        {updateSessionMutation.isPending &&
                                                        queuedSessions.length ===
                                                            0 ? (
                                                            <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                                                        ) : (
                                                            <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
                                                        )}{' '}
                                                        Cancel
                                                    </Button>
                                                    {queuedSessions.length >
                                                        0 && (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmType(
                                                                    'confirm_skip',
                                                                );
                                                            }}
                                                            disabled={
                                                                updateSessionMutation.isPending
                                                            }
                                                            className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all border border-slate-700"
                                                        >
                                                            {updateSessionMutation.isPending ? (
                                                                <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                                                            ) : (
                                                                <SkipForward className="mr-1.5 h-3.5 w-3.5 fill-current" />
                                                            )}{' '}
                                                            Skip
                                                        </Button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStop(false);
                                                        }}
                                                        disabled={
                                                            updateSessionMutation.isPending
                                                        }
                                                        variant="outline"
                                                        className="flex-1 h-10 rounded-xl border-slate-200/60 bg-white/50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                                                    >
                                                        {updateSessionMutation.isPending &&
                                                        queuedSessions.length ===
                                                            0 ? (
                                                            <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                                                        ) : (
                                                            <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
                                                        )}{' '}
                                                        Stop
                                                    </Button>
                                                    {isPaused ? (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleResume();
                                                            }}
                                                            disabled={
                                                                updateSessionMutation.isPending
                                                            }
                                                            className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                                                        >
                                                            <PlayIcon className="mr-1.5 h-3.5 w-3.5 fill-current" />{' '}
                                                            Resume
                                                        </Button>
                                                    ) : (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    disabled={
                                                                        updateSessionMutation.isPending
                                                                    }
                                                                    variant="outline"
                                                                    className="flex-1 h-10 rounded-xl border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                                                                >
                                                                    <Pause className="mr-1.5 h-3.5 w-3.5 fill-current" />{' '}
                                                                    Pause
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="center"
                                                                className="w-56 rounded-xl z-[100] shadow-xl border-slate-100"
                                                            >
                                                                <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
                                                                    Select
                                                                    Reason
                                                                </div>
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        handlePause(
                                                                            'Bathroom Break',
                                                                        )
                                                                    }
                                                                    className="gap-2 cursor-pointer py-2"
                                                                >
                                                                    <Droplets
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-blue-500"
                                                                    />{' '}
                                                                    Bathroom
                                                                    Break
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        handlePause(
                                                                            'Behavioral Issue',
                                                                        )
                                                                    }
                                                                    className="gap-2 cursor-pointer py-2"
                                                                >
                                                                    <BrainCircuit
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-indigo-500"
                                                                    />{' '}
                                                                    Behavioral
                                                                    Issue
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        handlePause(
                                                                            'Tech Issue',
                                                                        )
                                                                    }
                                                                    className="gap-2 cursor-pointer py-2"
                                                                >
                                                                    <MonitorX
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-rose-500"
                                                                    />{' '}
                                                                    Tech Issue
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        handlePause(
                                                                            'Fatigue / Break',
                                                                        )
                                                                    }
                                                                    className="gap-2 cursor-pointer py-2"
                                                                >
                                                                    <BatteryWarning
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-amber-500"
                                                                    />{' '}
                                                                    Fatigue /
                                                                    Break
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        handlePause(
                                                                            'Other',
                                                                        )
                                                                    }
                                                                    className="gap-2 cursor-pointer py-2 border-t mt-1 text-slate-600"
                                                                >
                                                                    <HelpCircle
                                                                        size={
                                                                            14
                                                                        }
                                                                    />{' '}
                                                                    Other
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                    {queuedSessions.length >
                                                        0 && (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmType(
                                                                    'confirm_skip',
                                                                );
                                                            }}
                                                            disabled={
                                                                updateSessionMutation.isPending
                                                            }
                                                            className={cn(
                                                                'flex-1 h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all border',
                                                                isHandsFree
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20'
                                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/20',
                                                            )}
                                                        >
                                                            {updateSessionMutation.isPending ? (
                                                                <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                                                            ) : (
                                                                <SkipForward className="mr-1.5 h-3.5 w-3.5 fill-current" />
                                                            )}{' '}
                                                            {isHandsFree
                                                                ? 'Auto-Next'
                                                                : 'Next'}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="mt-3 border-t border-slate-200/50 pt-3">
                                            <Collapsible
                                                open={isNotesOpen}
                                                onOpenChange={setIsNotesOpen}
                                                className={cn(
                                                    'rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300',
                                                    isNotesOpen
                                                        ? 'border border-indigo-200 ring-4 ring-indigo-50'
                                                        : 'border border-slate-200/60 hover:border-slate-300',
                                                )}
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <button
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className={cn(
                                                            'w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all outline-none',
                                                            isNotesOpen
                                                                ? 'bg-indigo-50/50 text-indigo-700'
                                                                : 'bg-transparent text-slate-600',
                                                        )}
                                                    >
                                                        <div className="flex items-center">
                                                            <StickyNote
                                                                size={14}
                                                                className="mr-2"
                                                            />
                                                            {isNotesOpen
                                                                ? 'Close Observations'
                                                                : 'Clinical Observations'}
                                                        </div>
                                                        <ChevronDown
                                                            size={16}
                                                            className={cn(
                                                                'transition-transform duration-300',
                                                                isNotesOpen &&
                                                                    'rotate-180',
                                                            )}
                                                        />
                                                    </button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2">
                                                    <div className="p-3 pt-0 flex flex-col gap-2 bg-white">
                                                        <textarea
                                                            value={
                                                                clinicalNotes
                                                            }
                                                            onChange={(e) =>
                                                                setClinicalNotes(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Add session notes here..."
                                                            className="w-full h-24 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:bg-white focus:border-indigo-400 transition-colors custom-scrollbar placeholder:text-slate-400"
                                                            onPointerDown={(
                                                                e,
                                                            ) =>
                                                                e.stopPropagation()
                                                            }
                                                        />
                                                        <div
                                                            className="flex gap-2 overflow-x-auto custom-scrollbar pb-1"
                                                            onPointerDown={(
                                                                e,
                                                            ) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    appendQuickNote(
                                                                        'Distracted',
                                                                    )
                                                                }
                                                                className="shrink-0 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[9px] font-bold text-slate-600 transition-colors"
                                                            >
                                                                + Distracted
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    appendQuickNote(
                                                                        'Required Prompt',
                                                                    )
                                                                }
                                                                className="shrink-0 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[9px] font-bold text-slate-600 transition-colors"
                                                            >
                                                                + Req Prompt
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    appendQuickNote(
                                                                        'Frustrated',
                                                                    )
                                                                }
                                                                className="shrink-0 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[9px] font-bold text-slate-600 transition-colors"
                                                            >
                                                                + Frustrated
                                                            </button>
                                                        </div>
                                                        <Button
                                                            onClick={
                                                                handleSaveNotes
                                                            }
                                                            onPointerDown={(
                                                                e,
                                                            ) =>
                                                                e.stopPropagation()
                                                            }
                                                            disabled={
                                                                updateSessionMutation.isPending ||
                                                                clinicalNotes ===
                                                                    session.clinicalObservations
                                                            }
                                                            className="w-full h-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] uppercase tracking-widest transition-colors"
                                                        >
                                                            {updateSessionMutation.isPending ? (
                                                                <Loader2
                                                                    size={12}
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <Save
                                                                    size={14}
                                                                    className="mr-1.5"
                                                                />
                                                            )}{' '}
                                                            Save Notes
                                                        </Button>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- RIGHT PANEL (SIDEBAR) --- */}
                            {isSidebarOpen && (
                                <div className="w-[320px] shrink-0 h-full flex flex-col border-l border-slate-200/50 bg-slate-50/50">
                                    <div
                                        className="p-3 w-full shrink-0 border-b border-slate-200/40 bg-white/30"
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                    >
                                        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl">
                                            <button
                                                onClick={() =>
                                                    setSidebarView('queue')
                                                }
                                                className={cn(
                                                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all',
                                                    sidebarView === 'queue'
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700',
                                                )}
                                            >
                                                <ListTodo size={12} /> Queue
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setSidebarView('telemetry')
                                                }
                                                className={cn(
                                                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all',
                                                    sidebarView === 'telemetry'
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700',
                                                )}
                                            >
                                                <ActivitySquare size={12} />{' '}
                                                Live Feed
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setSidebarView('settings')
                                                }
                                                className={cn(
                                                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all',
                                                    sidebarView === 'settings'
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700',
                                                )}
                                            >
                                                <Settings2 size={12} /> Config
                                            </button>
                                        </div>
                                    </div>

                                    {/* --- VIEW 1: QUEUE --- */}
                                    {sidebarView === 'queue' && (
                                        <div className="flex flex-col h-full overflow-hidden w-full">
                                            <div className="flex flex-col px-5 py-4 w-full shrink-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Up Next (
                                                        {queuedSessions.length})
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            'h-6 w-6 rounded-md',
                                                            isLocked
                                                                ? 'text-rose-500 bg-rose-50'
                                                                : 'text-slate-400 hover:bg-slate-200',
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsLocked(
                                                                !isLocked,
                                                            );
                                                        }}
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        {isLocked ? (
                                                            <Lock size={12} />
                                                        ) : (
                                                            <Unlock size={12} />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2 custom-scrollbar w-full">
                                                {queuedSessions.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                        <ListTodo
                                                            size={24}
                                                            className="mb-2"
                                                        />
                                                        <p className="text-xs font-medium text-center">
                                                            Queue is empty
                                                        </p>
                                                    </div>
                                                ) : (
                                                    queuedSessions.map((qs) => (
                                                        <motion.div
                                                            layout
                                                            key={
                                                                qs.id ||
                                                                qs.documentId
                                                            }
                                                            draggable={
                                                                !isLocked
                                                            }
                                                            onDragStart={(
                                                                e: any,
                                                            ) => {
                                                                e.dataTransfer.setData(
                                                                    'text/plain',
                                                                    qs.documentId,
                                                                );
                                                                e.dataTransfer.effectAllowed =
                                                                    'move';
                                                            }}
                                                            onDragOver={(
                                                                e: any,
                                                            ) => {
                                                                if (isLocked)
                                                                    return;
                                                                e.preventDefault();
                                                                setDragOverQueueId(
                                                                    qs.documentId,
                                                                );
                                                            }}
                                                            onDragLeave={() =>
                                                                setDragOverQueueId(
                                                                    null,
                                                                )
                                                            }
                                                            onDrop={(
                                                                e: any,
                                                            ) => {
                                                                e.preventDefault();
                                                                handleReorderQueue(
                                                                    e.dataTransfer.getData(
                                                                        'text/plain',
                                                                    ),
                                                                    qs.documentId,
                                                                );
                                                            }}
                                                            className={cn(
                                                                'group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300',
                                                                !isLocked
                                                                    ? 'cursor-grab active:cursor-grabbing'
                                                                    : 'cursor-default',
                                                                dragOverQueueId ===
                                                                    qs.documentId
                                                                    ? 'bg-indigo-50 border-indigo-300 shadow-md scale-[1.02] z-10'
                                                                    : 'border-white bg-white/60 hover:bg-white hover:border-indigo-100 hover:shadow-sm',
                                                            )}
                                                        >
                                                            <Avatar className="h-8 w-8 rounded-lg shadow-sm shrink-0 pointer-events-none">
                                                                <AvatarImage
                                                                    src={FormatService.formatStrapiMedia(
                                                                        qs
                                                                            .activity
                                                                            ?.banner,
                                                                        'thumbnail',
                                                                    )}
                                                                />
                                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold rounded-lg text-[10px]">
                                                                    {qs.activity?.name?.charAt(
                                                                        0,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0 pointer-events-none">
                                                                <h3 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-700 transition-colors leading-tight">
                                                                    {
                                                                        qs
                                                                            .activity
                                                                            ?.name
                                                                    }
                                                                </h3>
                                                                <span className="text-[9px] font-mono font-semibold text-slate-400">
                                                                    {FormatService.formatTime(
                                                                        qs.startAt,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                                                onPointerDown={(
                                                                    e,
                                                                ) =>
                                                                    e.stopPropagation()
                                                                }
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    onRemoveQueueItem(
                                                                        qs.documentId,
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2
                                                                    size={12}
                                                                />
                                                            </Button>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* --- VIEW 2: TELEMETRY --- */}
                                    {sidebarView === 'telemetry' && (
                                        <div className="flex flex-col h-full overflow-hidden w-full">
                                            {!isUnstarted &&
                                                session.actualStartAt && (
                                                    <div
                                                        className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 p-3 shrink-0 flex items-center justify-between"
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            Live Accuracy
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                'font-black text-sm px-3 shadow-sm',
                                                                liveAccuracy >=
                                                                    80
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                    : liveAccuracy <=
                                                                        40
                                                                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100',
                                                            )}
                                                        >
                                                            {liveAccuracy}%
                                                        </Badge>
                                                    </div>
                                                )}
                                            <div
                                                className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar"
                                                onPointerDown={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {telemetryLogs.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                        <ActivitySquare
                                                            size={28}
                                                            className="mb-3 opacity-50"
                                                        />
                                                        <p className="text-sm font-medium text-center">
                                                            Awaiting data...
                                                        </p>
                                                    </div>
                                                ) : (
                                                    telemetryLogs.map(
                                                        (
                                                            log: any,
                                                            idx: number,
                                                        ) => (
                                                            <div
                                                                key={idx}
                                                                className={cn(
                                                                    'bg-white rounded-xl p-3 border shadow-sm flex items-start gap-3 transition-all',
                                                                    log.metadata
                                                                        ?.levelShift ===
                                                                        'up'
                                                                        ? 'border-emerald-200 bg-emerald-50/30'
                                                                        : log
                                                                                .metadata
                                                                                ?.levelShift ===
                                                                            'down'
                                                                          ? 'border-amber-200 bg-amber-50/30'
                                                                          : 'border-slate-200 hover:border-indigo-200 hover:shadow-md',
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-inner',
                                                                        log.isCorrect
                                                                            ? 'bg-emerald-100 text-emerald-600'
                                                                            : 'bg-rose-100 text-rose-600',
                                                                    )}
                                                                >
                                                                    {log.isCorrect ? (
                                                                        <Check
                                                                            size={
                                                                                14
                                                                            }
                                                                            strokeWidth={
                                                                                3
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <X
                                                                            size={
                                                                                14
                                                                            }
                                                                            strokeWidth={
                                                                                3
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-xs font-bold text-slate-900 truncate">
                                                                            {log.action ===
                                                                            'tap'
                                                                                ? 'Tapped'
                                                                                : log.action ===
                                                                                    'click'
                                                                                  ? 'Clicked'
                                                                                  : log.action}{' '}
                                                                            <span
                                                                                className={cn(
                                                                                    'font-black',
                                                                                    log.isCorrect
                                                                                        ? 'text-indigo-600'
                                                                                        : 'text-rose-500',
                                                                                )}
                                                                            >
                                                                                {
                                                                                    log.targetId
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                        <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">
                                                                            {log.timestamp &&
                                                                            !isNaN(
                                                                                new Date(
                                                                                    log.timestamp,
                                                                                ).getTime(),
                                                                            )
                                                                                ? format(
                                                                                      new Date(
                                                                                          log.timestamp,
                                                                                      ),
                                                                                      'HH:mm:ss',
                                                                                  )
                                                                                : '--:--:--'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                                                                        <span className="flex items-center gap-1">
                                                                            <MousePointer2
                                                                                size={
                                                                                    10
                                                                                }
                                                                            />{' '}
                                                                            {(
                                                                                log.responseTimeMs /
                                                                                1000
                                                                            ).toFixed(
                                                                                1,
                                                                            )}
                                                                            s
                                                                        </span>
                                                                        {(log
                                                                            .metadata
                                                                            ?.currentLevel ||
                                                                            log
                                                                                .metadata
                                                                                ?.difficulty) && (
                                                                            <span className="text-indigo-500">
                                                                                •
                                                                                Lvl{' '}
                                                                                {log
                                                                                    .metadata
                                                                                    .currentLevel ||
                                                                                    log
                                                                                        .metadata
                                                                                        .difficulty}
                                                                            </span>
                                                                        )}
                                                                        {log
                                                                            .metadata
                                                                            ?.levelShift ===
                                                                            'up' && (
                                                                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                                                <ArrowUpCircle
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                />{' '}
                                                                                Shift
                                                                                Up
                                                                            </span>
                                                                        )}
                                                                        {log
                                                                            .metadata
                                                                            ?.levelShift ===
                                                                            'down' && (
                                                                            <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                                                                <ArrowDownCircle
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                />{' '}
                                                                                Shift
                                                                                Down
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {!log.isCorrect &&
                                                                        log
                                                                            .metadata
                                                                            ?.expectedTarget && (
                                                                            <div className="mt-1 text-[10px] font-bold text-rose-400">
                                                                                Expected:{' '}
                                                                                {
                                                                                    log
                                                                                        .metadata
                                                                                        .expectedTarget
                                                                                }
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                                <div ref={feedEndRef} />
                                            </div>
                                        </div>
                                    )}

                                    {/* --- VIEW 3: SETTINGS --- */}
                                    {sidebarView === 'settings' && (
                                        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar w-full">
                                            <div
                                                className="p-5 space-y-4 flex-1"
                                                onPointerDown={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 transition-colors">
                                                    <div className="relative flex items-center shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            className="peer sr-only"
                                                            checked={
                                                                isLearnerControlEnabled
                                                            }
                                                            onChange={(e) =>
                                                                toggleStudentControls(
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-900">
                                                            Learner Controls
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                                            Allow student to
                                                            pause the game on
                                                            their end.
                                                        </span>
                                                    </div>
                                                </label>
                                                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors space-y-1 hover:border-indigo-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-slate-900">
                                                            Adaptive Difficulty
                                                        </span>
                                                        <Switch
                                                            checked={isAdaptive}
                                                            onCheckedChange={
                                                                toggleAdaptiveDifficulty
                                                            }
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 leading-relaxed block">
                                                        If enabled, the game
                                                        will automatically
                                                        increase or decrease
                                                        difficulty based on
                                                        consecutive correct or
                                                        incorrect answers.
                                                    </span>
                                                </div>
                                                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors space-y-1 hover:border-indigo-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-slate-900">
                                                            Auto-Advance Queue
                                                        </span>
                                                        <Switch
                                                            checked={
                                                                autoStartEnabled
                                                            }
                                                            onCheckedChange={
                                                                handleAutoStartToggle
                                                            }
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 leading-relaxed block">
                                                        When the timer expires,
                                                        immediately start the
                                                        next queued session.
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'p-4 rounded-2xl border shadow-sm transition-colors space-y-1 hover:border-emerald-300',
                                                        isHandsFree
                                                            ? 'bg-emerald-50 border-emerald-200'
                                                            : 'bg-white border-slate-200',
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-slate-900">
                                                            Hands-Free Mode
                                                        </span>
                                                        <Switch
                                                            checked={
                                                                isHandsFree
                                                            }
                                                            onCheckedChange={
                                                                handleHandsFreeToggle
                                                            }
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 leading-relaxed block">
                                                        Bypass the student's
                                                        "Begin" handshake
                                                        screen, forcing the next
                                                        game to launch
                                                        instantly.
                                                    </span>
                                                </div>

                                                {/* ✨ EMERGENCY STOP SECTION ✨ */}
                                                <div className="pt-4 mt-4 border-t border-slate-200/60">
                                                    <Button
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmType(
                                                                'stop_all',
                                                            );
                                                        }}
                                                        className="w-full h-10 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold text-[10px] uppercase tracking-widest transition-colors shadow-sm"
                                                    >
                                                        <AlertOctagon
                                                            size={14}
                                                            className="mr-2"
                                                        />
                                                        Cancel All Activities
                                                    </Button>
                                                    <p className="text-[9px] text-slate-400 text-center mt-2 leading-tight px-2">
                                                        This will instantly
                                                        clear the learner's
                                                        entire queue and stop
                                                        any active sessions.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
}
