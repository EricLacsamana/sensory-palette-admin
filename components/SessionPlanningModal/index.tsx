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
import { cn } from '@/lib/utils';
import { useSessionPlan } from '@/hooks/useSessionPlan';
import CapacityGauge from './components/CapacityGauge';
import { TimelineItem } from './components/TimelineItem';
import { Header } from './components/Header';
import { ActivitiesSiderbar } from './components/ActivitiesSidebar';

import {
    useSearchParams,
    useRouter,
    usePathname,
    useParams,
} from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStudent, getStudents } from '@/api/students';
import { createActivitySession } from '@/api/acitivity-session';
import { toast, Toaster } from 'sonner';

const SessionPlanningModal = ({ onClose }: any) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = useParams();
    const queryClient = useQueryClient();

    const studentId = params?.id
        ? Number(params.id)
        : searchParams.get('studentId')
          ? Number(searchParams.get('studentId'))
          : null;
    const isOpen = searchParams.get('isActivitySessionPlanningOpen') === 'true';

    // --- 1. INITIAL ISO STATE (8:00 AM - 6:00 PM) ---
    const initialIso = useMemo(() => {
        const s = new Date();
        s.setHours(8, 0, 0, 0);
        const e = new Date();
        e.setHours(18, 0, 0, 0);
        return { start: s.toISOString(), end: e.toISOString() };
    }, []);

    const [startAt, setStartAt] = useState(initialIso.start);
    const [endAt, setEndAt] = useState(initialIso.end);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

    // --- 2. QUERIES & HOOKS ---
    const { data: student } = useQuery({
        queryKey: ['student', studentId],
        queryFn: getStudent,
        enabled: !!studentId,
    });
    const { data: studentsList = [] } = useQuery({
        queryKey: ['students', searchQuery],
        queryFn: getStudents,
        enabled: !studentId && isOpen,
    });

    const {
        timelineItems,
        rawActivitySessions,
        capacityMetrics,
        addActivity,
        removeActivity,
        toggleLock,
        reorderActivities,
        clearPlan,
        lastAddedId,
    } = useSessionPlan({
        startAt,
        endAt,
        studentId: studentId || 0,
    });

    const { mutateAsync, isPending: isSubmitting } = useMutation({
        mutationFn: createActivitySession,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['activity-sessions-student'],
            });
            toast.success('Session Plan Saved');
        },
    });

    // --- 3. EFFECTS ---
    useEffect(() => {
        if (lastAddedId) {
            const timer = setTimeout(() => {
                itemRefs.current
                    .get(lastAddedId)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [lastAddedId, timelineItems.length]);

    // --- 4. HANDLERS ---
    const handleHeaderChange = (type: 'start' | 'end', val: string) => {
        if (type === 'start') {
            setStartAt(val);
        } else {
            setEndAt(val);
        }
    };

    const performClose = () => {
        const p = new URLSearchParams(searchParams.toString());
        p.delete('isActivitySessionPlanningOpen');
        p.delete('studentId');
        router.replace(`${pathname}?${p.toString()}`);
        clearPlan();
        if (onClose) onClose();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('newActivity');
        if (data) addActivity(JSON.parse(data));
    };

    const renderContent = () => {
        if (!studentId) {
            return (
                <div className="flex flex-col h-full bg-slate-50">
                    <div className="p-8 border-b bg-white">
                        <h2 className="text-2xl font-bold">Select Student</h2>
                        <Input
                            className="mt-4"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {studentsList.map((s) => (
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
                                    className="p-4 bg-white border rounded-xl hover:shadow-md transition-all text-left"
                                >
                                    <div className="font-semibold">
                                        {s.fullName}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        ID: {s.id}
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
                    student={student}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    startAt={startAt}
                    endAt={endAt}
                    onChange={handleHeaderChange}
                />
                <div className="flex-1 flex overflow-hidden">
                    <ActivitiesSiderbar
                        remainingMinutes={capacityMetrics.remainingMinutes}
                        isOpen={isSidebarOpen}
                        onDragStart={(e, a) =>
                            e.dataTransfer.setData(
                                'newActivity',
                                JSON.stringify(a),
                            )
                        }
                        onDragEnd={() => {}}
                    />
                    <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
                        <div className="p-5 border-b flex justify-between bg-white shrink-0">
                            <div className="flex-1 max-w-md">
                                <CapacityGauge
                                    percent={capacityMetrics.percentUsed}
                                />
                            </div>
                            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200  rounded-full text-[10px] font-bold text-amber-600 uppercase">
                                Ends:{' '}
                                {new Date(endAt).toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>

                        <div
                            className="flex-1 overflow-y-auto bg-slate-50/20"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <div
                                className={cn(
                                    'w-full max-w-4xl mx-auto px-5 pb-32 transition-all',
                                    timelineItems.length === 0
                                        ? 'h-full flex items-center justify-center'
                                        : 'pt-6',
                                )}
                            >
                                {timelineItems.length === 0 ? (
                                    <div className="text-slate-300 flex flex-col items-center gap-2">
                                        <Plus size={32} />
                                        <p className="font-semibold uppercase">
                                            Timeline Empty
                                        </p>
                                    </div>
                                ) : (
                                    <Reorder.Group
                                        axis="y"
                                        values={timelineItems}
                                        onReorder={reorderActivities}
                                        className="w-full px-4"
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {timelineItems.map((item) => (
                                                <TimelineItem
                                                    key={item.instanceId}
                                                    variant={item.type}
                                                    data={item}
                                                    onRemove={() =>
                                                        removeActivity(
                                                            item.instanceId,
                                                        )
                                                    }
                                                    onToggleLock={() =>
                                                        toggleLock(
                                                            item.instanceId,
                                                            item.startAt,
                                                            item.endAt,
                                                        )
                                                    }
                                                    domRef={(el) => {
                                                        if (el) {
                                                            itemRefs.current.set(
                                                                item.instanceId,
                                                                el,
                                                            );
                                                        } else {
                                                            itemRefs.current.delete(
                                                                item.instanceId,
                                                            );
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </Reorder.Group>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3 bg-white z-30">
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    rawActivitySessions.length > 0
                                        ? setShowExitConfirm(true)
                                        : performClose()
                                }
                                className="h-12 px-6"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="h-12 px-12 bg-indigo-600 text-white"
                                onClick={() => mutateAsync(rawActivitySessions)}
                                disabled={
                                    rawActivitySessions.length === 0 ||
                                    isSubmitting
                                }
                            >
                                Confirm Plan
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
                open={isOpen}
                // onOpenChange={(o) =>
                //     !o && !isSubmitting && handleCloseAttempt()
                // }
            >
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 flex flex-col bg-white sm:rounded-3xl shadow-2xl overflow-hidden">
                    <DialogTitle className="sr-only">Planning</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            rawActivitySessions.length > 0
                                ? setShowExitConfirm(true)
                                : performClose()
                        }
                        className="absolute right-6 top-6 z-50 rounded-full border bg-white/50"
                    >
                        <X size={20} />
                    </Button>
                    {renderContent()}
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={showExitConfirm}
                onOpenChange={setShowExitConfirm}
            >
                <AlertDialogContent className="rounded-[40px] p-10 max-w-[440px]">
                    <AlertDialogHeader className="items-center text-center">
                        <div className="h-20 w-20 rounded-[28px] bg-red-50 flex items-center justify-center text-red-500 mb-6">
                            <LogOut size={36} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-semibold">
                            Discard Changes?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 mt-4 leading-relaxed">
                            Your draft timeline will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-3">
                        <AlertDialogCancel className="flex-1 h-14 rounded-2xl">
                            Stay
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={performClose}
                            className="flex-1 h-14 rounded-2xl bg-red-600 text-white"
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
