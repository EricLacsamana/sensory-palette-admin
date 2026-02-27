'use client';

import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from 'recharts';
import {
    Sparkles,
    BrainCircuit,
    Activity,
    Target,
    ChevronLeft,
    Loader2,
    Zap,
    MessageSquareText,
    FileText,
    PlayCircle,
    RotateCcw,
    AlertCircle,
    BarChart3,
    CalendarClock,
    Edit2,
    Save,
    X,
    Cpu,
    Network,
    CheckCircle2,
    Clock,
    Radar as RadarIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
    triggerActivitySessionRecommendation,
    updateActivitySession,
} from '@/api/acitivity-session';
import { cn } from '@/lib/utils';

// --- ANIMATION CONFIG ---
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

// --- SUB-COMPONENTS ---
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

const AnalysisStat = ({
    label,
    value,
    icon: Icon,
    colorClass,
    subtitle,
}: any) => (
    <div className="bg-white rounded-[24px] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group h-full">
        <div
            className={cn(
                'absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:opacity-[0.07]',
                colorClass,
            )}
        >
            <Icon size={80} />
        </div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div
                className={cn(
                    'p-2 rounded-xl',
                    colorClass
                        .replace('text-', 'bg-')
                        .replace('600', '50')
                        .replace('500', '50'),
                )}
            >
                <Icon size={18} className={colorClass} />
            </div>
            <TechnicalLabel>{label}</TechnicalLabel>
        </div>

        <div className="relative z-10">
            <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums capitalize">
                {value}
            </div>
            {subtitle && (
                <div className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                    {subtitle}
                </div>
            )}
        </div>
    </div>
);

const DramaticAIGeneration = () => {
    const [phase, setPhase] = useState(0);
    const phases = [
        { text: 'Ingesting Raw Telemetry...', icon: Network },
        { text: 'Analyzing Performance Vectors...', icon: Cpu },
        { text: 'Synthesizing Clinical Insight...', icon: BrainCircuit },
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPhase((p) => (p < phases.length - 1 ? p + 1 : p));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = phases[phase].icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 space-y-6"
        >
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[40px] opacity-40 animate-pulse" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: 'linear',
                    }}
                    className="relative h-16 w-16 rounded-full border-[1px] border-indigo-400/30 border-t-indigo-400 flex items-center justify-center bg-slate-900/50 backdrop-blur-xl"
                >
                    <CurrentIcon
                        size={24}
                        className="text-indigo-300 animate-pulse"
                    />
                </motion.div>
            </div>
            <div className="text-center space-y-2 relative z-10">
                <motion.p
                    key={phase}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-indigo-200 tracking-widest uppercase"
                >
                    {phases[phase].text}
                </motion.p>
                <div className="flex justify-center gap-1.5 mt-4">
                    {phases.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-1 rounded-full transition-all duration-500',
                                i <= phase
                                    ? 'w-6 bg-indigo-400'
                                    : 'w-2 bg-slate-800',
                            )}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// --- CUSTOM RECHARTS TOOLTIP ---
const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl max-w-[250px]">
                <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                    {data.pattern}
                </p>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-white text-sm font-medium">
                        Confidence:
                    </span>
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[9px] uppercase tracking-widest py-0 px-1.5 border-0',
                            data.confidence === 'High'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : data.confidence === 'Medium'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-500/20 text-slate-300',
                        )}
                    >
                        {data.confidence}
                    </Badge>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                    {data.evidence}
                </p>
            </div>
        );
    }
    return null;
};

