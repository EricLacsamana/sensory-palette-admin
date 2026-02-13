'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    X,
    Sparkles,
    Undo2,
    Redo2,
    LogOut,
    Search,
    Badge,
    User,
    IdCard,
    ArrowRight,
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
} from '@/api/acitivity-session';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { FormatService } from '@/utils/helpers';
import { Input } from '@base-ui/react';
import { UserResponse } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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
    const [showOtherStudents, setShowOtherStudents] = useState(true);

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
    } = useSessionPlan({ startAt, endAt });

    const dateKey = new Date(startAt).toLocaleDateString('en-CA');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    if (canRedo) redo();
                } else {
                    if (canUndo) undo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

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
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const deletePromises = deletedDocumentIds.map((id) =>
                deleteActivitySession(id),
            );
            const upsertPromises = draft.map(
                (session: ActivitySessionEntry) => {
                    const payload = {
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
                              student: session.student?.id || studentId,
                          });
                },
            );
            await Promise.all([...deletePromises, ...upsertPromises]);
            toast.success('Session plan synchronized successfully');
            performClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save changes.');
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
                console.error('Drop parse error', err);
            }
        }
        setIsDragging(false);
    };

    const renderMainContent = () => {
        if (!studentId) {
            return (
                <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.4]"
                        style={{
                            backgroundImage:
                                'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto w-full p-12">
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

                            <div className="w-full max-w-md relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <Input
                                    className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-base w-full"
                                    placeholder="Search by name or ID..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20 pr-2">
                            {filteredStudents.map((s: UserResponse) => (
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
                                    className="group relative flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-lg transition-all duration-200 text-left"
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
                                        <h3 className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-700 transition-colors">
                                            {s.fullName}
                                        </h3>
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
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                <Header
                    undo={undo}
                    redo={redo}
                    canRedo={canRedo}
                    canUndo={canUndo}
                    student={student}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    startAt={startAt}
                    endAt={endAt}
                    onChange={(type, val) =>
                        type === 'start' ? setStartAt(val) : setEndAt(val)
                    }
                    isDirty={isDirty}
                    showOtherStudents={showOtherStudents}
                    setShowOtherStudents={setShowOtherStudents}
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
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={handleExternalDrop}
                    >
                        <div className="h-16 border-b border-slate-100 flex justify-between bg-white items-center shrink-0 px-6 z-40">
                            <CapacityGauge
                                percent={capacityMetrics.percentUsed}
                                className="max-w-[200px] w-full"
                            />
                            <div className="flex items-center gap-3 font-mono text-xs font-semibold text-slate-700">
                                {FormatService.formatTime(endAt, '12h-simple')}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
                            <div className="w-full max-w-3xl mx-auto pl-2 pr-6 py-8 relative z-10">
                                <div className="absolute left-[80px] top-0 bottom-0 w-px bg-slate-200/50 z-0" />
                                <AnimatePresence mode="popLayout">
                                    <Reorder.Group
                                        axis="y"
                                        values={draft}
                                        onReorder={reorderActivities}
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
                                                        showOtherStudents ||
                                                        item.student?.id ===
                                                            studentId,
                                                )
                                                .map((item) => (
                                                    <TimelineItem
                                                        key={item.instanceId}
                                                        variant={item.type}
                                                        data={item}
                                                        currentStudentId={
                                                            studentId
                                                        }
                                                        isDraggingAny={
                                                            isDragging
                                                        }
                                                        sessionStart={startAt}
                                                        sessionEnd={endAt}
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
                                                        onTimeChange={(time) =>
                                                            updateActivityStartTime(
                                                                item.instanceId,
                                                                time,
                                                            )
                                                        }
                                                        showDetails={
                                                            !isSidebarOpen
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
                        </div>
                        <div className="h-20 border-t border-slate-100 flex items-center justify-end px-8 bg-white shrink-0 z-50 gap-3">
                            <Button variant="ghost" onClick={performClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!isDirty || isSubmitting}
                            >
                                Save Schedule
                            </Button>
                        </div>
                    </main>
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
            <Dialog open>
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 flex flex-col bg-white overflow-hidden sm:rounded-3xl shadow-2xl border-none">
                    <DialogTitle className="sr-only">
                        Session Planner
                    </DialogTitle>
                    {renderMainContent()}
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={showExitConfirm}
                onOpenChange={setShowExitConfirm}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your current draft has unsaved changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Stay</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={performClose}
                            className="bg-red-600 text-white"
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
