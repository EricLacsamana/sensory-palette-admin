'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Search,
    AlertTriangle,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
    Loader2,
    Plus,
    Trash2,
} from 'lucide-react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';

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
import ItemCard from '@/components/ItemCard';
import CapacityGauge from '@/components/CapacityGauge';

interface SessionPlanningModalProps {
    isOpen: boolean;
    onClose: () => void;
    activities: any[];
    onConfirm: (plan: any[]) => void;
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
    const prevLengthRef = useRef(0);

    const { plan, setPlan, dragState, setDragState, capacityMetrics } =
        useSessionPlan(startDate, startTimeStr, student, activitySessions);

    useEffect(() => {
        if (plan.length > prevLengthRef.current && plan.length > 3) {
            scrollAnchorRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
        prevLengthRef.current = plan.length;
    }, [plan.length]);

    const handleInsert = (raw: any, index: number | null) => {
        const newItem = { ...raw, instanceId: crypto.randomUUID() };
        setPlan((prev) => {
            const updated = [...prev];
            if (index !== null) {
                updated.splice(index, 0, newItem);
            } else {
                updated.push(newItem);
            }
            return updated;
        });
        setDragState({ isLibraryDrag: false, dragOverIndex: null });
    };

    const confirmReset = () => {
        if (!pendingChange) return;
        pendingChange.type === 'date'
            ? setStartDate(pendingChange.value)
            : setStartTimeStr(pendingChange.value);
        setPlan([]);
        setPendingChange(null);
    };

    const baseUrl =
        process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ||
        'http://localhost:1337';

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && !isSubmitting && onClose()}
            >
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col bg-white shadow-2xl transition-all duration-300 sm:rounded-3xl">
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
                                            plan.length === 0
                                                ? setStartDate(e.target.value)
                                                : setPendingChange({
                                                      type: 'date',
                                                      value: e.target.value,
                                                  })
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <select
                                        className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                                        value={startTimeStr}
                                        onChange={(e) =>
                                            plan.length === 0
                                                ? setStartTimeStr(
                                                      e.target.value,
                                                  )
                                                : setPendingChange({
                                                      type: 'time',
                                                      value: e.target.value,
                                                  })
                                        }
                                    >
                                        {Array.from({ length: 41 }, (_, i) => {
                                            const val = `${Math.floor(
                                                (8 * 60 + i * 15) / 60,
                                            )
                                                .toString()
                                                .padStart(
                                                    2,
                                                    '0',
                                                )}:${((8 * 60 + i * 15) % 60).toString().padStart(2, '0')}`;
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
                            <div className="p-5 pb-2 min-w-[380px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search activities..."
                                        className="pl-9 bg-white rounded-xl h-11"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <ScrollArea className="flex-1 min-w-[380px]">
                                <div className="p-5 space-y-6">
                                    <ItemCard
                                        id="break"
                                        title="5m Rest Break"
                                        subtitle="5m"
                                        mode="add"
                                        actionIcon={<Plus size={16} />}
                                        itemValue={{
                                            name: '5m Rest Break',
                                            duration: 5,
                                            isBreak: true,
                                        }}
                                        onActionClick={() =>
                                            handleInsert(
                                                {
                                                    name: '5m Rest Break',
                                                    duration: 5,
                                                    isBreak: true,
                                                },
                                                null,
                                            )
                                        }
                                    />
                                    <Separator />
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
                                                act.attributes?.banner?.data
                                                    ?.attributes || act.banner;
                                            const bannerPath =
                                                bannerData?.formats?.thumbnail
                                                    ?.url || bannerData?.url;
                                            const img = bannerPath
                                                ? bannerPath.startsWith('http')
                                                    ? bannerPath
                                                    : `${baseUrl}${bannerPath}`
                                                : null;
                                            return (
                                                <ItemCard
                                                    key={act.id}
                                                    id={act.id}
                                                    title={act.name}
                                                    subtitle={`${act.duration || 30}m`}
                                                    imageSrc={img}
                                                    mode="add"
                                                    actionIcon={
                                                        <Plus size={16} />
                                                    }
                                                    itemValue={act}
                                                    onActionClick={() =>
                                                        handleInsert(act, null)
                                                    }
                                                />
                                            );
                                        })}
                                </div>
                            </ScrollArea>
                        </aside>

                        <main className="flex-1 flex flex-col min-w-0 bg-white relative">
                            <div className="w-full p-5 border-b z-20 shrink-0">
                                <CapacityGauge
                                    percent={capacityMetrics.percentUsed}
                                />
                            </div>