// --- MAIN DASHBOARD VIEW ---
export default function ActivitySessionDashboard({
    session,
}: {
    session: any;
}) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesContent, setNotesContent] = useState(
        session.teacherNotes || '',
    );

    const aiMutation = useMutation({
        mutationFn: triggerActivitySessionRecommendation,
        onSuccess: () => {
            toast.success('Clinical insights generated successfully');
            queryClient.invalidateQueries({
                queryKey: ['activity-session', session.documentId],
            });
        },
    });

    const updateNotesMutation = useMutation({
        mutationFn: (newNotes: string) =>
            updateActivitySession(session.documentId, {
                teacherNotes: newNotes,
            }),
        onSuccess: () => {
            toast.success('Clinical notes saved');
            setIsEditingNotes(false);
            queryClient.invalidateQueries({
                queryKey: ['activity-session', session.documentId],
            });
        },
        onError: () => toast.error('Failed to save notes. Please try again.'),
    });

    // Helper to format full dates consistently
    const formatFullDate = (dateString: string) => {
        if (!dateString) return '--:--';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatOnlyDate = (dateString: string) => {
        if (!dateString) return 'Unknown Date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // --- DATA MAPPING FOR RECHARTS ---
    const radarData = useMemo(() => {
        if (
            !session.behavioralIndicators ||
            !Array.isArray(session.behavioralIndicators)
        )
            return [];
        const confidenceScoreMap: Record<string, number> = {
            High: 90,
            Medium: 60,
            Low: 30,
        };

        return session.behavioralIndicators.map((indicator: any) => ({
            pattern: indicator.pattern,
            score: confidenceScoreMap[indicator.confidence] || 0,
            fullMark: 100,
            confidence: indicator.confidence,
            evidence: indicator.evidence,
        }));
    }, [session.behavioralIndicators]);

    const renderPrimaryAction = () => {
        const status = session.activitySessionStatus;

        if (status === 'completed') {
            return (
                <Button
                    onClick={() => aiMutation.mutate(session.documentId)}
                    disabled={aiMutation.isPending}
                    className="h-11 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-md"
                >
                    <Sparkles
                        className={cn(
                            'mr-2 h-4 w-4',
                            aiMutation.isPending && 'animate-spin',
                        )}
                    />
                    {session.aiRecommendation
                        ? 'Regenerate Analysis'
                        : 'Run AI Analysis'}
                </Button>
            );
        }

        if (status === 'pending' || status === 'reschedule') {
            return (
                <Button
                    onClick={() =>
                        router.push(
                            `/activity-sessions/${session.documentId}/play`,
                        )
                    }
                    className="h-11 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                >
                    <PlayCircle className="mr-2 h-4 w-4" /> Launch Activity
                </Button>
            );
        }

        if (status === 'in_progress' || status === 'interrupted') {
            return (
                <Button
                    onClick={() =>
                        router.push(
                            `/activity-sessions/${session.documentId}/play`,
                        )
                    }
                    className="h-11 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-100 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                >
                    <RotateCcw className="mr-2 h-4 w-4" /> Resume Session
                </Button>
            );
        }

        return (
            <Badge
                variant="secondary"
                className="h-11 px-5 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px] border border-slate-200"
            >
                <AlertCircle className="mr-2 h-4 w-4" /> Session {status}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
            {/* Subtle Grid Background */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.2]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    maskImage:
                        'linear-gradient(to bottom, black 40%, transparent 100%)',
                }}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-[1600px] mx-auto p-6 lg:p-12 relative z-10 flex flex-col gap-10"
            >
                {/* --- HEADER --- */}
                <motion.header
                    variants={itemVariants}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm"
                >
                    <div className="space-y-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="p-0 h-auto text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-colors"
                        >
                            <ChevronLeft size={14} className="mr-1" /> Registry
                            Directory
                        </Button>
                        <div className="flex items-center gap-4">
                            {/* FALLBACK: Handles Null Activities */}
                            <h1
                                className={cn(
                                    'text-3xl md:text-4xl font-black tracking-tight leading-none',
                                    !session.activity?.name
                                        ? 'text-slate-400 italic'
                                        : 'text-slate-900',
                                )}
                            >
                                {session.activity?.name ||
                                    'No Activity is Linked'}
                            </h1>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'border-2 font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-xl',
                                    session.activitySessionStatus ===
                                        'completed'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : session.activitySessionStatus ===
                                            'pending'
                                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                                          : 'bg-indigo-50 text-indigo-600 border-indigo-100',
                                )}
                            >
                                {session.activitySessionStatus?.replace(
                                    '_',
                                    ' ',
                                )}
                            </Badge>
                        </div>
                        <div className="text-sm font-bold text-slate-500 flex items-center gap-4">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Target size={14} className="text-slate-400" />
                                {session.student
                                    ? `${session.student.firstName} ${session.student.lastName}`
                                    : 'Unknown Student'}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <CalendarClock
                                    size={14}
                                    className="text-slate-400"
                                />
                                {formatOnlyDate(
                                    session.startAt || session.actualStartAt,
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {renderPrimaryAction()}
                    </div>
                </motion.header>

                {/* --- CORE METRICS GRID --- */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                    <AnalysisStat
                        label="Session Score"
                        value={
                            session.score !== null &&
                            session.score !== undefined
                                ? `${session.score}%`
                                : '---'
                        }
                        subtitle={
                            session.score !== null &&
                            session.score !== undefined
                                ? 'Performance Rating'
                                : 'Awaiting Data'
                        }
                        icon={Target}
                        colorClass="group-hover:text-emerald-500"
                    />
                    <AnalysisStat
                        label="AI Accuracy"
                        value={
                            session.accuracy !== undefined &&
                            session.accuracy !== null
                                ? `${session.accuracy}%`
                                : '---'
                        }
                        subtitle={
                            session.accuracy
                                ? 'Diagnostic Assessment'
                                : 'Awaiting Analysis'
                        }
                        icon={BrainCircuit}
                        colorClass="group-hover:text-purple-500"
                    />
                    <AnalysisStat
                        label="Session State"
                        value={
                            session.activitySessionStatus?.replace('_', ' ') ||
                            'Unknown'
                        }
                        subtitle="Current Status"
                        icon={Activity}
                        colorClass="group-hover:text-indigo-500"
                    />
                    <AnalysisStat
                        label="Execution Start"
                        value={
                            session.actualStartAt
                                ? new Date(
                                      session.actualStartAt,
                                  ).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : '--:--'
                        }
                        subtitle={
                            session.actualStartAt
                                ? formatOnlyDate(session.actualStartAt)
                                : 'Not Initialized'
                        }
                        icon={CalendarClock}
                        colorClass="group-hover:text-amber-500"
                    />
                </motion.div>

                {/* --- MAIN CONTENT GRID --- */}
                <div className="grid grid-cols-12 gap-8 items-start">
                    {/* LEFT: INSIGHTS & TELEMETRY (8/12) */}
                    <motion.div
                        variants={itemVariants}
                        className="col-span-12 lg:col-span-8 space-y-8"
                    >
                        {/* THE DRAMATIC AI CARD */}
                        {session.activitySessionStatus === 'completed' && (
                            <AnimatePresence mode="wait">
                                {aiMutation.isPending ? (
                                    <motion.div
                                        key="generating"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.02 }}
                                    >
                                        <Card className="rounded-[32px] border-0 bg-slate-950 text-white shadow-xl overflow-hidden relative">
                                            <div className="absolute top-0 left-1/4 w-1/2 h-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
                                            <CardContent className="p-8">
                                                <DramaticAIGeneration />
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ) : session.aiRecommendation ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <Card className="rounded-[32px] border border-slate-900 bg-slate-950 text-white shadow-xl overflow-hidden relative group">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                                            <Zap
                                                size={100}
                                                className="absolute -right-6 -top-6 opacity-[0.04] rotate-12 group-hover:rotate-0 transition-transform duration-1000"
                                            />

                                            <CardContent className="p-8 flex flex-col md:flex-row gap-6 relative z-10">
                                                <div className="h-16 w-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                                    <BrainCircuit size={32} />
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                                            Gemini Clinical
                                                            Insight
                                                        </span>
                                                        <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-[9px] uppercase tracking-widest px-2 py-0.5">
                                                            <CheckCircle2
                                                                size={10}
                                                                className="mr-1"
                                                            />{' '}
                                                            Verified
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium leading-relaxed text-slate-100">
                                                        "
                                                        {
                                                            session.aiRecommendation
                                                        }
                                                        "
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="prompt"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                                            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                                                <div className="h-20 w-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-2">
                                                    <Sparkles size={32} />
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                                    Unlock AI Analysis
                                                </h3>
                                                <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
                                                    This session is complete.
                                                    Generate an AI-driven
                                                    clinical recommendation
                                                    based on the learner's
                                                    telemetry and score.
                                                </p>
                                                <Button
                                                    onClick={() =>
                                                        aiMutation.mutate(
                                                            session.documentId,
                                                        )
                                                    }
                                                    className="mt-4 h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest shadow-md"
                                                >
                                                    Generate Insight Now
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {/* BEHAVIORAL PROFILE CHART */}
                        {radarData.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="rounded-[32px] border border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] bg-white overflow-hidden">
                                    <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">
                                                Cognitive & Behavioral Profile
                                            </CardTitle>
                                            <p className="text-xs font-medium text-slate-400">
                                                AI-mapped pattern intensity
                                                based on session telemetry
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-indigo-50 rounded-xl">
                                            <RadarIcon
                                                size={18}
                                                className="text-indigo-500"
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-[350px] w-full">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <RadarChart
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius="70%"
                                                    data={radarData}
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
                                                    <PolarRadiusAxis
                                                        angle={30}
                                                        domain={[0, 100]}
                                                        tick={false}
                                                        axisLine={false}
                                                    />
                                                    <Radar
                                                        name="Pattern Intensity"
                                                        dataKey="score"
                                                        stroke="#6366f1"
                                                        strokeWidth={2}
                                                        fill="#6366f1"
                                                        fillOpacity={0.3}
                                                    />
                                                    <RechartsTooltip
                                                        content={
                                                            <CustomRadarTooltip />
                                                        }
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* TELEMETRY DIAGNOSTIC LIST */}
                        <Card className="rounded-[32px] border border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] bg-white overflow-hidden flex flex-col">
                            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">
                                        Activity Telemetry
                                    </CardTitle>
                                    <p className="text-xs font-medium text-slate-400">
                                        AI-interpreted performance markers and
                                        sequences
                                    </p>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-xl">
                                    <BarChart3
                                        size={18}
                                        className="text-slate-400"
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className="p-0 h-[450px] overflow-y-auto custom-scrollbar">
                                {session.telemetryAnalysis &&
                                Array.isArray(session.telemetryAnalysis) &&
                                session.telemetryAnalysis.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {session.telemetryAnalysis.map(
                                            (event: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <div className="pt-1">
                                                        <Clock
                                                            size={14}
                                                            className="text-slate-300"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums w-12">
                                                                T+
                                                                {
                                                                    event.timestamp
                                                                }
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-0 rounded-md',
                                                                    event.status ===
                                                                        'SUCCESS'
                                                                        ? 'bg-emerald-50 text-emerald-600'
                                                                        : event.status ===
                                                                            'DELAY'
                                                                          ? 'bg-amber-50 text-amber-600'
                                                                          : 'bg-rose-50 text-rose-600',
                                                                )}
                                                            >
                                                                {event.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                            {event.info}
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 px-10">
                                        <Activity
                                            size={48}
                                            className={cn(
                                                'mb-6',
                                                session.rawTelemetry
                                                    ? 'text-indigo-600/20'
                                                    : 'opacity-20',
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-2 rounded-full',
                                                session.rawTelemetry
                                                    ? 'text-indigo-400 bg-indigo-50'
                                                    : 'bg-slate-50',
                                            )}
                                        >
                                            {session.rawTelemetry
                                                ? 'Telemetry Ready - Run Analysis'
                                                : 'No Telemetry Logged'}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* RIGHT: EDITABLE NOTES & METADATA (4/12) */}
                    <motion.aside
                        variants={itemVariants}
                        className="col-span-12 lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8"
                    >
                        {/* EDITABLE CLINICIAN NOTES */}
                        <Card className="rounded-[32px] border border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] bg-white overflow-hidden flex flex-col">
                            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                                        <MessageSquareText size={14} />
                                    </div>
                                    <TechnicalLabel className="text-slate-600">
                                        Clinician Notes
                                    </TechnicalLabel>
                                </div>
                                {session.activitySessionStatus ===
                                    'completed' &&
                                    !isEditingNotes && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            onClick={() =>
                                                setIsEditingNotes(true)
                                            }
                                        >
                                            <Edit2 size={12} />
                                        </Button>
                                    )}
                            </CardHeader>

                            <CardContent className="p-8">
                                {isEditingNotes ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                        <Textarea
                                            value={notesContent}
                                            onChange={(e) =>
                                                setNotesContent(e.target.value)
                                            }
                                            className="min-h-[180px] resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-2xl text-sm p-5 leading-relaxed bg-slate-50/50 placeholder:text-slate-300"
                                            placeholder="Enter clinical observations, behavioral notes, or contextual factors..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100"
                                                onClick={() => {
                                                    setIsEditingNotes(false);
                                                    setNotesContent(
                                                        session.teacherNotes ||
                                                            '',
                                                    );
                                                }}
                                            >
                                                <X className="mr-1.5 h-3.5 w-3.5" />{' '}
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-200"
                                                disabled={
                                                    updateNotesMutation.isPending
                                                }
                                                onClick={() =>
                                                    updateNotesMutation.mutate(
                                                        notesContent,
                                                    )
                                                }
                                            >
                                                {updateNotesMutation.isPending ? (
                                                    <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                                                ) : (
                                                    <Save className="mr-1.5 h-3.5 w-3.5" />
                                                )}
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                            {session.teacherNotes ? (
                                                session.teacherNotes
                                            ) : (
                                                <span className="text-slate-400 italic font-normal text-xs">
                                                    No clinician observations
                                                    recorded for this session.
                                                </span>
                                            )}
                                        </p>
                                        <Separator className="bg-slate-100" />
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    Score Progress
                                                </span>
                                                <span className="text-xs font-black text-slate-900">
                                                    {session.score !== null &&
                                                    session.score !== undefined
                                                        ? `${session.score}%`
                                                        : '---'}
                                                </span>
                                            </div>
                                            <Progress
                                                value={session.score ?? 0}
                                                className="h-2 bg-slate-100"
                                                indicatorClassName={cn(
                                                    (session.score ?? 0) >= 80
                                                        ? 'bg-emerald-500'
                                                        : (session.score ??
                                                                0) >= 50
                                                          ? 'bg-amber-500'
                                                          : 'bg-slate-400',
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* CLEAN METADATA CARD */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-8 space-y-6">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                    <FileText size={14} />
                                </div>
                                <TechnicalLabel className="text-slate-600">
                                    Registry Details
                                </TechnicalLabel>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-400 uppercase tracking-widest">
                                        Document ID
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="font-mono text-slate-600 bg-slate-50 border-slate-200"
                                    >
                                        #
                                        {session.documentId?.slice(0, 8) ||
                                            'N/A'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-400 uppercase tracking-widest">
                                        Assigned Hub
                                    </span>
                                    <span className="text-slate-900">
                                        Quezon City Hub
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-400 uppercase tracking-widest">
                                        Clinician
                                    </span>
                                    <span className="text-slate-900">
                                        {session.therapist
                                            ? `${session.therapist.firstName} ${session.therapist.lastName}`
                                            : 'Unassigned'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </div>

                <footer className="h-16 w-full shrink-0" aria-hidden="true" />
            </motion.div>
        </div>
    );
}
