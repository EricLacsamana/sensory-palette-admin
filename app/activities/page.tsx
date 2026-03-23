'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Lock,
    Play,
    Search,
    Gamepad2,
    ArrowLeft,
    Brain,
    Tag,
    Activity,
    ChevronRight,
    X,
    Loader2,
    IdCard,
    ArrowRight,
    Sparkles,
    Clock,
    Heart,
    MessageSquare,
    Palette,
    Zap,
    Eye,
    Ear,
    BookText,
} from 'lucide-react';
import { toast } from 'sonner';

import { useActivities } from '@/hooks/useActivities';
import { getStudents } from '@/api/students';
import {
    createActivitySession,
    getActivitySessionsNew,
} from '@/api/activity-session';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { ActivitySessionStatus } from '@/types/activitiy-session';
import { UserAvatar } from '@/components/UserAvatar';

// --- ICON MAPPING HELPER ---
const getCategoryIcon = (categoryName: string, size = 12) => {
    const iconClass = 'mr-1.5 shrink-0';
    const name = categoryName?.toLowerCase() || '';

    if (name === 'all') return <Gamepad2 className={iconClass} size={size} />;

    const icons: Record<string, React.ReactNode> = {
        cognitive: <Brain className={iconClass} size={size} />,
        brain: <Brain className={iconClass} size={size} />,
        motor: <Activity className={iconClass} size={size} />,
        physical: <Activity className={iconClass} size={size} />,
        sensory: <Sparkles className={iconClass} size={size} />,
        social: <Heart className={iconClass} size={size} />,
        emotional: <Heart className={iconClass} size={size} />,
        language: <MessageSquare className={iconClass} size={size} />,
        communication: <MessageSquare className={iconClass} size={size} />,
        creative: <Palette className={iconClass} size={size} />,
        art: <Palette className={iconClass} size={size} />,
        focus: <Zap className={iconClass} size={size} />,
        visual: <Eye className={iconClass} size={size} />,
        auditory: <Ear className={iconClass} size={size} />,
        vocabulary: <BookText className={iconClass} size={size} />,
    };

    const key = Object.keys(icons).find((k) => name.includes(k));
    return key ? icons[key] : <Tag className={iconClass} size={size} />;
};