                            <div
                                className="flex-1 overflow-y-auto bg-slate-50/20 flex flex-col scroll-smooth"
                                onDragLeave={() =>
                                    setDragState((prev) => ({
                                        ...prev,
                                        dragOverIndex: null,
                                    }))
                                }
                                onDrop={(e) => {
                                    e.preventDefault();
                                    try {
                                        const data = JSON.parse(
                                            e.dataTransfer.getData(
                                                'newActivity',
                                            ),
                                        );
                                        handleInsert(
                                            data,
                                            dragState.dragOverIndex,
                                        );
                                    } catch (err) {
                                        setDragState({
                                            isLibraryDrag: false,
                                            dragOverIndex: null,
                                        });
                                    }
                                }}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <div
                                    className={cn(
                                        'w-full max-w-4xl mx-auto relative px-8 pb-40 flex-1 flex flex-col transition-all duration-700 ease-in-out',
                                        plan.length <= 3
                                            ? 'justify-center'
                                            : 'justify-start pt-20',
                                    )}
                                >
                                    {plan.length > 0 && (
                                        <div
                                            className={cn(
                                                'absolute left-[110px] w-px bg-slate-200 z-0',
                                                plan.length <= 3
                                                    ? 'top-[20%] bottom-[20%]'
                                                    : 'top-0 bottom-0',
                                            )}
                                        />
                                    )}

                                    {plan.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-slate-300 gap-4 h-full opacity-60">
                                            <Plus
                                                size={48}
                                                className="stroke-[1px]"
                                            />
                                            <p className="font-medium">
                                                Drag activities here to start
                                            </p>
                                        </div>
                                    ) : (
                                        <Reorder.Group
                                            axis="y"
                                            values={plan}
                                            onReorder={setPlan}
                                            className="space-y-1 w-full relative z-10"
                                            layoutScroll
                                        >
                                            <AnimatePresence
                                                mode="popLayout"
                                                initial={false}
                                            >
                                                {plan.map((item, idx) => (
                                                    <React.Fragment
                                                        key={item.instanceId}
                                                    >
                                                        <div
                                                            onDragEnter={() =>
                                                                setDragState({
                                                                    isLibraryDrag: true,
                                                                    dragOverIndex:
                                                                        idx,
                                                                })
                                                            }
                                                            className={cn(
                                                                'h-4 transition-all mx-20 rounded-lg pointer-events-auto',
                                                                dragState.dragOverIndex ===
                                                                    idx
                                                                    ? 'bg-indigo-100 scale-y-110 border-2 border-dashed border-indigo-200'
                                                                    : 'bg-transparent',
                                                            )}
                                                        />

                                                        <Reorder.Item
                                                            value={item}
                                                            id={item.instanceId}
                                                            className="relative flex gap-10 group list-none"
                                                            initial={{
                                                                opacity: 0,
                                                                y: 15,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                scale: 0.9,
                                                            }}
                                                            whileDrag={{
                                                                scale: 1.02,
                                                                zIndex: 50,
                                                            }}
                                                        >
                                                            <div className="w-14 pt-4 flex flex-col items-end shrink-0 text-[11px] font-bold text-slate-400 tabular-nums">
                                                                {
                                                                    item.displayStart
                                                                }
                                                            </div>
                                                            <div className="absolute left-[73px] top-6 h-2.5 w-2.5 rounded-full border-2 border-indigo-600 bg-white z-20 shadow-md transition-transform group-hover:scale-125" />
                                                            <div className="flex-1">
                                                                <ItemCard
                                                                    id={
                                                                        item.instanceId
                                                                    }
                                                                    title={
                                                                        item.name
                                                                    }
                                                                    subtitle={`${item.durationSeconds / 60}m • ${item.displayEnd}`}
                                                                    imageSrc={
                                                                        item.imageUrl
                                                                    }
                                                                    mode="delete"
                                                                    actionIcon={
                                                                        <Trash2
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    }
                                                                    itemValue={
                                                                        item
                                                                    }
                                                                    onActionClick={() =>
                                                                        setPlan(
                                                                            (
                                                                                prev,
                                                                            ) =>
                                                                                prev.filter(
                                                                                    (
                                                                                        p,
                                                                                    ) =>
                                                                                        p.instanceId !==
                                                                                        item.instanceId,
                                                                                ),
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </Reorder.Item>
                                                    </React.Fragment>
                                                ))}
                                            </AnimatePresence>

                                            <div
                                                onDragEnter={() =>
                                                    setDragState({
                                                        isLibraryDrag: true,
                                                        dragOverIndex:
                                                            plan.length,
                                                    })
                                                }
                                                className={cn(
                                                    'h-24 mt-4 transition-all mx-20 rounded-xl border-2 border-dashed flex items-center justify-center',
                                                    dragState.dragOverIndex ===
                                                        plan.length
                                                        ? 'bg-indigo-50 border-indigo-300'
                                                        : 'border-transparent',
                                                )}
                                            >
                                                <div ref={scrollAnchorRef} />
                                                {dragState.dragOverIndex ===
                                                    plan.length && (
                                                    <Plus className="text-indigo-300" />
                                                )}
                                            </div>
                                        </Reorder.Group>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t flex justify-end bg-white/80 backdrop-blur-sm z-30 shrink-0">
                                <Button
                                    className="px-12 font-semibold rounded-xl h-12 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95"
                                    onClick={() => onConfirm(plan)}
                                    disabled={plan.length === 0 || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                            Saving...
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
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Reset Current Draft?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Changing the session {pendingChange?.type} will
                            clear your timeline.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Draft</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmReset}
                            className="bg-amber-500 hover:bg-amber-600"
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
