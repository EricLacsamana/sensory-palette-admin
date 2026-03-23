'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, IdCard, Clock, Plus } from 'lucide-react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
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
import { Toaster, toast } from 'sonner';
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
} from '@/api/activity-session';
import { FormatService } from '@/utils/helpers';
import { Input } from '@base-ui/react';
import { UserResponse } from '@/types';
import { UserAvatar } from '@/components/UserAvatar';
import { ActivityResponse } from '@/types/actitivity';
import { cn } from '@/lib/utils';

export const getOperatingHoursForDate = (targetDate: Date | string) => {
    const base = new Date(targetDate);
    const startStr = process.env.NEXT_PUBLIC_OPERATING_START || '08:00';
    const endStr = process.env.NEXT_PUBLIC_OPERATING_END || '18:00';

    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const s = new Date(base);
    s.setHours(startHour, startMin, 0, 0);

    const e = new Date(base);
    e.setHours(endHour, endMin, 0, 0);

    const now = new Date();
    const isToday =
        s.getFullYear() === now.getFullYear() &&
        s.getMonth() === now.getMonth() &&
        s.getDate() === now.getDate();

    if (isToday) {
        const coeff = 1000 * 60 * 5;
        const roundedNow = new Date(Math.ceil(now.getTime() / coeff) * coeff);
        if (roundedNow > s) {
            s.setTime(roundedNow.getTime());
        }
    }

    let finalEnd = new Date(e);
    if (s > e) s.setTime(e.getTime());

    return { start: s.toISOString(), end: finalEnd.toISOString() };
};

const timelineVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 60 : -60, opacity: 0 }),
};

