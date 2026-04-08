'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toast } from 'sonner';
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
    Download,
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
    AlertTriangle,
    RefreshCw,
    Focus,
    Layers,
    BrainCircuit,
    User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getActivitySessionsNew } from '@/api/activity-session';
import { getStudentAnalytics } from '@/api/analytics';
import { getStudent } from '@/api/students';
import { cn } from '@/lib/utils';
import { FormatService, formatTherapyTime } from '@/utils/helpers';
import { UserAvatar } from '@/components/UserAvatar';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { Toaster } from '@/components/ui/sonner';

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

// --- UNIFIED DASHBOARD STAT CARD ---
const DashboardStatCard = ({
    title,
    value,
    trend,
    icon: Icon,
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
                <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    {value}
                </div>
            )}
            {trend && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    <TrendingUp size={12} className={colorClass} /> {trend}
                </div>
            )}
        </div>
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
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
            from: format(start, 'yyyy-MM-dd'),
            to: format(end, 'yyyy-MM-dd'),
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
        return format(new Date(dateString), 'MMM dd, yyyy, hh:mm a');
    };

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return '--';
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        if (diffMs <= 0) return '0s';
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const mergedTimelineData = useMemo(() => {
        if (!analytics?.charts?.performanceTimeline) return [];
        return analytics.charts.performanceTimeline.map((item: any) => ({
            ...item,
            currentAccuracy: item.currentAccuracy || 0,
            prevAccuracy: item.prevAccuracy || 0,
        }));
    }, [analytics?.charts?.performanceTimeline]);

    // ✨ AESTHETIC BRANDED PDF GENERATOR ✨
    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        const toastId = toast.loading('Generating Clinical Report...');

        const logoImg = new window.Image();
        logoImg.src = '/tlc_therapy_center_logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });

        setTimeout(async () => {
            try {
                const doc = new jsPDF('p', 'mm', 'a4');
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                let yPos = 0;

                // --- LETTERHEAD & BRANDING ---
                yPos = 15;

                if (logoImg.width > 0) {
                    doc.addImage(logoImg, 'PNG', 15, yPos, 24, 24);
                }

                doc.setTextColor(15, 23, 42); // Slate 900
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('TLC SPED & Therapy Center', 45, yPos + 6);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105); // Slate 600
                doc.text(
                    '1015 Salvador Avenue, Jordan Plaines Subdivision, Novaliches, Quezon City, Philippines, 1117',
                    45,
                    yPos + 12,
                );
                doc.text(
                    'Contact info: 0927 211 7145  |  tlconline.ph@gmail.com  |  8 AM–5 PM',
                    45,
                    yPos + 17,
                );

                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(1);
                doc.line(15, yPos + 26, pageWidth - 15, yPos + 26);

                // --- REPORT HEADING ---
                yPos += 45;
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(
                    'Comprehensive Clinical Progress Report',
                    pageWidth / 2,
                    yPos,
                    { align: 'center' },
                );

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                const reportDate = format(new Date(), 'MMMM dd, yyyy');
                doc.text(
                    `Generated on: ${reportDate}`,
                    pageWidth / 2,
                    yPos + 7,
                    { align: 'center' },
                );

                yPos += 22;

                const addSectionHeader = (title: string) => {
                    if (yPos > pageHeight - 40) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setTextColor(15, 23, 42);
                    doc.setFontSize(13);
                    doc.setFont('helvetica', 'bold');
                    doc.text(title, 15, yPos);

                    doc.setDrawColor(226, 232, 240);
                    doc.setLineWidth(1);
                    doc.line(15, yPos + 3, pageWidth - 15, yPos + 3);
                    yPos += 12;
                };

                // --- Profile ---
                addSectionHeader('Learner Profile');
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Name:', 15, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    `${student?.firstName || ''} ${student?.lastName || ''}`,
                    40,
                    yPos,
                );
                doc.setFont('helvetica', 'bold');
                doc.text('Age:', 110, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(`${student?.age || 'N/A'} yrs`, 135, yPos);
                yPos += 8;

                doc.setFont('helvetica', 'bold');
                doc.text('Birthday:', 15, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    student?.dateOfBirth
                        ? format(new Date(student.dateOfBirth), 'MMMM dd, yyyy')
                        : 'N/A',
                    40,
                    yPos,
                );
                doc.setFont('helvetica', 'bold');
                doc.text('Diagnosis:', 110, yPos);
                doc.setFont('helvetica', 'normal');
                const diagSplit = doc.splitTextToSize(
                    student?.diagnosis || 'Not specified',
                    pageWidth - 135 - 15,
                );
                doc.text(diagSplit, 135, yPos);
                yPos += Math.max(12, diagSplit.length * 6);

                // --- Behavioral Observation ---
                addSectionHeader('Behavioral Observation');
                const topBehaviors =
                    analytics?.charts?.behavioralRadar
                        ?.slice(0, 3)
                        .map((b: any) => b.pattern)
                        .join(', ') || 'standard interaction patterns';
                const behaviorText = `During the evaluated period (${format(new Date(dateRange.from), 'MMM dd')} - ${format(new Date(dateRange.to), 'MMM dd')}), the learner predominantly exhibited ${topBehaviors.toLowerCase()}. Overall behavioral engagement was assessed using continuous telemetry tracking during clinical activities.`;
                const behaviorSplit = doc.splitTextToSize(
                    behaviorText,
                    pageWidth - 30,
                );
                doc.setTextColor(71, 85, 105);
                doc.text(behaviorSplit, 15, yPos);
                yPos += behaviorSplit.length * 6 + 10;

                // --- Performance Analysis ---
                addSectionHeader('Performance Analysis');

                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(15, yPos, 55, 20, 3, 3, 'FD');
                doc.roundedRect(75, yPos, 55, 20, 3, 3, 'FD');
                doc.roundedRect(135, yPos, 55, 20, 3, 3, 'FD');

                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text('Avg Accuracy', 42.5, yPos + 7, { align: 'center' });
                doc.text('Therapy Time', 102.5, yPos + 7, { align: 'center' });
                doc.text('Sessions Done', 162.5, yPos + 7, { align: 'center' });

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(
                    `${analytics?.overviewMetrics?.averageAccuracy || 0}%`,
                    42.5,
                    yPos + 15,
                    { align: 'center' },
                );
                doc.text(
                    formatTherapyTime(
                        analytics?.overviewMetrics?.totalTherapyHours,
                    ),
                    102.5,
                    yPos + 15,
                    { align: 'center' },
                );
                doc.text(
                    `${analytics?.overviewMetrics?.totalSessionsCompleted || 0}`,
                    162.5,
                    yPos + 15,
                    { align: 'center' },
                );
                yPos += 30;

                // 📸 CAPTURE 1: Line Chart
                const lineChartElem = document.getElementById('pdf-line-chart');
                if (lineChartElem) {
                    const canvas = await html2canvas(lineChartElem, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                    });
                    const img = canvas.toDataURL('image/png');
                    const props = doc.getImageProperties(img);
                    const h = (props.height * (pageWidth - 30)) / props.width;
                    if (yPos + h > pageHeight - 20) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.addImage(img, 'PNG', 15, yPos, pageWidth - 30, h);
                    yPos += h + 10;
                }

                // 📸 CAPTURE 2: Radar Chart
                const radarChartElem =
                    document.getElementById('pdf-radar-chart');
                if (radarChartElem) {
                    const canvasRadar = await html2canvas(radarChartElem, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                    });
                    const imgDataRadar = canvasRadar.toDataURL('image/png');
                    const imgPropsRadar = doc.getImageProperties(imgDataRadar);
                    const pdfWidthRadar = 120; // Slightly constrained width to ensure perfect centering
                    const pdfHeightRadar =
                        (imgPropsRadar.height * pdfWidthRadar) /
                        imgPropsRadar.width;
                    const xOffsetRadar = (pageWidth - pdfWidthRadar) / 2;

                    if (yPos + pdfHeightRadar > pageHeight - 20) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.addImage(
                        imgDataRadar,
                        'PNG',
                        xOffsetRadar,
                        yPos,
                        pdfWidthRadar,
                        pdfHeightRadar,
                    );
                    yPos += pdfHeightRadar + 10;
                }

                // --- Clinical Recommendation ---
                addSectionHeader('Clinical Recommendation');
                const latestSession = activitySessions.find(
                    (s: any) => s.aiRecommendation,
                );
                const recText = latestSession
                    ? `Latest AI Insight:\n\n${latestSession.aiRecommendation}`
                    : 'Continue current therapy plan.';
                const recSplit = doc.splitTextToSize(recText, pageWidth - 40);
                const recH = recSplit.length * 6 + 10;
                if (yPos + recH > pageHeight - 20) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(15, yPos, pageWidth - 30, recH, 3, 3, 'FD');

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor(71, 85, 105);
                doc.text(recSplit, 20, yPos + 8);

                // FOOTER
                const pageCount = (doc.internal as any).getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.text(
                        `Page ${i} of ${pageCount}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' },
                    );
                }

                doc.save(`${student?.firstName || 'Learner'}_Report.pdf`);
                toast.success('Report Generated!', { id: toastId });
            } catch (error) {
                toast.error('Failed to compile PDF.', { id: toastId });
            } finally {
                setIsGeneratingPDF(false);
            }
        }, 500);
    };

    if (isLoadingStudent || isLoadingAnalytics)
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );

    const { overviewMetrics, charts } = analytics || {};
    const displayRadarData = charts?.behavioralRadar || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden relative">
            <Toaster position="top-right" richColors closeButton />

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
                className="max-w-[1600px] w-full mx-auto p-6 lg:p-8 flex flex-col pb-24 gap-6 relative z-10"
            >
                {/* --- UNIFIED DASHBOARD HEADER --- */}
                <motion.header
                    variants={itemVariants}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 w-full"
                >
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0 w-full md:w-auto">
                        <UserAvatar
                            src={FormatService.formatStrapiMedia(
                                student?.profilePicture,
                                'thumbnail',
                            )}
                            size="lg"
                            showStatus={true}
                            name={student?.firstName}
                            className="shadow-sm border border-slate-100 shrink-0"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5 mb-2">
                                <button
                                    onClick={() => router.back()}
                                    className="flex items-center gap-1 hover:text-indigo-800 transition-colors shrink-0"
                                >
                                    <ArrowLeft size={14} strokeWidth={3} /> Go
                                    Back
                                </button>
                                <span className="opacity-40 shrink-0">•</span>
                                <User
                                    size={14}
                                    className="text-indigo-600 shrink-0"
                                />{' '}
                                <span className="truncate">
                                    Learner Profile
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none truncate">
                                {student?.firstName} {student?.lastName}
                            </h1>
                            <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                                <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[11px] font-bold">
                                    ID-{(studentId || '0').padStart(4, '0')}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="truncate">
                                    Review learner analytics, telemetry, and
                                    generated insights.
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex items-center justify-end shrink-0">
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="h-12 w-full md:w-auto px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        >
                            {isGeneratingPDF ? (
                                <Loader2
                                    size={16}
                                    className="animate-spin mr-2"
                                />
                            ) : (
                                <Download size={16} className="mr-2" />
                            )}
                            {isGeneratingPDF
                                ? 'Generating...'
                                : 'Export Report'}
                        </Button>
                    </div>
                </motion.header>

                {/* --- DEMOGRAPHICS BLOCK (Styled like categories) --- */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center gap-2"
                >
                    <div className="flex items-center rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200 shadow-sm cursor-default">
                        <User
                            size={14}
                            className="mr-1.5 shrink-0 text-indigo-500"
                        />
                        {student?.age ? `${student.age} Years Old` : 'Age N/A'}
                    </div>
                    <div className="flex items-center rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200 shadow-sm cursor-default">
                        <CakeIcon
                            size={14}
                            className={cn(
                                'mr-1.5 shrink-0 ',
                                student?.gender === 'male'
                                    ? 'text-blue-500'
                                    : 'text-rose-400',
                            )}
                        />
                        {student?.dateOfBirth
                            ? format(
                                  new Date(student.dateOfBirth),
                                  'MMM dd, yyyy',
                              )
                            : 'DOB N/A'}
                    </div>
                    <div className="flex items-center rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200 shadow-sm cursor-default">
                        {student?.gender === 'male' ? (
                            <MarsIcon
                                size={14}
                                className="mr-1.5 shrink-0 text-blue-500"
                            />
                        ) : (
                            <VenusIcon
                                size={14}
                                className="mr-1.5 shrink-0 text-rose-400"
                            />
                        )}
                        {student?.gender || 'Gender N/A'}
                    </div>
                    <div className="flex items-center rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200 shadow-sm cursor-default">
                        <Activity
                            size={14}
                            className="mr-1.5 shrink-0 text-emerald-500"
                        />
                        {student?.diagnosis || 'No Diagnosis'}
                    </div>
                </motion.div>

                {/* --- DATE WIDGET BOX --- */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-4 items-center justify-start sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0 w-full"
                >
                    <div className="flex items-center w-full sm:w-auto">
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>
                </motion.div>

                {/* --- SUMMARY METRICS --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6"
                >
                    <DashboardStatCard
                        title="Avg Accuracy"
                        value={`${overviewMetrics?.averageAccuracy || 0}%`}
                        trend="Overall Precision"
                        icon={Target}
                        colorClass="text-emerald-500"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Therapy Time"
                        value={formatTherapyTime(
                            overviewMetrics?.totalTherapyHours,
                        )}
                        trend="Total Logged"
                        icon={Clock}
                        colorClass="text-amber-500"
                        isLoading={isLoadingAnalytics}
                    />
                    <DashboardStatCard
                        title="Total Sessions"
                        value={overviewMetrics?.totalSessionsCompleted || 0}
                        trend="Completed Modules"
                        icon={Zap}
                        colorClass="text-rose-500"
                        isLoading={isLoadingAnalytics}
                    />
                </motion.div>

                {/* --- ROW 1: PERFORMANCE WIDGETS --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 xl:grid-cols-5 gap-6"
                >
                    {/* LINE CHART */}
                    <Card
                        id="pdf-line-chart"
                        className="col-span-1 xl:col-span-3 rounded-[32px] border-slate-200 shadow-sm bg-white h-[420px] flex flex-col relative overflow-hidden"
                    >
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
                                        {/* 🚨 ANIMATIONS DISABLED DURING PDF EXPORT 🚨 */}
                                        <Line
                                            isAnimationActive={!isGeneratingPDF}
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
                                            isAnimationActive={!isGeneratingPDF}
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
                                        {/* 🚨 ANIMATIONS DISABLED DURING PDF EXPORT 🚨 */}
                                        <Bar
                                            isAnimationActive={!isGeneratingPDF}
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
                                            isAnimationActive={!isGeneratingPDF}
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
                    <Card
                        id="pdf-radar-chart"
                        className="col-span-1 xl:col-span-3 rounded-[32px] border-slate-200 shadow-sm bg-white h-[500px] flex flex-col overflow-hidden"
                    >
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
                                            angle={30}
                                            domain={[0, 100]}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        {/* 🚨 ANIMATIONS DISABLED DURING PDF EXPORT 🚨 */}
                                        <Radar
                                            isAnimationActive={!isGeneratingPDF}
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

                    {/* HISTORY WIDGET */}
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
                                <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-5 pb-6">
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
                                                                'absolute -left-[33px] top-5 h-4 w-4 rounded-full border-[3px] border-white shadow-sm transition-transform group-hover:scale-125 z-10',
                                                                session.activitySessionStatus ===
                                                                    'completed'
                                                                    ? 'bg-emerald-500'
                                                                    : 'bg-amber-400',
                                                            )}
                                                        />
                                                        <div className="flex flex-col gap-2.5 bg-slate-50/50 p-4 rounded-2xl border border-transparent group-hover:border-slate-200 group-hover:bg-white transition-all shadow-sm group-hover:shadow-md">
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
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {session.aiRecommendation && (
                                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded-md border border-purple-100 text-[10px] font-bold text-purple-600">
                                                                        <Sparkles
                                                                            size={
                                                                                10
                                                                            }
                                                                        />{' '}
                                                                        AI
                                                                        Report
                                                                    </div>
                                                                )}
                                                                {isGameActivity && (
                                                                    <>
                                                                        <div
                                                                            className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100 text-[10px] font-bold text-emerald-700"
                                                                            title="Accuracy"
                                                                        >
                                                                            <Target
                                                                                size={
                                                                                    10
                                                                                }
                                                                                className="text-emerald-500"
                                                                            />
                                                                            {session.accuracy ??
                                                                                0}
                                                                            %
                                                                        </div>
                                                                        <div
                                                                            className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 text-[10px] font-bold text-indigo-700"
                                                                            title="Score / Total Rounds"
                                                                        >
                                                                            <Trophy
                                                                                size={
                                                                                    10
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
                                                                            className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-100 text-[10px] font-bold text-amber-700"
                                                                            title="Time Duration"
                                                                        >
                                                                            <Timer
                                                                                size={
                                                                                    10
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
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1 pt-2 border-t border-slate-100">
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
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[32px]" />
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
