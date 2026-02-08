'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    AlertTriangle,
    Plus,
    Search,
    User as UserIcon,
    ChevronRight,
    X,
    LogOut,
} from 'lucide-react';
import { Reorder, AnimatePresence } from 'framer-motion';

// CHANGED: Added DialogTitle to imports
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle, // Note: This is for AlertDialog, distinct from DialogTitle above
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { useSessionPlan } from '@/hooks/useSessionPlan';
import CapacityGauge from './components/CapacityGauge';
import { TimelineItem } from './components/TimelineItem';
import { Header } from './components/Header';
import { ActivitiesSiderbar } from './components/ActivitiesSidebar';
import { Activity, ActivityEntry } from '@/types/actitivity';
import { User } from '@/types';
import {
    useSearchParams,
    useRouter,
    usePathname,
    useParams,
} from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getStudent, getStudents } from '@/api/students';

interface SessionPlanningModalProps {
    onClose: () => void;
    onConfirm: (data: {
        activitSessionItem: ActivityEntry[];
        date: string;
        start: string;
    }) => void;
    isSubmitting?: boolean;
}

const SessionPlanningModal = ({
    onClose,
    onConfirm,
    isSubmitting = false,
}: SessionPlanningModalProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = useParams();

    // ------------------------------------------------------------------
    // 1. Resolve Student ID
    // ------------------------------------------------------------------
    const routeStudentId = params?.id ? Number(params.id) : null;
    const queryStudentId = searchParams.get('studentId')
        ? Number(searchParams.get('studentId'))
        : null;

    const studentId = routeStudentId || queryStudentId || null;

    const isActivitySessionPlanningOpen =
        searchParams.get('isActivitySessionPlanningOpen') === 'true';

    // ------------------------------------------------------------------
    // 2. Data Fetching
    // ------------------------------------------------------------------
    const { data: student } = useQuery<User>({
        queryKey: ['student', { id: studentId }],
        queryFn: getStudent,
        enabled: !!studentId,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const { data: studentsList = [], isLoading: isLoadingList } = useQuery({
        queryKey: ['students', { searchQuery }],
        queryFn: getStudents,
        enabled: !studentId && isActivitySessionPlanningOpen,
    });

    // ------------------------------------------------------------------
    // 3. State & Handlers
    // ------------------------------------------------------------------
    const todayStr = useMemo(
        () => new Date().toISOString().split('T', 1)[0],
        [],
    );
    const [startDate, setStartDate] = useState(todayStr);
    const [startTimeStr, setStartTimeStr] = useState('09:00');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Alert States
    const [pendingChange, setPendingChange] = useState<{
        type: 'date' | 'time';
        value: string;
    } | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const [draggedItem, setDraggedItem] = useState<Activity | null>(null);
    const [isReordering, setIsReordering] = useState(false);

    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        timelineItems,
        rawActivities,
        capacityMetrics,
        addActivity,
        removeActivity,
        toggleLock,
        reorderActivities,
        clearPlan,
        lastAddedId,
    } = useSessionPlan({
        startDate,
        startTimeStr,
        studentId: studentId || 0,
    });

    useEffect(() => {
        if (lastAddedId) {
            const timer = setTimeout(() => {
                const element = itemRefs.current.get(lastAddedId);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest',
                    });
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [lastAddedId, timelineItems.length]);

    const handleSelectStudent = (id: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('studentId', id.toString());
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleChangeStudent = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('studentId');
        router.replace(`${pathname}?${params.toString()}`);
        clearPlan();
    };

    // --- Close & Exit Logic ---

    const performClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('isActivitySessionPlanningOpen');
        params.delete('studentId');
        router.replace(`${pathname}?${params.toString()}`);
        clearPlan();
        if (onClose) onClose();
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        performClose();
    };

    const handleCloseAttempt = () => {
        if (rawActivities.length > 0) {
            setShowExitConfirm(true);
        } else {
            performClose();
        }
    };

    const handleAttemptChange = (type: 'date' | 'time', value: string) => {
        if (rawActivities.length > 0) {
            setPendingChange({ type, value });
        } else {
            type === 'date' ? setStartDate(value) : setStartTimeStr(value);
        }
    };

    const confirmReset = () => {
        if (!pendingChange) return;
        pendingChange.type === 'date'
            ? setStartDate(pendingChange.value)
            : setStartTimeStr(pendingChange.value);
        clearPlan();
        setPendingChange(null);
    };

    const handleDragStart = (e: React.DragEvent, activity: Activity) => {
        e.dataTransfer.setData('newActivity', JSON.stringify(activity));
        setDraggedItem(activity);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('newActivity');
        if (!dataStr) return;
        try {
            const activity = JSON.parse(dataStr);
            addActivity(activity);
        } catch (err) {
            console.error(err);
        }
        setDraggedItem(null);
    };

    const handleSubmit = () => {
        onConfirm({
            activitSessionItem: rawActivities as unknown as ActivityEntry[],
            date: startDate,
            start: startTimeStr,
        });
    };

    // ------------------------------------------------------------------
    // 4. Main Render Logic
    // ------------------------------------------------------------------

    const renderContent = () => {
        // CASE A: NO STUDENT SELECTED
        if (!studentId) {
            return (
                <div className="flex flex-col h-full bg-slate-50">
                    <div className="p-8 pb-4 border-b bg-white flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Select Student
                            </h2>
                            <p className="text-slate-500 mt-1">
                                Who is this session plan for?
                            </p>
                        </div>
                    </div>

                    <div className="p-8 pt-4 pb-0 bg-white border-b">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={20}
                            />
                            <Input
                                className="pl-10 h-12 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoadingList ? (
                            <div className="flex justify-center pt-20 text-slate-400">
                                Loading students...
                            </div>
                        ) : studentsList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center pt-20 text-slate-400 opacity-60">
                                <UserIcon
                                    size={48}
                                    className="mb-4 text-slate-300"
                                />
                                <p>No students found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                                {studentsList.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() =>
                                            handleSelectStudent(s.id)
                                        }
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:ring-1 hover:ring-indigo-300 transition-all text-left group"
                                    >
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <UserIcon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-700">
                                                {s.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 truncate">
                                                Student ID: {s.id}
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={16}
                                            className="text-slate-300 group-hover:text-indigo-400"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // CASE B: STUDENT SELECTED
        return (
            <div className="flex flex-col h-full">
                <Header
                    student={student}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    startDate={startDate}
                    startTimeStr={startTimeStr}
                    onAttemptChange={handleAttemptChange}
                />

                <div className="flex-1 flex overflow-hidden min-h-0">
                    <ActivitiesSiderbar
                        isOpen={isSidebarOpen}
                        onDragStart={handleDragStart}
                        onDragEnd={() => setDraggedItem(null)}
                    />

                    <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden relative">
                        {/* Stats */}
                        <div className="w-full p-5 border-b flex items-center justify-between bg-white/80 backdrop-blur-sm z-20 shrink-0">
                            <div className="flex-1 max-w-md">
                                <CapacityGauge
                                    percent={capacityMetrics.percentUsed}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                {!routeStudentId && (
                                    <button
                                        onClick={handleChangeStudent}
                                        className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"
                                    >
                                        Change Student
                                    </button>
                                )}
                                <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 uppercase tracking-widest">
                                    Ends: 6:00 PM
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div
                            ref={containerRef}
                            className="flex-1 overflow-y-auto bg-slate-50/20 relative min-h-0 flex flex-col scroll-smooth"
                            style={{ overflowAnchor: 'none' }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                            }}
                            onDrop={handleDrop}
                        >
                            <div
                                className={cn(
                                    'w-full max-w-4xl mx-auto relative px-5 pb-0 flex-1 flex flex-col transition-all duration-700 ease-in-out',
                                    timelineItems.length === 0
                                        ? 'justify-start items-center'
                                        : 'justify-center pt-6',
                                )}
                            >
                                {timelineItems.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-60">
                                        <div className="h-24 w-24 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                                            <Plus size={32} />
                                        </div>
                                        <p className="text-sm font-semibold tracking-wide uppercase">
                                            Your timeline is empty
                                        </p>
                                    </div>
                                ) : (
                                    <Reorder.Group
                                        axis="y"
                                        values={timelineItems}
                                        onReorder={reorderActivities}
                                        className="space-y-0 relative z-10 w-full px-4"
                                        layoutScroll
                                    >
                                        <AnimatePresence
                                            mode="popLayout"
                                            initial={false}
                                        >
                                            {timelineItems.map(
                                                (item, index) => {
                                                    if (item.type === 'gap') {
                                                        return (
                                                            <TimelineItem
                                                                key={
                                                                    item.instanceId
                                                                }
                                                                variant="gap"
                                                                data={item}
                                                                draggedItem={
                                                                    draggedItem
                                                                }
                                                                isReordering={
                                                                    isReordering
                                                                }
                                                                onGapDrop={(
                                                                    activity,
                                                                ) => {
                                                                    const activitiesBefore =
                                                                        timelineItems
                                                                            .slice(
                                                                                0,
                                                                                index,
                                                                            )
                                                                            .filter(
                                                                                (
                                                                                    t,
                                                                                ) =>
                                                                                    t.type ===
                                                                                    'activity',
                                                                            ).length;
                                                                    addActivity(
                                                                        activity,
                                                                        activitiesBefore,
                                                                    );
                                                                    setDraggedItem(
                                                                        null,
                                                                    );
                                                                }}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <TimelineItem
                                                            key={
                                                                item.instanceId
                                                            }
                                                            variant="activity"
                                                            data={item}
                                                            draggedItem={
                                                                draggedItem
                                                            }
                                                            isReordering={
                                                                isReordering
                                                            }
                                                            onRemove={() =>
                                                                removeActivity(
                                                                    item.instanceId,
                                                                )
                                                            }
                                                            onToggleLock={() =>
                                                                toggleLock(
                                                                    item.instanceId,
                                                                    item.startTime,
                                                                    item.endTime,
                                                                )
                                                            }
                                                            onDragStart={() =>
                                                                setIsReordering(
                                                                    true,
                                                                )
                                                            }
                                                            onDragEnd={() =>
                                                                setIsReordering(
                                                                    false,
                                                                )
                                                            }
                                                            domRef={(el) => {
                                                                if (el)
                                                                    itemRefs.current.set(
                                                                        item.instanceId,
                                                                        el,
                                                                    );
                                                                else
                                                                    itemRefs.current.delete(
                                                                        item.instanceId,
                                                                    );
                                                            }}
                                                        />
                                                    );
                                                },
                                            )}
                                        </AnimatePresence>
                                        <div className="h-32 w-full" />
                                    </Reorder.Group>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t flex justify-end items-center shrink-0 bg-white/80 backdrop-blur-sm z-30 gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleCloseAttempt}
                                className="px-6 font-medium rounded-xl h-12 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="px-12 font-semibold rounded-xl h-12 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95"
                                onClick={handleSubmit}
                                disabled={
                                    rawActivities.length === 0 || isSubmitting
                                }
                            >
                                Confirm Session Plan
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        );
    };

    return (
        <>
            <Dialog
                open={isActivitySessionPlanningOpen}
                onOpenChange={(open) =>
                    !open && !isSubmitting && handleCloseAttempt()
                }
            >
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col bg-white border-slate-200 shadow-2xl transition-all duration-300 sm:rounded-3xl">
                    {/* CHANGED: Added Visually Hidden DialogTitle for Accessibility */}
                    <DialogTitle className="sr-only">
                        Session Planning
                    </DialogTitle>

                    {/* GLOBAL CLOSE BUTTON (Top Right) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseAttempt}
                        className="absolute right-6 top-6 z-50 h-10 w-10 rounded-full bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-white hover:shadow-md transition-all"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </Button>

                    {renderContent()}
                </DialogContent>
            </Dialog>

            {/* ALERT 1: Resetting Date/Time */}
            <AlertDialog
                open={!!pendingChange}
                onOpenChange={(o) => !o && setPendingChange(null)}
            >
                <AlertDialogContent className="rounded-[40px] border-none shadow-2xl bg-white p-10 max-w-[440px]">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-[28px] bg-amber-50 flex items-center justify-center text-amber-500 mb-6 shadow-inner ring-1 ring-amber-100">
                            <AlertTriangle size={36} strokeWidth={2.5} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
                            Reset Current Draft?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 mt-4 leading-relaxed">
                            Changing the session {pendingChange?.type} will
                            clear your timeline.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-10 w-full">
                        <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-slate-200 font-medium text-[10px] uppercase tracking-widest">
                            Keep Draft
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmReset}
                            className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-[10px] uppercase tracking-widest"
                        >
                            Clear & Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ALERT 2: Exit Confirmation */}
            <AlertDialog
                open={showExitConfirm}
                onOpenChange={(o) => !o && setShowExitConfirm(false)}
            >
                <AlertDialogContent className="rounded-[40px] border-none shadow-2xl bg-white p-10 max-w-[440px]">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-[28px] bg-red-50 flex items-center justify-center text-red-500 mb-6 shadow-inner ring-1 ring-red-100">
                            <LogOut size={36} strokeWidth={2.5} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
                            Discard Unsaved Changes?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 mt-4 leading-relaxed">
                            You have items on your timeline. Closing now will
                            discard your session plan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-10 w-full">
                        <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-slate-200 font-medium text-[10px] uppercase tracking-widest">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmExit}
                            className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium text-[10px] uppercase tracking-widest"
                        >
                            Discard & Close
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SessionPlanningModal;