const SessionPlanningModal = ({ onClose }: { onClose?: () => void }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = useParams();
    const queryClient = useQueryClient();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [pendingStudentId, setPendingStudentId] = useState<number | null>(
        null,
    );
    const [isDragging, setIsDragging] = useState(false);
    const [isShowOtherStudents, setIsShowOtherStudents] = useState(true);
    const [slideDirection, setSlideDirection] = useState(0);

    const [mobileSelectedActivity, setMobileSelectedActivity] =
        useState<ActivityResponse | null>(null);

    // FIX: Local state prevents Next.js routing destruction on student switch
    const [activeStudentId, setActiveStudentId] = useState<number | null>(
        () => {
            const id = params?.id || searchParams.get('studentId');
            return id ? Number(id) : null;
        },
    );

    const initialIso = useMemo(() => getOperatingHoursForDate(new Date()), []);

    const [startAt, setStartAt] = useState(initialIso.start);
    const [endAt, setEndAt] = useState(initialIso.end);

    const { data: student } = useQuery({
        queryKey: ['student', activeStudentId],
        queryFn: getStudent,
        enabled: !!activeStudentId,
    });

    const { data: studentsList = [] } = useQuery({
        queryKey: ['students', searchQuery],
        queryFn: getStudents,
    });

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return studentsList;
        return studentsList.filter(
            (s: UserResponse) =>
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
        updateActivityStartTime,
        reset,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useSessionPlan({ startAt, endAt, student });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                e.shiftKey ? canRedo && redo() : canUndo && undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

    const performClose = () => {
        reset();
        setShowExitConfirm(false);
        const p = new URLSearchParams(searchParams.toString());
        p.delete('isActivitySessionPlanningOpen');
        p.delete('studentId');
        router.replace(`${pathname}?${p.toString()}`);
        if (onClose) onClose();
        queryClient.invalidateQueries({ queryKey: ['activity-sessions'] });
    };

    const handleRequestClose = () => {
        if (isDirty) {
            setPendingStudentId(null);
            setShowExitConfirm(true);
        } else {
            performClose();
        }
    };

    const performStudentSwitch = (newId: number) => {
        reset();
        setPendingStudentId(null);
        setShowExitConfirm(false);

        // Instantly switch the UI using local state
        setActiveStudentId(newId);

        // Safely update the URL (Requires LayoutWrapper Suspense key fix)
        const p = new URLSearchParams(searchParams.toString());
        p.set('studentId', newId.toString());
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    };

    const handleStudentSwitchRequest = (newId: number) => {
        if (newId === activeStudentId) return;
        if (isDirty) {
            setPendingStudentId(newId);
            setShowExitConfirm(true);
        } else {
            performStudentSwitch(newId);
        }
    };

    // FIX: Accepts a boolean to determine if the modal should close after saving
    const handleSubmit = async (closeAfter: boolean) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            for (const id of deletedDocumentIds)
                await deleteActivitySession(id);
            for (const session of draft) {
                const payload = {
                    startAt: session.startAt,
                    endAt: session.endAt,
                };
                if (session.documentId) {
                    await updateActivitySession(session.documentId, payload);
                } else if (session.student?.id) {
                    await createActivitySession({
                        ...payload,
                        activity: session.activity?.documentId,
                        student: session.student?.id,
                    });
                }
            }
            toast.success('Session plan synchronized successfully');

            // Refetch the data to sync accurate backend Document IDs into the timeline
            await queryClient.invalidateQueries({
                queryKey: ['activity-sessions'],
            });
            if (closeAfter) {
                performClose();
            } else {
                reset();
                setPendingStudentId(null);
            }
        } catch (error) {
            console.error('Save Error:', error);
            toast.error('Failed to sync schedule. Check connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExternalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('newActivity');
        if (data) {
            try {
                addActivity(JSON.parse(data));
            } catch (err) {
                console.error('Drop error', err);
            }
        }
        setIsDragging(false);
    };

    const handleMobileAdd = () => {
        if (mobileSelectedActivity) {
            addActivity(mobileSelectedActivity);
            setMobileSelectedActivity(null);
        }
    };

    const handleTimeChange = (type: 'start' | 'end' | 'date', val1: string) => {
        const oldDateNum = new Date(startAt).setHours(0, 0, 0, 0);

        if (type === 'date' && val1) {
            const newBounds = getOperatingHoursForDate(val1);
            const newDateNum = new Date(newBounds.start).setHours(0, 0, 0, 0);

            if (oldDateNum !== newDateNum)
                setSlideDirection(newDateNum > oldDateNum ? 1 : -1);

            const now = new Date();
            const originalStartStr =
                process.env.NEXT_PUBLIC_OPERATING_START || '08:00';
            const [startHour, startMin] = originalStartStr
                .split(':')
                .map(Number);

            if (
                newDateNum === now.setHours(0, 0, 0, 0) &&
                new Date(newBounds.start) >
                    new Date(new Date().setHours(startHour, startMin, 0, 0))
            ) {
                toast.warning(
                    'Adjusted to current time (cannot schedule in the past)',
                    { id: 'past-schedule' },
                );
            }

            setStartAt(newBounds.start);
            setEndAt(newBounds.end);
            return;
        }

        let newDate = new Date(val1);
        if (type === 'start') {
            const now = new Date();
            const isToday =
                newDate.getFullYear() === now.getFullYear() &&
                newDate.getMonth() === now.getMonth() &&
                newDate.getDate() === now.getDate();

            if (isToday && newDate < now) {
                toast.error(
                    'Adjusted to current time (cannot schedule in the past)',
                    { id: 'past-schedule' },
                );
                const coeff = 1000 * 60 * 5;
                newDate = new Date(Math.ceil(now.getTime() / coeff) * coeff);
            }

            const newDateNum = new Date(newDate).setHours(0, 0, 0, 0);
            if (oldDateNum !== newDateNum)
                setSlideDirection(newDateNum > oldDateNum ? 1 : -1);

            setStartAt(newDate.toISOString());
            let currentEnd = new Date(endAt);
            currentEnd.setFullYear(
                newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate(),
            );
            if (newDate >= currentEnd)
                currentEnd = new Date(newDate.getTime() + 2 * 60 * 60 * 1000);
            setEndAt(currentEnd.toISOString());
        } else if (type === 'end') {
            setEndAt(newDate.toISOString());
        }
    };

    const renderMainContent = () => {
        return (
            <div
                className={cn(
                    'flex flex-col h-full relative w-full overflow-hidden transition-colors duration-200',
                    !activeStudentId ? 'bg-slate-50' : 'bg-white',
                )}
            >
                {/* Background grid pattern only shown when selecting a learner */}
                {!activeStudentId && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.4] z-0"
                        style={{
                            backgroundImage:
                                'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                )}

                {/* Unified Header always sits at the top */}
                <div className="relative z-10 flex flex-col h-full w-full">
                    <Header
                        hasStudent={!!activeStudentId}
                        user={student}
                        students={studentsList}
                        onSelectStudent={handleStudentSwitchRequest}
                        undo={undo}
                        redo={redo}
                        canRedo={canRedo}
                        canUndo={canUndo}
                        startAt={startAt}
                        endAt={endAt}
                        onChange={handleTimeChange}
                        isDirty={isDirty}
                        isShowOtherUsers={isShowOtherStudents}
                        setIsShowOtherUsers={setIsShowOtherStudents}
                        onClose={handleRequestClose}
                    />

                    {!activeStudentId ? (
                        /* Select Learner View */
                        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 pb-6 pt-2 sm:px-12 sm:pb-12 sm:pt-6 overflow-y-auto">
                            <div className="flex flex-col items-center text-center space-y-4 mb-6 sm:mb-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                                        Select Learner
                                    </h2>
                                    <p className="text-sm sm:text-base text-slate-500 font-medium px-4">
                                        Initiate a planning session by selecting
                                        a target profile
                                    </p>
                                </div>
                                <div className="w-full max-w-md relative group mt-2">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <Input
                                        className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-base w-full touch-auto select-text"
                                        placeholder="Search by name or ID..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-20 pr-2">
                                {filteredStudents.map((s: UserResponse) => (
                                    <button
                                        key={s.id}
                                        onClick={() =>
                                            handleStudentSwitchRequest(s.id)
                                        }
                                        className="group relative flex items-center sm:items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-lg transition-all duration-200 text-left"
                                    >
                                        <UserAvatar
                                            src={
                                                FormatService.formatStrapiMedia(
                                                    s.profilePicture,
                                                    'thumbnail',
                                                ) || undefined
                                            }
                                            name={s.fullName}
                                            size="md"
                                            className="group-hover:scale-105 transition-transform shrink-0"
                                        />
                                        <div className="flex-1 min-w-0 flex flex-col justify-center sm:mt-1">
                                            <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate pr-2 group-hover:text-indigo-700 transition-colors">
                                                {s.fullName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                                                <IdCard
                                                    size={12}
                                                    className="text-slate-400"
                                                />
                                                <span className="text-[10px] sm:text-xs font-mono text-slate-500">
                                                    ID:{' '}
                                                    {s.id
                                                        .toString()
                                                        .padStart(4, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Planner View */
                        <div className="flex-1 flex flex-row overflow-hidden relative bg-white">
                            <ActivitiesSiderbar
                                remainingMinutes={
                                    capacityMetrics.remainingMinutes
                                }
                                onDragStart={(e, a) => {
                                    e.dataTransfer.setData(
                                        'newActivity',
                                        JSON.stringify(a),
                                    );
                                    setIsDragging(true);
                                }}
                                onDragEnd={() => setIsDragging(false)}
                                onActivityTap={(act) =>
                                    setMobileSelectedActivity(act)
                                }
                            />

                            <main
                                className="flex-1 flex flex-col bg-white overflow-hidden relative min-w-0"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                }}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onDrop={handleExternalDrop}
                            >
                                <div className="h-14 border-b border-slate-100 flex justify-between bg-white items-center shrink-0 px-3 sm:px-6 z-30">
                                    <CapacityGauge
                                        percent={capacityMetrics.percentUsed}
                                        className="max-w-[130px] sm:max-w-[200px] w-full"
                                    />
                                    <div className="flex items-center gap-3 font-mono text-xs font-semibold text-slate-700">
                                        {FormatService.formatTime(
                                            endAt,
                                            '12h-simple',
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 bg-slate-50/30 relative overflow-hidden">
                                    <AnimatePresence
                                        mode="popLayout"
                                        custom={slideDirection}
                                        initial={false}
                                    >
                                        <motion.div
                                            key={startAt.split('T')[0]}
                                            custom={slideDirection}
                                            variants={timelineVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                            className="w-full h-full overflow-y-auto touch-pan-y"
                                        >
                                            <div className="w-full max-w-4xl mx-auto pl-1 pr-2 sm:pr-4 lg:pr-6 py-4 sm:py-8 relative z-10">
                                                <AnimatePresence mode="popLayout">
                                                    <Reorder.Group
                                                        axis="y"
                                                        values={draft}
                                                        onReorder={
                                                            reorderActivities
                                                        }
                                                        className="space-y-0 relative"
                                                    >
                                                        <TimelineEndpoint
                                                            type="start"
                                                            time={FormatService.formatTime(
                                                                startAt,
                                                                '12h-simple',
                                                            )}
                                                        />
                                                        <div className="my-2 relative">
                                                            {timelineItems
                                                                .filter(
                                                                    (item) =>
                                                                        isShowOtherStudents ||
                                                                        item
                                                                            .student
                                                                            ?.id ===
                                                                            activeStudentId,
                                                                )
                                                                .map((item) => (
                                                                    <TimelineItem
                                                                        key={
                                                                            item.instanceId
                                                                        }
                                                                        variant={
                                                                            item.type
                                                                        }
                                                                        data={
                                                                            item
                                                                        }
                                                                        currentStudentId={
                                                                            activeStudentId
                                                                        }
                                                                        isDraggingAny={
                                                                            isDragging
                                                                        }
                                                                        sessionStart={
                                                                            startAt
                                                                        }
                                                                        sessionEnd={
                                                                            endAt
                                                                        }
                                                                        onDragStart={() =>
                                                                            setIsDragging(
                                                                                true,
                                                                            )
                                                                        }
                                                                        onDragEnd={() =>
                                                                            setIsDragging(
                                                                                false,
                                                                            )
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
                                                                        onGapDrop={(
                                                                            act,
                                                                        ) =>
                                                                            insertAtGap(
                                                                                item.instanceId,
                                                                                act,
                                                                            )
                                                                        }
                                                                        onTimeChange={(
                                                                            time,
                                                                        ) =>
                                                                            updateActivityStartTime(
                                                                                item.instanceId,
                                                                                time,
                                                                            )
                                                                        }
                                                                    />
                                                                ))}
                                                        </div>
                                                        <TimelineEndpoint
                                                            type="end"
                                                            time={FormatService.formatTime(
                                                                endAt,
                                                                '12h-simple',
                                                            )}
                                                        />
                                                    </Reorder.Group>
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* FIX: 3-Button Layout Footer */}
                                <div className="h-16 sm:h-20 border-t border-slate-100 flex items-center justify-end px-4 sm:px-8 bg-white shrink-0 z-50 gap-2 sm:gap-3">
                                    <Button
                                        variant="ghost"
                                        className="text-slate-500 hover:text-slate-700 font-semibold"
                                        onClick={handleRequestClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold shadow-sm"
                                        onClick={() => handleSubmit(false)}
                                        disabled={!isDirty || isSubmitting}
                                    >
                                        {isSubmitting
                                            ? 'Saving...'
                                            : 'Save Only'}
                                    </Button>
                                    <Button
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                                        onClick={() => handleSubmit(true)}
                                        disabled={!isDirty || isSubmitting}
                                    >
                                        Save & Close
                                    </Button>
                                </div>
                            </main>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <Toaster
                position="top-right"
                richColors
                toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }}
            />

            <Dialog open onOpenChange={(open) => !open && handleRequestClose()}>
                <DialogContent
                    onInteractOutside={(e) => {
                        // Prevent all outside clicks from closing the modal.
                        // Forces the user to click the "X" or Cancel button, ensuring stability.
                        e.preventDefault();
                    }}
                    onEscapeKeyDown={(e) => {
                        if (isDirty) e.preventDefault();
                    }}
                    className="!max-w-[900px] w-full sm:!w-[95vw] h-[100dvh] sm:h-[92vh] p-0 flex flex-col bg-white overflow-hidden rounded-none sm:rounded-3xl shadow-2xl border-none [&>button]:hidden"
                >
                    <DialogTitle className="sr-only">
                        Session Planner
                    </DialogTitle>
                    {renderMainContent()}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!mobileSelectedActivity}
                onOpenChange={(o) => !o && setMobileSelectedActivity(null)}
            >
                <DialogContent className="w-[85vw] max-w-sm rounded-[24px] p-0 overflow-hidden bg-white border-none shadow-2xl gap-0 [&>button]:hidden">
                    <div className="w-full h-36 sm:h-40 bg-slate-100 relative shrink-0">
                        {mobileSelectedActivity?.banner ? (
                            <img
                                src={
                                    FormatService.formatStrapiMedia(
                                        mobileSelectedActivity.banner,
                                        'medium',
                                    ) || undefined
                                }
                                className="w-full h-full object-cover"
                                alt=""
                            />
                        ) : (
                            <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                                <Plus size={32} className="text-indigo-200" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>

                    <div className="px-5 pb-5 flex flex-col items-center text-center relative z-10 -mt-5">
                        <div className="bg-white p-1 rounded-full shadow-md mb-2">
                            <div className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} strokeWidth={3} />{' '}
                                {mobileSelectedActivity?.durationMinutes || 30}{' '}
                                Min
                            </div>
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-1">
                            {mobileSelectedActivity?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm font-medium text-slate-500 mt-2 px-2">
                            Tap below to insert this activity into the current
                            session timeline.
                        </DialogDescription>
                    </div>

                    <DialogFooter className="px-5 pb-5 flex flex-row gap-2 sm:gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1 rounded-xl h-12 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            onClick={() => setMobileSelectedActivity(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-[2] gap-2 rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            onClick={handleMobileAdd}
                        >
                            Add to Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={showExitConfirm}
                onOpenChange={(open) => {
                    setShowExitConfirm(open);
                    if (!open) setPendingStudentId(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl w-[90vw] max-w-sm">
                    <AlertDialogHeader>
                        {/* Dynamic learner name based on active student */}
                        <AlertDialogTitle>
                            Discard changes for{' '}
                            {student?.firstName ||
                                student?.fullName ||
                                'this learner'}
                            ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Your current draft has unsaved changes. If you
                            leave, these changes will be lost permanently.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="max-sm:flex-col gap-2">
                        <AlertDialogCancel
                            className="mt-0"
                            onClick={() => setPendingStudentId(null)}
                        >
                            Stay
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (pendingStudentId) {
                                    performStudentSwitch(pendingStudentId);
                                } else {
                                    performClose();
                                }
                            }}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SessionPlanningModal;
