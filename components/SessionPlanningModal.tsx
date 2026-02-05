'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    Calendar as CalendarIcon,
    Search,
    AlertTriangle,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
    Coffee,
    Loader2,
} from 'lucide-react';
import { Reorder, AnimatePresence } from 'framer-motion';

// Shadcn UI
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Hooks & Components
import { useSessionPlan, SessionActivity } from '@/hooks/useSessionPlan';
import ActivityCard from '@/components/ActivityCard';
import CapacityGauge from '@/components/CapacityGauge';
import TimelineItem from '@/components/TimelineItem';

interface SessionPlanningModalProps {
    isOpen: boolean;
    onClose: () => void;
    activities: SessionActivity[];
    onConfirm: (data: { plan: any[]; date: string; start: string }) => void;
    learnerName: string;
    isSubmitting?: boolean;
}

const timeToSeconds = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60;
};

const SessionPlanningModal = ({
    isOpen,
    onClose,
    activities,
    onConfirm,
    learnerName,
    isSubmitting = false,
}: SessionPlanningModalProps) => {
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [startDate, setStartDate] = useState(todayStr);
    const [startTimeStr, setStartTimeStr] = useState('09:00');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const OPERATION_END_TIME = '18:00';

    const [pendingChange, setPendingChange] = useState<{
        type: 'date' | 'time';
        value: string;
    } | null>(null);

    const {
        plan,
        setPlan,
        timeline,
        capacityMetrics,
        dragState,
        setDragState,
        resetDrag,
    } = useSessionPlan(startDate, startTimeStr);

    const canActivityFit = useCallback(
        (durationInMinutes: number) => {
            const durationInSeconds = durationInMinutes * 60;
            const startSeconds = timeToSeconds(startTimeStr);
            const cutoffSeconds = timeToSeconds(OPERATION_END_TIME);

            const currentUsedSeconds = plan.reduce((acc, item) => {
                return acc + Number(item.duration || 0) * 60;
            }, 0);

            return (
                startSeconds + currentUsedSeconds + durationInSeconds <=
                cutoffSeconds
            );
        },
        [plan, startTimeStr, OPERATION_END_TIME],
    );

    const handleAttemptChange = (type: 'date' | 'time', value: string) => {
        if (plan.length === 0) {
            if (type === 'date') setStartDate(value);
            if (type === 'time') setStartTimeStr(value);
            return;
        }
        setPendingChange({ type, value });
    };

    const confirmReset = () => {
        if (!pendingChange) return;
        if (pendingChange.type === 'date') setStartDate(pendingChange.value);
        if (pendingChange.type === 'time') setStartTimeStr(pendingChange.value);
        setPlan([]);
        setPendingChange(null);
    };

    const handleLibraryDragStart = (
        e: React.DragEvent,
        activity: any,
        isBreak = false,
        breakDur = 15,
    ) => {
        const dur = isBreak ? breakDur : activity?.duration || 30;
        if (!canActivityFit(dur)) {
            e.preventDefault();
            return;
        }
        const data = {
            ...activity,
            isBreak,
            duration: dur,
            name: isBreak ? `${dur}m Rest Break` : activity.name,
        };
        e.dataTransfer.setData('newActivity', JSON.stringify(data));
        setDragState((prev) => ({
            ...prev,
            isLibraryDrag: true,
            draggedIndex: -1,
        }));
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const dataStr = e.dataTransfer.getData('newActivity');
            if (!dataStr) return resetDrag();
            const activity = JSON.parse(dataStr);

            if (!canActivityFit(activity.duration)) return resetDrag();

            const newPlan = [...plan];
            const target =
                dragState.dragOverIndex !== null
                    ? dragState.dragOverIndex
                    : plan.length;
            newPlan.splice(target, 0, {
                ...activity,
                instanceId: `inst-${crypto.randomUUID()}`,
            });
            setPlan(newPlan);
            resetDrag();
        },
        [plan, dragState, canActivityFit, setPlan, resetDrag],
    );

    const breakOptions = [5];

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && !isSubmitting && onClose()}
            >
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col bg-white border-slate-200 shadow-2xl transition-all duration-300 sm:rounded-3xl">
                    <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0 shrink-0 bg-slate-50/50 backdrop-blur-md">
                        <div className="flex items-center gap-5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="text-slate-400 hover:text-indigo-600"
                                disabled={isSubmitting}
                            >
                                {isSidebarOpen ? (
                                    <PanelLeftClose size={18} />
                                ) : (
                                    <PanelLeftOpen size={18} />
                                )}
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm uppercase">
                                    {learnerName.charAt(0)}
                                </div>
                                <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                                    {learnerName}
                                </DialogTitle>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
                                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-sm font-semibold focus:outline-none"
                                        value={startDate}
                                        min={todayStr}
                                        disabled={isSubmitting}
                                        onChange={(e) =>
                                            handleAttemptChange(
                                                'date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <select
                                        className="bg-transparent border-none text-sm font-semibold focus:outline-none cursor-pointer"
                                        value={startTimeStr}
                                        disabled={isSubmitting}
                                        onChange={(e) =>
                                            handleAttemptChange(
                                                'time',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {Array.from({ length: 41 }, (_, i) => {
                                            const totalMin = 8 * 60 + i * 15;
                                            const h24 = Math.floor(
                                                totalMin / 60,
                                            );
                                            const m = totalMin % 60;
                                            const val24 = `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                            const h12 = h24 % 12 || 12;
                                            const ampm =
                                                h24 >= 12 ? 'PM' : 'AM';
                                            return (
                                                <option
                                                    key={val24}
                                                    value={val24}
                                                >
                                                    {h12}:
                                                    {m
                                                        .toString()
                                                        .padStart(2, '0')}{' '}
                                                    {ampm}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex overflow-hidden min-h-0">
                        <aside
                            className={cn(
                                'border-r bg-slate-50/40 flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
                                isSidebarOpen
                                    ? 'w-[380px]'
                                    : 'w-0 opacity-0 pointer-events-none',
                            )}
                        >
                            <div className="p-5 pb-2 min-w-[380px] shrink-0">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search activities..."
                                        className="pl-9 bg-white border-slate-200 rounded-xl h-11"
                                        value={searchTerm}
                                        disabled={isSubmitting}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1 min-w-[380px] min-h-0">
                                <div className="px-5 space-y-6 pb-10 pt-4">
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                            Quick Breaks
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {breakOptions.map((mins) => (
                                                <ActivityCard
                                                    key={`break-${mins}`}
                                                    isBreak
                                                    activity={{
                                                        name: `${mins}m Rest Break`,
                                                        duration: mins,
                                                    }}
                                                    isLocked={
                                                        !canActivityFit(mins) ||
                                                        isSubmitting
                                                    }
                                                    onAdd={() =>
                                                        !isSubmitting &&
                                                        canActivityFit(mins) &&
                                                        setPlan((p) => [
                                                            ...p,
                                                            {
                                                                id: crypto.randomUUID(),
                                                                isBreak: true,
                                                                duration: mins,
                                                                name: `${mins}m Rest Break`,
                                                                instanceId:
                                                                    crypto.randomUUID(),
                                                            },
                                                        ])
                                                    }
                                                    onDragStart={(e) =>
                                                        !isSubmitting &&
                                                        handleLibraryDragStart(
                                                            e,
                                                            {},
                                                            true,
                                                            mins,
                                                        )
                                                    }
                                                    onDragEnd={resetDrag}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                            Learner Activities
                                        </h3>
                                        <div className="space-y-2">
                                            {activities
                                                .filter((a) =>
                                                    a?.name
                                                        .toLowerCase()
                                                        .includes(
                                                            searchTerm.toLowerCase(),
                                                        ),
                                                )
                                                .map((act) => {
                                                    const dur =
                                                        act.duration || 30;
                                                    const locked =
                                                        !canActivityFit(dur) ||
                                                        act.activityStatus ===
                                                            'disabled' ||
                                                        isSubmitting;
                                                    return (
                                                        <ActivityCard
                                                            key={act.id}
                                                            activity={act}
                                                            isLocked={locked}
                                                            onAdd={() =>
                                                                !locked &&
                                                                setPlan((p) => [
                                                                    ...p,
                                                                    {
                                                                        ...act,
                                                                        instanceId:
                                                                            crypto.randomUUID(),
                                                                    },
                                                                ])
                                                            }
                                                            onDragStart={(e) =>
                                                                !locked &&
                                                                handleLibraryDragStart(
                                                                    e,
                                                                    act,
                                                                )
                                                            }
                                                            onDragEnd={
                                                                resetDrag
                                                            }
                                                        />
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </aside>

                        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
                            <div className="w-full p-5 shrink-0 bg-slate-50/50 backdrop-blur-sm z-10 border-b flex items-center justify-between">
                                <div className="flex-1 max-w-md">
                                    <CapacityGauge
                                        percent={capacityMetrics.percentUsed}
                                    />
                                </div>
                                <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-tight">
                                    Operation Ends: 6:00 PM
                                </div>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/20"
                                onDragOver={(e) =>
                                    !isSubmitting && e.preventDefault()
                                }
                                onDrop={handleDrop}
                            >
                                <div className="max-w-4xl mx-auto relative px-8 pb-40 pt-10 min-h-full">
                                    {/* --- THE PHYSICAL TIMELINE LINE --- */}
                                    <div className="absolute left-[110px] top-0 bottom-0 w-px bg-slate-200 z-0" />

                                    {plan.length === 0 ? (
                                        <div className="ml-[110px] h-64 border-2 border-dashed border-slate-200 rounded-[32px] bg-white flex flex-col items-center justify-center text-slate-400 gap-3 shadow-sm">
                                            <Coffee
                                                size={32}
                                                strokeWidth={1.5}
                                            />
                                            <p className="font-black text-[10px] uppercase tracking-widest">
                                                Timeline is empty
                                            </p>
                                        </div>
                                    ) : (
                                        <Reorder.Group
                                            axis="y"
                                            values={plan}
                                            onReorder={
                                                !isSubmitting
                                                    ? setPlan
                                                    : () => {}
                                            }
                                            className="space-y-8 relative z-10"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {plan.map((item, index) => (
                                                    <div
                                                        key={item.instanceId}
                                                        className="relative flex gap-12 group"
                                                    >
                                                        {/* --- TIME INDICATOR --- */}
                                                        <div className="w-16 pt-2 flex flex-col items-end shrink-0">
                                                            <span className="text-[11px] font-[1000] text-slate-900 tabular-nums">
                                                                {timeline[index]
                                                                    ?.start ||
                                                                    '--:--'}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                {
                                                                    timeline[
                                                                        index
                                                                    ]?.end
                                                                }
                                                            </span>
                                                        </div>

                                                        {/* --- THE DOT ON THE LINE --- */}
                                                        <div className="absolute left-[73px] top-3 h-3 w-3 rounded-full border-2 border-indigo-600 bg-white z-20 shadow-sm transition-transform group-hover:scale-125" />

                                                        {/* --- THE CARD --- */}
                                                        <div className="flex-1">
                                                            <TimelineItem
                                                                item={item}
                                                                startTime={
                                                                    timeline[
                                                                        index
                                                                    ]?.start
                                                                }
                                                                endTime={
                                                                    timeline[
                                                                        index
                                                                    ]?.end
                                                                }
                                                                onRemove={(
                                                                    id,
                                                                ) =>
                                                                    !isSubmitting &&
                                                                    setPlan(
                                                                        (p) =>
                                                                            p.filter(
                                                                                (
                                                                                    i,
                                                                                ) =>
                                                                                    i.instanceId !==
                                                                                    id,
                                                                            ),
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </AnimatePresence>
                                        </Reorder.Group>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t flex justify-end shrink-0 bg-slate-50/50 backdrop-blur-sm z-10">
                                <Button
                                    className="px-12 font-bold rounded-xl h-12 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() =>
                                        onConfirm({
                                            plan,
                                            date: startDate,
                                            start: startTimeStr,
                                        })
                                    }
                                    disabled={plan.length === 0 || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Session...
                                        </>
                                    ) : (
                                        'Confirm Session Plan'
                                    )}
                                </Button>
                            </div>
                        </main>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!pendingChange}
                onOpenChange={(o) => !o && setPendingChange(null)}
            >
                <AlertDialogContent className="rounded-[40px] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white p-10 max-w-[440px]">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse rounded-full" />
                            <div className="relative h-20 w-20 rounded-[28px] bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner ring-1 ring-amber-100">
                                <AlertTriangle size={36} strokeWidth={2.5} />
                            </div>
                        </div>

                        <AlertDialogTitle className="text-2xl font-[1000] text-slate-900 tracking-tight leading-tight">
                            Reset Current <br /> Session Draft?
                        </AlertDialogTitle>

                        <AlertDialogDescription className="text-[15px] font-bold text-slate-400 leading-relaxed mt-4 px-2">
                            Modifying the{' '}
                            <span className="text-indigo-600 font-black uppercase tracking-widest text-[11px]">
                                session {pendingChange?.type}
                            </span>{' '}
                            will clear your timeline to ensure all activities
                            fit the new operating hours.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-10 w-full">
                        <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                            Keep Draft
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmReset}
                            className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-amber-200/50 transition-all active:scale-95"
                        >
                            Clear & Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SessionPlanningModal;
