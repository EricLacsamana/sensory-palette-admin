'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Search,
    AlertTriangle,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
} from 'lucide-react';
import { Reorder, AnimatePresence } from 'framer-motion';

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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { useSessionPlan } from '@/hooks/useSessionPlan';
import ItemCard from './components/ItemCard';
import CapacityGauge from './components/CapacityGauge';
import { TimelineItem } from './components/TimelineItem';

interface SessionPlanningModalProps {
    isOpen: boolean;
    onClose: () => void;
    activities: any[];
    onConfirm: (data: { plan: any[]; date: string; start: string }) => void;
    student: any;
    activitySessions: any[];
    isSubmitting?: boolean;
}

const SessionPlanningModal = ({
    isOpen,
    onClose,
    activities,
    onConfirm,
    student,
    activitySessions,
    isSubmitting = false,
}: SessionPlanningModalProps) => {
    const todayStr = useMemo(
        () => new Date().toISOString().split('T', 1)[0],
        [],
    );
    const [startDate, setStartDate] = useState(todayStr);
    const [startTimeStr, setStartTimeStr] = useState('09:00');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [pendingChange, setPendingChange] = useState<{
        type: 'date' | 'time';
        value: string;
    } | null>(null);

    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    const prevPlanLengthRef = useRef(0);

    const { plan, setPlan, capacityMetrics, toggleLock } = useSessionPlan(
        startDate,
        startTimeStr,
        student,
        activitySessions,
    );

    const baseUrl =
        process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ||
        'http://localhost:1337';

    useEffect(() => {
        if (plan.length > prevPlanLengthRef.current && plan.length > 0) {
            scrollAnchorRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
        prevPlanLengthRef.current = plan.length;
    }, [plan.length]);

    const handleAttemptChange = (type: 'date' | 'time', value: string) => {
        if (plan.length === 0) {
            type === 'date' ? setStartDate(value) : setStartTimeStr(value);
            return;
        }
        setPendingChange({ type, value });
    };

    const [isScrollable, setIsScrollable] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkScroll = () => {
            if (containerRef.current) {
                const { scrollHeight, clientHeight } = containerRef.current;
                setIsScrollable(scrollHeight > clientHeight);
            }
        };
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [plan]);

    const confirmReset = () => {
        if (!pendingChange) return;
        pendingChange.type === 'date'
            ? setStartDate(pendingChange.value)
            : setStartTimeStr(pendingChange.value);
        setPlan([]);
        setPendingChange(null);
    };

    const handleDragStart = (e: React.DragEvent, item: any) => {
        e.dataTransfer.setData('newActivity', JSON.stringify(item));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('newActivity');
        if (!dataStr) return;
        const raw = JSON.parse(dataStr);
        setPlan((prev) => [
            ...prev,
            { ...raw, instanceId: crypto.randomUUID(), isLocked: false },
        ]);
    };

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && !isSubmitting && onClose()}
            >
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col bg-white border-slate-200 shadow-2xl transition-all duration-300 sm:rounded-3xl">
                    <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0 bg-slate-50/50 backdrop-blur-md z-30">
                        <div className="flex items-center gap-5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            >
                                {isSidebarOpen ? (
                                    <PanelLeftClose size={18} />
                                ) : (
                                    <PanelLeftOpen size={18} />
                                )}
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-semibold">
                                    {student?.firstName?.charAt(0)}
                                </div>
                                <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
                                    {student?.firstName} {student?.lastName}
                                </DialogTitle>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-sm font-medium focus:outline-none"
                                        value={startDate}
                                        onChange={(e) =>
                                            handleAttemptChange(
                                                'date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <select
                                        className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                                        value={startTimeStr}
                                        onChange={(e) =>
                                            handleAttemptChange(
                                                'time',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {Array.from({ length: 41 }, (_, i) => {
                                            const totalMin = 8 * 60 + i * 15;
                                            const val = `${Math.floor(
                                                totalMin / 60,
                                            )
                                                .toString()
                                                .padStart(
                                                    2,
                                                    '0',
                                                )}:${(totalMin % 60).toString().padStart(2, '0')}`;
                                            return (
                                                <option key={val} value={val}>
                                                    {val}
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
                                'border-r bg-slate-50/40 flex flex-col transition-all duration-300 shrink-0',
                                isSidebarOpen ? 'w-[380px]' : 'w-0 opacity-0',
                            )}
                        >
                            <div className="p-5 pb-2 min-w-[380px] shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search activities..."
                                        className="pl-9 bg-white border-slate-200 rounded-xl h-11"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 min-w-[380px]">
                                <ScrollArea className="h-full">
                                    <div className="p-5 space-y-6 pb-20">
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                                Quick Breaks
                                            </h3>
                                            <div
                                                draggable
                                                onDragStart={(e) =>
                                                    handleDragStart(e, {
                                                        name: '5m Rest Break',
                                                        duration: 5,
                                                        isBreak: true,
                                                    })
                                                }
                                                className="cursor-grab active:cursor-grabbing"
                                            >
                                                <ItemCard
                                                    id="break"
                                                    title="5m Rest Break"
                                                    subtitle="5m"
                                                    mode="add"
                                                    actionIcon={
                                                        <Plus size={16} />
                                                    }
                                                    itemValue={{
                                                        name: '5m Rest Break',
                                                        duration: 5,
                                                        isBreak: true,
                                                    }}
                                                    onActionClick={() =>
                                                        setPlan((p) => [
                                                            ...p,
                                                            {
                                                                isBreak: true,
                                                                duration: 5,
                                                                name: '5m Rest Break',
                                                                instanceId:
                                                                    crypto.randomUUID(),
                                                                isLocked: false,
                                                            },
                                                        ])
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                                Learner Activities
                                            </h3>
                                            <div className="flex flex-col gap-3">
                                                {activities
                                                    .filter((a) =>
                                                        a.name
                                                            ?.toLowerCase()
                                                            .includes(
                                                                searchTerm.toLowerCase(),
                                                            ),
                                                    )
                                                    .map((act) => {
                                                        const bannerData =
                                                            act.attributes
                                                                ?.banner?.data
                                                                ?.attributes ||
                                                            act.banner?.data
                                                                ?.attributes ||
                                                            act.banner;
                                                        const bannerPath =
                                                            bannerData?.formats
                                                                ?.thumbnail
                                                                ?.url ||
                                                            bannerData?.url;
                                                        const sidebarImg =
                                                            bannerPath
                                                                ? bannerPath.startsWith(
                                                                      'http',
                                                                  )
                                                                    ? bannerPath
                                                                    : `${baseUrl}${bannerPath}`
                                                                : null;
                                                        return (
                                                            <div
                                                                key={act.id}
                                                                draggable
                                                                onDragStart={(
                                                                    e,
                                                                ) =>
                                                                    handleDragStart(
                                                                        e,
                                                                        act,
                                                                    )
                                                                }
                                                                className="cursor-grab active:cursor-grabbing"
                                                            >
                                                                <ItemCard
                                                                    id={act.id}
                                                                    title={
                                                                        act.name
                                                                    }
                                                                    subtitle={`${act.duration || 30}m`}
                                                                    imageSrc={
                                                                        sidebarImg
                                                                    }
                                                                    mode="add"
                                                                    actionIcon={
                                                                        <Plus
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    }
                                                                    itemValue={
                                                                        act
                                                                    }
                                                                    onActionClick={() =>
                                                                        setPlan(
                                                                            (
                                                                                p,
                                                                            ) => [
                                                                                ...p,
                                                                                {
                                                                                    ...act,
                                                                                    instanceId:
                                                                                        crypto.randomUUID(),
                                                                                    isLocked: false,
                                                                                    imageUrl:
                                                                                        sidebarImg,
                                                                                },
                                                                            ],
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        </aside>

                        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden relative">
                            <div className="w-full p-5 border-b flex items-center justify-between bg-white/80 backdrop-blur-sm z-20 shrink-0">
                                <div className="flex-1 max-w-md">
                                    <CapacityGauge
                                        percent={capacityMetrics.percentUsed}
                                    />
                                </div>
                                <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 uppercase tracking-widest">
                                    Operation Ends: 6:00 PM
                                </div>
                            </div>

                            <div
                                ref={containerRef}
                                className="flex-1 overflow-y-auto bg-slate-50/20 relative min-h-0 flex flex-col scroll-smooth"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <div
                                    className={cn(
                                        'w-full max-w-4xl mx-auto relative px-8 pb-40 flex-1 flex flex-col transition-all duration-700 ease-in-out',
                                        !isScrollable && plan.length > 0
                                            ? 'justify-center'
                                            : 'justify-start pt-5',
                                    )}
                                >
                                    {plan.length > 0 && (
                                        <div className="absolute left-[110px] w-0.5 bg-slate-200 z-0 top-0 bottom-0" />
                                    )}
                                    {plan.length === 0 ? (
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
                                            values={plan}
                                            onReorder={setPlan}
                                            className="space-y-5 relative z-10 w-full"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {plan.map((item) => (
                                                    <TimelineItem
                                                        key={item.instanceId}
                                                        item={item}
                                                        setPlan={setPlan}
                                                        onToggleLock={
                                                            toggleLock
                                                        }
                                                    />
                                                ))}
                                            </AnimatePresence>
                                            <div
                                                ref={scrollAnchorRef}
                                                className="h-1 w-full"
                                            />
                                        </Reorder.Group>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t flex justify-end shrink-0 bg-white/80 backdrop-blur-sm z-30">
                                <Button
                                    className="px-12 font-semibold rounded-xl h-12 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95"
                                    onClick={() =>
                                        onConfirm({
                                            plan: plan,
                                            date: startDate,
                                            start: startTimeStr,
                                        })
                                    }
                                    disabled={plan.length === 0 || isSubmitting}
                                >
                                    Confirm Session Plan
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
                <AlertDialogContent className="rounded-[40px] border-none shadow-2xl bg-white p-10 max-w-[440px]">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-[28px] bg-amber-50 flex items-center justify-center text-amber-500 mb-6 shadow-inner ring-1 ring-amber-100">
                            <AlertTriangle size={36} strokeWidth={2.5} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
                            Reset Current Draft?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 mt-4 leading-relaxed">
                            Changing the{' '}
                            <span className="text-indigo-600 font-medium uppercase tracking-widest text-[11px]">
                                session {pendingChange?.type}
                            </span>{' '}
                            will clear your timeline.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-10 w-full">
                        <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-slate-200 font-medium text-[10px] uppercase tracking-widest">
                            Keep Draft
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmReset}
                            className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-[10px] uppercase tracking-widest shadow-lg shadow-amber-200/50"
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
