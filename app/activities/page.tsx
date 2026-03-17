'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
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
    User,
    Loader2,
    IdCard,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { useActivities } from '@/hooks/useActivities';
import { getStudents } from '@/api/students';
import {
    createActivitySession,
    getActivitySessions,
    getActivitySessionsNew,
} from '@/api/activity-session';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ActivitySessionResponse,
    ActivitySessionStatus,
} from '@/types/activitiy-session';

const getCategoryIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'cognitive':
            return <Brain className="mr-2 h-3 w-3" />;
        case 'motor':
            return <Activity className="mr-2 h-3 w-3" />;
        default:
            return <Tag className="mr-2 h-3 w-3" />;
    }
};

const ActivityLibrary = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentIdParam = searchParams.get('studentId');

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);

    // Modal & Student Selection State
    const [launchModalOpen, setLaunchModalOpen] = useState(false);
    const [activityToLaunch, setActivityToLaunch] = useState<any>(null);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    // --- Fetchers ---
    const { data: activities, isLoading: actLoading } = useActivities();

    const {
        data: studentsList = [],
        isLoading: studentsLoading,
        isFetching: studentsFetching,
    } = useQuery({
        queryKey: ['students', { searchQuery: studentSearchQuery }],
        queryFn: getStudents,
    });

    const { data: activeSessions = [] } = useQuery({
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
                    ],
                },
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
            },
        ],
        placeholderData: [],
        queryFn: getActivitySessionsNew,
        refetchInterval: 3000,
    });

    const isLocked = activeSessions?.length > 0;
    const activeSession = isLocked ? activeSessions[0] : null;

    // Safeguard against the string "null" in the URL
    const parsedStudentIdParam =
        studentIdParam && studentIdParam !== 'null'
            ? Number(studentIdParam)
            : null;

    // Pre-selected student (if passed via URL)
    const preselectedStudent = useMemo(() => {
        if (!parsedStudentIdParam) return null;
        return studentsList.find((s: any) => s.id === parsedStudentIdParam);
    }, [studentsList, parsedStudentIdParam]);

    // --- Mutations ---
    const launchMutation = useMutation({
        mutationFn: async (payload: any) => {
            return await createActivitySession(payload);
        },
        onSuccess: () => {
            toast.success('Session launched successfully!');
            router.push('/'); // Redirects to dashboard after successful launch
        },
        onError: () => {
            toast.error('Failed to launch the session. Please try again.');
        },
    });

    // --- Filtering ---
    const filteredActivities = useMemo(() => {
        return activities?.filter((activity: any) => {
            const matchesSearch = activity.name
                .toLowerCase()
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
        if (!studentSearchQuery) return studentsList;
        return studentsList.filter(
            (s: any) =>
                s.fullName
                    ?.toLowerCase()
                    .includes(studentSearchQuery.toLowerCase()) ||
                s.firstName
                    ?.toLowerCase()
                    .includes(studentSearchQuery.toLowerCase()) ||
                s.lastName
                    ?.toLowerCase()
                    .includes(studentSearchQuery.toLowerCase()) ||
                s.id?.toString().includes(studentSearchQuery),
        );
    }, [studentsList, studentSearchQuery]);

    const handleOpenLaunchModal = (activity: any) => {
        // Block launch if there's an active session
        if (isLocked) {
            toast.error('You have an ongoing session.', {
                description:
                    'Please complete or end your current session before launching a new one.',
                action: activeSession
                    ? {
                          label: 'Resume Session',
                          onClick: () => router.push('/'),
                      }
                    : undefined,
            });
            return;
        }

        setActivityToLaunch(activity);

        // If a student is already hard-selected via URL, bypass the modal and launch immediately
        if (parsedStudentIdParam) {
            handleConfirmLaunch(parsedStudentIdParam, activity);
        } else {
            setLaunchModalOpen(true);
        }
    };

    // The actual launch trigger
    const handleConfirmLaunch = (
        selectedStudentId: string | number,
        activityOverride?: any,
    ) => {
        const targetActivity = activityOverride || activityToLaunch;

        if (!selectedStudentId || !targetActivity) {
            toast.error('Missing required information to launch session.');
            return;
        }

        launchMutation.mutate({
            activity: targetActivity.documentId || targetActivity.id,
            student: selectedStudentId,
            activitySessionStatus: 'in_progress',
            startAt: new Date().toISOString(),
        });
    };

    if (actLoading || (studentsLoading && !studentSearchQuery)) {
        return (
            <div className="flex h-[70vh] items-center justify-center text-indigo-600 font-bold animate-pulse">
                Syncing Library...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-6 py-12 relative">
            {/* Header */}
            <header className="mb-12 text-center">
                <div className="flex items-center justify-center gap-6 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {preselectedStudent
                            ? `${preselectedStudent.firstName}'s Tasks`
                            : 'Activity Vault'}
                    </h1>
                </div>
                <p className="text-slate-500 font-medium italic">
                    Select a module to initiate the session workflow.
                </p>
            </header>

            {/* Ongoing Session Warning Banner */}
            {isLocked && (
                <div className="mb-8 w-full max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <Activity size={18} className="animate-pulse" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-bold text-amber-900 leading-tight">
                                Session in Progress
                            </h4>
                            <p className="text-[10px] font-medium text-amber-700 uppercase tracking-widest mt-0.5">
                                Finish current activity first
                            </p>
                        </div>
                    </div>
                    {activeSession && (
                        <button
                            onClick={() => router.push('/')}
                            className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-sm transition-colors"
                        >
                            Resume
                        </button>
                    )}
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col items-center gap-8 mb-16">
                <div className="relative w-full max-w-xl group">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search specific goals..."
                        className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-6 outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {categoryButtons.map((catName: any) => (
                        <button
                            key={catName}
                            onClick={() => setActiveCategory(catName)}
                            className={cn(
                                'flex items-center rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300',
                                activeCategory === catName
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-0.5'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-500',
                            )}
                        >
                            {catName === 'All' ? (
                                <Gamepad2 className="mr-2" size={14} />
                            ) : (
                                <Tag className="mr-2" size={14} />
                            )}
                            {catName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredActivities?.map((activity: any) => {
                    const id = activity.documentId || activity.id;
                    const isAvailable = activity.activityStatus === 'active';
                    const canLaunch = isAvailable && !isLocked;
                    const isHovered = hoveredId === id;

                    return (
                        <div
                            key={id}
                            onMouseEnter={() => setHoveredId(id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => {
                                if (!isAvailable) return;
                                handleOpenLaunchModal(activity);
                            }}
                            className={cn(
                                'group relative flex flex-col rounded-[40px] bg-white border border-slate-100 transition-all duration-500 isolate',
                                isAvailable
                                    ? isLocked
                                        ? 'cursor-not-allowed'
                                        : 'cursor-pointer'
                                    : 'cursor-not-allowed grayscale-[0.5]',
                                isHovered && canLaunch
                                    ? 'translate-y-[-12px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] border-indigo-100'
                                    : 'shadow-sm',
                            )}
                        >
                            {/* Image Wrapper */}
                            <div className="relative h-56 w-full p-4">
                                <div className="h-full w-full rounded-[32px] overflow-hidden bg-slate-50">
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
                                                'scale-110',
                                        )}
                                    />
                                </div>
                                {!isAvailable && (
                                    <div className="absolute inset-4 rounded-[32px] flex flex-col items-center justify-center bg-slate-900/60 text-white backdrop-blur-[2px]">
                                        <Lock
                                            size={28}
                                            className="mb-3 opacity-80"
                                        />
                                        <span className="text-xs font-black tracking-widest uppercase">
                                            System Locked
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col p-8 pt-2">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {activity.categories?.map(
                                        (cat: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter"
                                            >
                                                {getCategoryIcon(cat.type)}
                                                {cat.name}
                                            </span>
                                        ),
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                                    {activity.name}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-8 font-medium">
                                    {activity.description ||
                                        'No description available for this protocol.'}
                                </p>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center text-slate-300">
                                        <ChevronRight size={16} />
                                    </div>

                                    <div
                                        className={cn(
                                            'flex items-center justify-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-lg',
                                            isAvailable
                                                ? isLocked
                                                    ? 'bg-amber-500 shadow-amber-100'
                                                    : 'bg-indigo-600 shadow-indigo-100'
                                                : 'bg-slate-200 shadow-none',
                                            isHovered && canLaunch
                                                ? 'w-36 h-12'
                                                : 'w-12 h-12',
                                        )}
                                    >
                                        <div className="flex items-center gap-3 text-white">
                                            {isLocked && isAvailable ? (
                                                <Lock
                                                    size={16}
                                                    className="text-white"
                                                />
                                            ) : (
                                                <Play
                                                    size={16}
                                                    className={cn(
                                                        isHovered &&
                                                            canLaunch &&
                                                            'fill-current',
                                                    )}
                                                />
                                            )}

                                            {isHovered && canLaunch && (
                                                <span className="text-[11px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-left-2 whitespace-nowrap">
                                                    Launch
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredActivities?.length === 0 && (
                <div className="py-32 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gamepad2 size={40} className="text-slate-200" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
                        No matching activities
                    </h2>
                    <p className="text-slate-400 text-sm mt-2">
                        Try adjusting your search or category filters.
                    </p>
                </div>
            )}

            {/* Launch Confirmation & Learner Selector Modal */}
            {launchModalOpen && activityToLaunch && !isLocked && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() =>
                            !launchMutation.isPending &&
                            setLaunchModalOpen(false)
                        }
                    />

                    <div className="relative bg-slate-50 rounded-[40px] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
                        {/* Background Grid Pattern inside Modal */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-[0.4]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                                backgroundSize: '40px 40px',
                            }}
                        />

                        {/* Modal Header / Selected Activity Context */}
                        <div className="relative z-10 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-md p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Play size={20} className="fill-current" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 leading-tight">
                                        {activityToLaunch.name}
                                    </h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Select learner to initiate session
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLaunchModalOpen(false)}
                                disabled={launchMutation.isPending}
                                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body: User Selector */}
                        <div className="relative z-10 flex-1 overflow-hidden flex flex-col p-8 md:p-12">
                            <div className="flex flex-col items-center text-center space-y-4 mb-8 shrink-0">
                                <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center mb-2">
                                    <User
                                        size={32}
                                        className="text-indigo-600"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                                        Select Learner
                                    </h2>
                                    <p className="text-slate-500 font-medium">
                                        Initiate the workflow by selecting a
                                        target profile
                                    </p>
                                </div>

                                {/* Modal Search Input */}
                                <div className="w-full max-w-md relative group mt-2">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        {studentsFetching ? (
                                            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                                        ) : (
                                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        )}
                                    </div>
                                    <input
                                        className="w-full pl-12 pr-4 h-14 bg-white border border-slate-200 shadow-sm rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-base font-medium placeholder:text-slate-400"
                                        placeholder="Search by name or ID..."
                                        value={studentSearchQuery}
                                        onChange={(e) =>
                                            setStudentSearchQuery(
                                                e.target.value,
                                            )
                                        }
                                        autoFocus
                                        disabled={launchMutation.isPending}
                                    />
                                </div>
                            </div>

                            {/* Students Grid */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 px-2">
                                {launchMutation.isPending ? (
                                    <div className="h-full flex flex-col items-center justify-center text-indigo-600 space-y-4">
                                        <Loader2
                                            size={40}
                                            className="animate-spin"
                                        />
                                        <span className="font-bold tracking-widest uppercase text-xs">
                                            Launching Session...
                                        </span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredStudents.map((s: any) => (
                                            <button
                                                key={s.id}
                                                onClick={() =>
                                                    handleConfirmLaunch(
                                                        s.documentId || s.id,
                                                    )
                                                }
                                                className="group relative flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 text-left"
                                            >
                                                <Avatar className="h-14 w-14 rounded-xl border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                                                    <AvatarImage
                                                        src={FormatService.formatStrapiMedia(
                                                            s.profilePicture,
                                                            'thumbnail',
                                                        )}
                                                    />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-lg rounded-xl">
                                                        {s.firstName?.charAt(
                                                            0,
                                                        ) ||
                                                            s.fullName?.charAt(
                                                                0,
                                                            )}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0 pt-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-700 transition-colors text-base">
                                                            {s.fullName ||
                                                                `${s.firstName || ''} ${s.lastName || ''}`.trim()}
                                                        </h3>
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-1">
                                                        <IdCard
                                                            size={12}
                                                            className="text-slate-400"
                                                        />
                                                        <span className="text-xs font-mono font-medium text-slate-500">
                                                            ID:{' '}
                                                            {(s.id || 0)
                                                                .toString()
                                                                .padStart(
                                                                    4,
                                                                    '0',
                                                                )}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                                                            <Play
                                                                size={10}
                                                                className="fill-current"
                                                            />
                                                            Launch Now
                                                        </span>
                                                        <ArrowRight
                                                            size={14}
                                                            className="text-indigo-600"
                                                        />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!launchMutation.isPending &&
                                    !studentsFetching &&
                                    filteredStudents.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <Sparkles
                                                size={40}
                                                className="mb-4 opacity-20"
                                            />
                                            <p className="text-base font-medium text-slate-500">
                                                No learners found matching "
                                                {studentSearchQuery}"
                                            </p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLibrary;