const ActivityLibrary = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentIdParam = searchParams.get('studentId');

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);

    const [launchModalOpen, setLaunchModalOpen] = useState(false);
    const [activityToLaunch, setActivityToLaunch] = useState<any>(null);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    const [pendingActivityId, setPendingActivityId] = useState<
        string | number | null
    >(null);
    const [pendingStudentId, setPendingStudentId] = useState<
        string | number | null
    >(null);

    const { data: activities, isLoading: actLoading } = useActivities();

    const { data: studentsList = [], isPending: studentsPending } = useQuery({
        queryKey: ['students', { searchQuery: studentSearchQuery }],
        queryFn: getStudents,
    });

    const { data: activeSessions = [], isPending: sessionsPending } = useQuery({
        queryKey: [
            'active-sessions',
            {
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
                        {
                            activitySessionStatus: {
                                $eq: ActivitySessionStatus.Queued,
                            },
                        },
                    ],
                },
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        refetchInterval: 3000,
    });

    const launchMutation = useMutation({
        mutationFn: createActivitySession,
    });

    const currentActiveSession = activeSessions?.[0];
    const hasActiveSession = !!currentActiveSession;

    const isSessionLocked = hasActiveSession || launchMutation.isPending;
    const isStatusPending = sessionsPending;

    const parsedStudentIdParam = useMemo(
        () =>
            studentIdParam && studentIdParam !== 'null'
                ? Number(studentIdParam)
                : null,
        [studentIdParam],
    );

    const filteredActivities = useMemo(() => {
        if (!activities) return [];
        return activities.filter((activity: any) => {
            const matchesSearch = activity.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesCategory =
                activeCategory === 'All' ||
                activity.categories?.some(
                    (cat: any) => cat.name === activeCategory,
                );
            return matchesSearch && matchesCategory;
        });
    }, [activities, searchTerm, activeCategory]);

    const categoryButtons = useMemo(() => {
        if (!activities) return ['All'];
        const allNames = activities.flatMap(
            (a: any) => a.categories?.map((c: any) => c.name) || [],
        );
        return ['All', ...Array.from(new Set(allNames.filter(Boolean)))];
    }, [activities]);

    const filteredStudents = useMemo(() => {
        if (!studentsList) return [];
        if (!studentSearchQuery) return studentsList;
        const query = studentSearchQuery.toLowerCase();
        return studentsList.filter(
            (s: any) =>
                s.fullName?.toLowerCase().includes(query) ||
                s.id?.toString().includes(query),
        );
    }, [studentsList, studentSearchQuery]);

    const preselectedStudent = useMemo(() => {
        if (!parsedStudentIdParam) return null;
        return studentsList.find((s: any) => s.id === parsedStudentIdParam);
    }, [studentsList, parsedStudentIdParam]);

    const handleConfirmLaunch = useCallback(
        (selectedStudentId: string | number, activityOverride?: any) => {
            if (launchMutation.isPending) return;
            const targetActivity = activityOverride || activityToLaunch;
            if (!targetActivity) return;

            const activityId = targetActivity.documentId || targetActivity.id;

            setPendingActivityId(activityId);
            setPendingStudentId(selectedStudentId);

            const toastId = toast.loading(
                'Initializing protocol and syncing session data...',
            );

            launchMutation.mutate(
                {
                    activity: activityId,
                    student: selectedStudentId,
                    activitySessionStatus: 'in_progress',
                    startAt: new Date().toISOString(),
                },
                {
                    onSuccess: () => {
                        toast.success('Session launched successfully!', {
                            id: toastId,
                        });
                        setLaunchModalOpen(false);
                        setActivityToLaunch(null);
                        queryClient.invalidateQueries({
                            queryKey: ['active-sessions'],
                        });
                        router.push('/');
                    },
                    onError: () => {
                        toast.error(
                            'Failed to initiate session. Please try again.',
                            { id: toastId },
                        );
                    },
                    onSettled: () => {
                        setPendingActivityId(null);
                        setPendingStudentId(null);
                    },
                },
            );
        },
        [activityToLaunch, launchMutation, queryClient, router],
    );

    const handleOpenLaunchModal = (activity: any) => {
        if (isStatusPending || isSessionLocked) return;
        if (parsedStudentIdParam) {
            handleConfirmLaunch(parsedStudentIdParam, activity);
        } else {
            setActivityToLaunch(activity);
            setLaunchModalOpen(true);
        }
    };

    if (sessionsPending || (actLoading && !hasActiveSession)) {
        return (
            <div className="flex flex-col h-[70vh] items-center justify-center text-indigo-600 gap-4 bg-[#F8FAFC]">
                <Loader2 size={40} className="animate-spin" />
                <p className="font-bold animate-pulse tracking-wide">
                    {sessionsPending
                        ? 'Verifying session status...'
                        : 'Syncing Library...'}
                </p>
            </div>
        );
    }

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

            {/* ACTIVE SESSION BLOCKER MODAL */}
            {hasActiveSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Activity size={32} className="animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                            Session in Progress
                        </h2>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            You currently have an active or queued session with{' '}
                            <span className="font-bold text-indigo-600">
                                {currentActiveSession?.student?.fullName ||
                                    currentActiveSession?.student?.firstName ||
                                    'a student'}
                            </span>{' '}
                            for{' '}
                            <span className="font-bold text-slate-700">
                                {currentActiveSession?.activity?.name ||
                                    'an activity'}
                            </span>
                            .
                            <br />
                            <br />
                            Please complete or end the current session before
                            starting a new one.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/')}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                            >
                                <Play size={16} className="fill-current" />
                                Resume Current Session
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="w-full py-3.5 rounded-xl text-slate-500 hover:bg-slate-50 font-bold uppercase tracking-wider text-sm transition-all"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-8 pb-24">
                {/* --- UNIFIED DASHBOARD HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5 mb-2">
                            <Gamepad2 size={14} className="text-indigo-600" />{' '}
                            Activity Vault
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                            {preselectedStudent
                                ? `${preselectedStudent.firstName}'s Tasks`
                                : 'Library Modules'}
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl">
                            Select a module below to initiate the workflow.
                        </p>
                    </div>
                </header>

                {/* --- SEARCH WIDGET BOX --- */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0">
                    <div className="relative w-full sm:w-[320px] group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isSessionLocked}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Categories */}
                    <div className="flex flex-wrap items-center gap-2">
                        {categoryButtons.map((catName: any) => (
                            <button
                                key={catName}
                                onClick={() => setActiveCategory(catName)}
                                disabled={isSessionLocked}
                                className={cn(
                                    'flex items-center rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200',
                                    activeCategory === catName
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-500',
                                    isSessionLocked &&
                                        'opacity-50 cursor-not-allowed',
                                )}
                            >
                                {getCategoryIcon(catName, 14)}
                                {catName}
                            </button>
                        ))}
                    </div>

                    {/* Grid Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch content-start min-h-[50vh] w-full">
                        {filteredActivities?.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center min-h-[30vh] text-sm font-medium text-slate-400 tracking-wide bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                                <Search
                                    size={32}
                                    className="mb-4 text-slate-300"
                                />
                                No modules match your search
                            </div>
                        ) : (
                            filteredActivities?.map((activity: any) => {
                                const id = activity.documentId || activity.id;
                                const isAvailable =
                                    activity.activityStatus === 'active';
                                const isComingSoon =
                                    activity.activityStatus === 'coming_soon';
                                const canLaunch =
                                    isAvailable &&
                                    !isSessionLocked &&
                                    !isStatusPending;
                                const isHovered = hoveredId === id;

                                const isThisActivityLaunching =
                                    pendingActivityId === id;

                                return (
                                    <div
                                        key={id}
                                        onMouseEnter={() => setHoveredId(id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() =>
                                            isAvailable &&
                                            handleOpenLaunchModal(activity)
                                        }
                                        className={cn(
                                            'group relative flex flex-col h-full rounded-[32px] bg-white border border-slate-100 transition-all duration-300 isolate',
                                            isAvailable
                                                ? isSessionLocked ||
                                                  isStatusPending
                                                    ? 'cursor-not-allowed'
                                                    : 'cursor-pointer'
                                                : 'cursor-not-allowed grayscale-[0.5]',
                                            (isHovered && canLaunch) ||
                                                isThisActivityLaunching
                                                ? 'translate-y-[-4px] shadow-xl shadow-indigo-500/5 border-indigo-100'
                                                : 'shadow-sm',
                                            isThisActivityLaunching &&
                                                'ring-2 ring-indigo-500 ring-offset-2 pointer-events-none',
                                        )}
                                    >
                                        <div className="relative h-40 sm:h-48 w-full p-2.5 pb-0 shrink-0">
                                            <div className="relative h-full w-full rounded-[24px] overflow-hidden bg-slate-50">
                                                <img
                                                    src={
                                                        activity.banner?.url
                                                            ? `${process.env.NEXT_PUBLIC_API_URL}${activity.banner.url}`
                                                            : 'https://via.placeholder.com/400x225'
                                                    }
                                                    alt={activity.name}
                                                    className={cn(
                                                        'h-full w-full object-cover transition-transform duration-700 ease-out',
                                                        isHovered &&
                                                            canLaunch &&
                                                            'scale-105',
                                                    )}
                                                />
                                                {!isAvailable && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white backdrop-blur-[2px]">
                                                        {isComingSoon ? (
                                                            <Clock
                                                                size={24}
                                                                className="mb-2 opacity-80"
                                                            />
                                                        ) : (
                                                            <Lock
                                                                size={24}
                                                                className="mb-2 opacity-80"
                                                            />
                                                        )}
                                                        <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-center px-2">
                                                            {isComingSoon
                                                                ? 'Coming Soon'
                                                                : 'Not Available'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col flex-1 p-5 sm:p-6 pt-4">
                                            <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
                                                {activity.categories?.map(
                                                    (cat: any, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-tight"
                                                        >
                                                            {getCategoryIcon(
                                                                cat.name,
                                                                10,
                                                            )}
                                                            {cat.name}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1.5 leading-tight shrink-0 line-clamp-1">
                                                {activity.name}
                                            </h3>

                                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium shrink-0">
                                                {activity.description ||
                                                    'No description available.'}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between pt-2">
                                                <ChevronRight
                                                    size={16}
                                                    className="text-slate-300 group-hover:text-indigo-300 transition-colors"
                                                />
                                                <div
                                                    className={cn(
                                                        'flex items-center justify-center rounded-xl transition-all duration-300 shadow-md',
                                                        isAvailable
                                                            ? isStatusPending ||
                                                              isThisActivityLaunching
                                                                ? 'bg-indigo-500 cursor-wait shadow-indigo-200'
                                                                : isSessionLocked
                                                                  ? 'bg-amber-500 shadow-amber-200'
                                                                  : 'bg-indigo-600 shadow-indigo-200'
                                                            : 'bg-slate-200 shadow-none',
                                                        (isHovered &&
                                                            canLaunch) ||
                                                            isThisActivityLaunching
                                                            ? 'w-28 sm:w-32 h-10'
                                                            : 'w-10 h-10',
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 text-white">
                                                        {isThisActivityLaunching ? (
                                                            <Loader2
                                                                size={14}
                                                                className="animate-spin"
                                                            />
                                                        ) : isSessionLocked &&
                                                          isAvailable ? (
                                                            <Lock size={14} />
                                                        ) : (
                                                            <Play
                                                                size={14}
                                                                className={cn(
                                                                    isHovered &&
                                                                        canLaunch &&
                                                                        'fill-current',
                                                                )}
                                                            />
                                                        )}
                                                        {((isHovered &&
                                                            canLaunch) ||
                                                            isThisActivityLaunching) && (
                                                            <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                                                                {isThisActivityLaunching
                                                                    ? 'Launching...'
                                                                    : 'Launch'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Launch Modal */}
                {launchModalOpen && activityToLaunch && !hasActiveSession && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() =>
                                !launchMutation.isPending &&
                                setLaunchModalOpen(false)
                            }
                        />
                        <div className="relative bg-slate-50 rounded-[40px] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                            <div
                                className="absolute inset-0 opacity-[0.4] pointer-events-none"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                                    backgroundSize: '40px 40px',
                                }}
                            />

                            <div className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-10 w-10 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                        <Play
                                            size={18}
                                            className="fill-current"
                                        />
                                    </div>
                                    <div className="truncate">
                                        <h3 className="font-black text-slate-900 leading-tight text-sm sm:text-base truncate">
                                            {activityToLaunch.name}
                                        </h3>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                            Select learner
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setLaunchModalOpen(false)}
                                    disabled={launchMutation.isPending}
                                    className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors disabled:opacity-50"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="relative z-10 flex-1 overflow-hidden flex flex-col p-4 sm:p-8">
                                <div className="text-center mb-6 shrink-0">
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                        Select Learner
                                    </h2>
                                    <div className="w-full max-w-md mx-auto relative group mt-4">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            {studentsPending ? (
                                                <Loader2 className="h-4 text-indigo-500 animate-spin" />
                                            ) : (
                                                <Search className="h-4 text-slate-400" />
                                            )}
                                        </div>
                                        <input
                                            className="w-full pl-11 pr-4 h-12 bg-white border border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                                            placeholder="Search by name or ID..."
                                            value={studentSearchQuery}
                                            onChange={(e) =>
                                                setStudentSearchQuery(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={launchMutation.isPending}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pb-8 px-2 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filteredStudents.map((s: any) => {
                                            const sId = s.documentId || s.id;
                                            const isThisStudentLaunching =
                                                pendingStudentId === sId;
                                            const isDisabled =
                                                launchMutation.isPending;

                                            return (
                                                <button
                                                    key={s.id}
                                                    disabled={isDisabled}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleConfirmLaunch(
                                                            sId,
                                                        );
                                                    }}
                                                    className={cn(
                                                        'group flex items-start gap-3 p-4 rounded-xl border bg-white transition-all text-left shrink-0',
                                                        isThisStudentLaunching
                                                            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg bg-indigo-50/30'
                                                            : 'border-slate-200 hover:border-indigo-500 hover:shadow-lg',
                                                        isDisabled &&
                                                            !isThisStudentLaunching &&
                                                            'opacity-50 cursor-not-allowed grayscale-[0.5]',
                                                    )}
                                                >
                                                    <UserAvatar
                                                        src={
                                                            FormatService.formatStrapiMedia(
                                                                s.profilePicture,
                                                                'thumbnail',
                                                            ) || undefined
                                                        }
                                                        name={
                                                            s.fullName ||
                                                            s.firstName
                                                        }
                                                        size="md"
                                                        className={cn(
                                                            'rounded-xl shrink-0 transition-transform',
                                                            !isDisabled &&
                                                                'group-hover:scale-105',
                                                        )}
                                                    />
                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <div className="flex justify-between items-center">
                                                            <h3 className="font-bold text-slate-900 truncate text-sm">
                                                                {s.fullName}
                                                            </h3>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <IdCard
                                                                size={12}
                                                                className="text-slate-400"
                                                            />
                                                            <span className="text-[10px] font-mono font-medium text-slate-500">
                                                                ID:{' '}
                                                                {(s.id || 0)
                                                                    .toString()
                                                                    .padStart(
                                                                        4,
                                                                        '0',
                                                                    )}
                                                            </span>
                                                        </div>

                                                        <div
                                                            className={cn(
                                                                'mt-3 pt-3 border-t border-slate-50 flex items-center justify-between transition-all',
                                                                isThisStudentLaunching
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0',
                                                            )}
                                                        >
                                                            {isThisStudentLaunching ? (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                                                                    <Loader2
                                                                        size={
                                                                            12
                                                                        }
                                                                        className="animate-spin"
                                                                    />
                                                                    Launching...
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1">
                                                                        <Play
                                                                            size={
                                                                                10
                                                                            }
                                                                            className="fill-current"
                                                                        />
                                                                        Launch
                                                                    </span>
                                                                    <ArrowRight
                                                                        size={
                                                                            12
                                                                        }
                                                                        className="text-indigo-600"
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLibrary;
