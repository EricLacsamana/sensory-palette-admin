'use client';

import React, { useState, useMemo } from 'react';
import {
    X,
    LogOut,
    Plus,
    Search,
    User,
    IdCard,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSessionPlan } from '@/hooks/useSessionPlan';
import CapacityGauge from './components/CapacityGauge';
import { TimelineEndpoint, TimelineItem } from './components/TimelineItem';
import { Header } from './components/Header';
import { ActivitiesSiderbar } from './components/ActivitiesSidebar';

import {
    useSearchParams,
    useRouter,
    usePathname,
    useParams,
} from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStudent, getStudents } from '@/api/students';
import {
    createActivitySession,
    updateActivitySession,
    deleteActivitySession,
} from '@/api/acitivity-session';
import { toast, Toaster } from 'sonner';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { FormatService } from '@/utils/helpers';

const SessionPlanningModal = ({ onClose }: { onClose?: () => void }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = useParams();
    const queryClient = useQueryClient();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const studentId = useMemo(() => {
        const id = params?.id || searchParams.get('studentId');
        return id ? Number(id) : null;
    }, [params?.id, searchParams]);

    const initialIso = useMemo(() => {
        const s = new Date();
        s.setHours(8, 0, 0, 0);
        const e = new Date();
        e.setHours(18, 0, 0, 0);
        return { start: s.toISOString(), end: e.toISOString() };
    }, []);

    const [startAt, setStartAt] = useState(initialIso.start);
    const [endAt, setEndAt] = useState(initialIso.end);

    const { data: student } = useQuery({
        queryKey: ['student', studentId],
        queryFn: getStudent,
        enabled: !!studentId,
    });

    const { data: studentsList = [] } = useQuery({
        queryKey: ['students', searchQuery],
        queryFn: getStudents,
        enabled: !studentId,
    });

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return studentsList;
        return studentsList.filter(
            (s) =>
                s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.id?.toString().includes(searchQuery),
        );
    }, [studentsList, searchQuery]);

    const {
        timelineItems,
        draft,
        deletedDocumentIds,
        capacityMetrics,
        isDirty,
        addActivity,
        insertAtGap,
        removeActivity,
        toggleLock,
        reorderActivities,
        reset,
    } = useSessionPlan({ startAt, endAt, studentId });

    const performClose = () => {
        reset();
        const p = new URLSearchParams(searchParams.toString());
        p.delete('isActivitySessionPlanningOpen');
        p.delete('studentId');
        router.replace(`${pathname}?${p.toString()}`);
        if (onClose) onClose();
        queryClient.invalidateQueries({ queryKey: ['activity-sessions'] });
    };

    const handleSubmit = async () => {
        if (isSubmitting || !studentId) return;
        setIsSubmitting(true);
        try {
            const deletePromises = deletedDocumentIds.map((id) =>
                deleteActivitySession(id),
            );
            const upsertPromises = draft.map(
                (session: ActivitySessionEntry) => {
                    const payload = {
                        // activity: session.activity.documentId,
                        startAt: FormatService.formatDateTime(
                            session.startAt,
                            'iso',
                        ),
                        endAt: FormatService.formatDateTime(
                            session.endAt,
                            'iso',
                        ),
                        durationMinutes: session.durationMinutes,
                    };
                    return session.documentId
                        ? updateActivitySession(session.documentId, payload)
                        : createActivitySession({
                              ...payload,
                              activity: session.activity.documentId,
                              student: studentId,
                          });
                },
            );

            await Promise.all([...deletePromises, ...upsertPromises]);
            toast.success('Session plan synchronized successfully');
            performClose();
        } catch (error) {
            const strapiError = error?.response;
            console.error('Unexpected Error:', strapiError);
            // if (strapiError) {
            //     console.error('Strapi Error Status:', strapiError.status);
            //     console.error('Strapi Error Name:', strapiError.name);
            //     console.error('Strapi Error Message:', strapiError.message);
            //     console.error('Strapi Error Details:', strapiError.details);
            // } else {
            //     console.error('Unexpected Error:', error);
            // }
            toast.error('Failed to save changes.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExternalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('newActivity');
        if (data) addActivity(JSON.parse(data));
        setIsDragging(false);
    };

    const renderMainContent = () => {
        // --- VIEW 1: STUDENT SELECTION ---
        if (!studentId) {
            return (
                <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
                    {/* Technical Grid Background */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.4]"
                        style={{
                            backgroundImage:
                                'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto w-full p-12">
                        {/* Header Section */}
                        <div className="flex flex-col items-center text-center space-y-4 mb-10">
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
                                    Initiate a planning session by selecting a
                                    target profile
                                </p>
                            </div>

                            {/* Search Input */}
                            <div className="w-full max-w-md relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <Input
                                    className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-base"
                                    placeholder="Search by name or ID..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    autoFocus
                                />
                                <div className="absolute inset-y-0 right-2 flex items-center">
                                    <Badge
                                        variant="secondary"
                                        className="h-6 bg-slate-100 text-slate-500 text-[10px] font-mono border-slate-200"
                                    >
                                        ESC to close
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20 pr-2">
                            {filteredStudents.map((s: any) => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        const p = new URLSearchParams(
                                            searchParams.toString(),
                                        );
                                        p.set('studentId', s.id.toString());
                                        router.replace(
                                            `${pathname}?${p.toString()}`,
                                        );
                                    }}
                                    className="group relative flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 text-left"
                                >
                                    <Avatar className="h-12 w-12 rounded-lg border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage
                                            src={FormatService.formatStrapiMedia(
                                                s.profilePicture,
                                                'thumbnail',
                                            )}
                                        />
                                        <AvatarFallback className="bg-slate-50 text-slate-600 font-bold rounded-lg">
                                            {s.fullName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-700 transition-colors">
                                                {s.fullName}
                                            </h3>
                                            {/* Status Dot */}
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <IdCard
                                                size={12}
                                                className="text-slate-400"
                                            />
                                            <span className="text-xs font-mono text-slate-500">
                                                ID:{' '}
                                                {s.id
                                                    .toString()
                                                    .padStart(4, '0')}
                                            </span>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                                Select Profile
                                            </span>
                                            <ArrowRight
                                                size={12}
                                                className="text-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {filteredStudents.length === 0 && (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                                    <Sparkles
                                        size={32}
                                        className="mb-3 opacity-20"
                                    />
                                    <p className="text-sm font-medium">
                                        No learners found matching "
                                        {searchQuery}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // --- VIEW 2: PLANNING INTERFACE ---
        return (
            <div className="flex flex-col h-full">
                <Header
                    student={student}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    startAt={startAt}
                    endAt={endAt}
                    onChange={(type, val) =>
                        type === 'start' ? setStartAt(val) : setEndAt(val)
                    }
                />
                <div className="flex-1 flex overflow-hidden">
                    <ActivitiesSiderbar
                        remainingMinutes={capacityMetrics.remainingMinutes}
                        isOpen={isSidebarOpen}
                        onDragStart={(e, a) => {
                            e.dataTransfer.setData(
                                'newActivity',
                                JSON.stringify(a),
                            );
                            setIsDragging(true);
                        }}
                        onDragEnd={() => setIsDragging(false)}
                    />
                    <main
                        className="flex-1 flex flex-col bg-white overflow-hidden relative"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleExternalDrop}
                    >
                        {/* 1. Technical Header */}
                        <div className="h-16 border-b border-slate-100 flex justify-between bg-white items-center shrink-0 px-6 z-40 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                            <CapacityGauge
                                percent={capacityMetrics.percentUsed}
                                className="max-w-[200px] w-full"
                            />
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                                        Session End
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700 font-mono">
                                        {FormatService.formatTime(
                                            endAt,
                                            '12h-simple',
                                        )}
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-100 mx-2" />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-medium border-slate-200 text-slate-600"
                                    onClick={() =>
                                        setStartAt(new Date().toISOString())
                                    }
                                >
                                    Auto-fill
                                </Button>
                            </div>
                        </div>

                        {/* 2. Scrollable Timeline Area */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30 relative">
                            {/* Technical Grid Background */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
                                    backgroundSize: '40px 40px',
                                    opacity: 0.5,
                                }}
                            />

                            <div className="w-full max-w-3xl mx-auto pl-2 pr-6 py-8 relative z-10">
                                <Reorder.Group
                                    axis="y"
                                    values={timelineItems}
                                    onReorder={reorderActivities}
                                    className="space-y-0 relative"
                                >
                                    {/* Continuous Line Underlay */}
                                    <div className="absolute left-[79px] top-4 bottom-4 w-px bg-slate-100 -z-10" />

                                    <TimelineEndpoint
                                        type="start"
                                        time={FormatService.formatTime(
                                            startAt,
                                            '12h-simple',
                                        )}
                                    />

                                    <div className="my-4">
                                        <AnimatePresence
                                            mode="popLayout"
                                            initial={false}
                                        >
                                            {timelineItems.length === 0 ? (
                                                <div className="py-24 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl mx-12 bg-slate-50/50">
                                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                                                        <Plus
                                                            className="text-slate-300"
                                                            size={20}
                                                        />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500">
                                                        Timeline Empty
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Drag activities from the
                                                        sidebar
                                                    </p>
                                                </div>
                                            ) : (
                                                timelineItems.map((item) => (
                                                    <TimelineItem
                                                        key={item.instanceId}
                                                        variant={item.type}
                                                        data={item}
                                                        isDraggingAny={
                                                            isDragging
                                                        }
                                                        onDragStart={() =>
                                                            setIsDragging(true)
                                                        }
                                                        onDragEnd={() =>
                                                            setIsDragging(false)
                                                        }
                                                        onRemove={() =>
                                                            removeActivity(
                                                                item.instanceId,
                                                            )
                                                        }
                                                        onToggleLock={() =>
                                                            toggleLock(
                                                                item.instanceId,
                                                            )
                                                        }
                                                        onGapDrop={(activity) =>
                                                            insertAtGap(
                                                                item.instanceId,
                                                                activity,
                                                            )
                                                        }
                                                    />
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <TimelineEndpoint
                                        type="end"
                                        time={FormatService.formatTime(
                                            endAt,
                                            '12h-simple',
                                        )}
                                    />
                                </Reorder.Group>
                            </div>
                        </div>

                        {/* 3. Footer */}
                        <div className="h-20 border-t border-slate-100 flex items-center justify-between px-8 bg-white shrink-0 z-50">
                            <div className="text-xs text-slate-400">
                                {isDirty
                                    ? 'Unsaved changes'
                                    : 'All changes saved'}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        isDirty || deletedDocumentIds.length > 0
                                            ? setShowExitConfirm(true)
                                            : performClose()
                                    }
                                    className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={cn(
                                        'px-8 h-10 rounded-lg font-medium transition-all shadow-sm',
                                        isSubmitting
                                            ? 'bg-slate-100 text-slate-400'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
                                    )}
                                    onClick={handleSubmit}
                                    disabled={
                                        (!isDirty &&
                                            deletedDocumentIds.length === 0) ||
                                        isSubmitting
                                    }
                                >
                                    {isSubmitting
                                        ? 'Syncing...'
                                        : 'Save Schedule'}
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    };

    return (
        <>
            <Dialog open>
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 flex flex-col bg-white overflow-hidden sm:rounded-3xl shadow-2xl border-none">
                    <DialogTitle className="sr-only">
                        Session Planner
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            isDirty || deletedDocumentIds.length > 0
                                ? setShowExitConfirm(true)
                                : performClose()
                        }
                        className="absolute right-6 top-6 z-50 rounded-full border bg-white/80 backdrop-blur-sm hover:bg-slate-100"
                    >
                        <X size={20} />
                    </Button>
                    {renderMainContent()}
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={showExitConfirm}
                onOpenChange={setShowExitConfirm}
            >
                <AlertDialogContent className="rounded-2xl p-8 max-w-[400px]">
                    <AlertDialogHeader className="items-center text-center">
                        <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
                            <LogOut size={28} />
                        </div>
                        <AlertDialogTitle className="text-xl font-semibold">
                            Discard Changes?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 mt-2 text-sm leading-relaxed">
                            Your current draft has unsaved changes. Discarding
                            will revert the timeline to its last saved state.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3 sm:flex-row flex-col">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl text-slate-600">
                            Stay
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={performClose}
                            className="flex-1 h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100"
                        >
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Toaster position="top-right" richColors />
        </>
    );
};

export default SessionPlanningModal;
