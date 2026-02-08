'use client';

import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    Search,
    AlertTriangle,
    Clock,
    PanelLeftClose,
    PanelLeftOpen,
    Coffee,
    Loader2,
    Plus,
    Trash2,
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
import ItemCard from '@/components/SessionPlanningModal/components/ItemCard';
import CapacityGauge from '@/components/SessionPlanningModal/components/CapacityGauge';

interface SessionPlanningModalProps {
    isOpen: boolean;
    onClose: () => void;
    activities: any[];
    onConfirm: (plan: any[]) => void;
    student: any;
    isSubmitting?: boolean;
}

const SessionPlanningModal = ({
    isOpen,
    onClose,
    activities,
    onConfirm,
    student,
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

    const {
        plan,
        setPlan,
        capacityMetrics,
        dragState,
        setDragState,
        resetDrag,
    } = useSessionPlan(startDate, startTimeStr, student);

    const resolveStrapiImage = (item: any) => {
        const data = item.attributes ?? item;
        const baseUrl =
            process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ||
            'http://localhost:1337';
        const imgObj =
            data.image?.data?.attributes ??
            data.image ??
            data.thumbnail?.data?.attributes ??
            data.thumbnail;
        const path = imgObj?.url;
        if (!path) return null;
        return path.startsWith('http') ? path : `${baseUrl}${path}`;
    };

    const confirmReset = () => {
        if (!pendingChange) return;
        pendingChange.type === 'date'
            ? setStartDate(pendingChange.value)
            : setStartTimeStr(pendingChange.value);
        setPlan([]);
        setPendingChange(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('newActivity');
        if (!dataStr) return resetDrag();
        const raw = JSON.parse(dataStr);
        setPlan([...plan, { ...raw, instanceId: crypto.randomUUID() }]);
        resetDrag();
    };

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && !isSubmitting && onClose()}
            >
                <DialogContent className="!max-w-[1400px] !w-[65vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col bg-white border-slate-200 shadow-2xl transition-all duration-300 sm:rounded-3xl">
                    <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0 bg-slate-50/50 z-30">
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
                                <DialogTitle className="text-lg font-semibold text-slate-900">
                                    {student?.firstName} {student?.lastName}
                                </DialogTitle>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            <div className="flex items-center gap-3">
                                <input
                                    type="date"
                                    className="border rounded-xl p-1.5 text-sm"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                                <select
                                    className="border rounded-xl p-1.5 text-sm"
                                    value={startTimeStr}
                                    onChange={(e) =>
                                        setStartTimeStr(e.target.value)
                                    }
                                >
                                    {Array.from({ length: 41 }, (_, i) => {
                                        const totalMin = 8 * 60 + i * 15;
                                        const val = `${Math.floor(totalMin / 60)
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
                    </DialogHeader>

                    <div className="flex-1 flex overflow-hidden min-h-0">
                        <aside
                            className={cn(
                                'border-r bg-slate-50/40 flex flex-col shrink-0 transition-all',
                                isSidebarOpen ? 'w-[380px]' : 'w-0 opacity-0',
                            )}
                        >
                            <div className="p-5 pb-2 min-w-[380px] shrink-0">
                                <Input
                                    placeholder="Search activities..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex-1 min-h-0 min-w-[380px]">
                                <ScrollArea className="h-full">
                                    <div className="p-5 space-y-6">
                                        <ItemCard
                                            id="break"
                                            title="Rest Break"
                                            subtitle="5m"
                                            mode="add"
                                            actionIcon={<Plus size={16} />}
                                            itemValue={{
                                                name: 'Rest Break',
                                                duration: 5,
                                                isBreak: true,
                                            }}
                                            onActionClick={() =>
                                                setPlan([
                                                    ...plan,
                                                    {
                                                        name: 'Rest Break',
                                                        duration: 5,
                                                        isBreak: true,
                                                        instanceId:
                                                            crypto.randomUUID(),
                                                    },
                                                ])
                                            }
                                        />
                                        <Separator />
                                        {activities
                                            .filter((a) =>
                                                a.name
                                                    .toLowerCase()
                                                    .includes(
                                                        searchTerm.toLowerCase(),
                                                    ),
                                            )
                                            .map((act) => (
                                                <ItemCard
                                                    key={act.id}
                                                    id={act.id}
                                                    title={act.name}
                                                    subtitle={`${act.duration}m`}
                                                    imageSrc={resolveStrapiImage(
                                                        act,
                                                    )}
                                                    mode="add"
                                                    actionIcon={
                                                        <Plus size={16} />
                                                    }
                                                    itemValue={act}
                                                    onActionClick={() =>
                                                        setPlan([
                                                            ...plan,
                                                            {
                                                                ...act,
                                                                instanceId:
                                                                    crypto.randomUUID(),
                                                            },
                                                        ])
                                                    }
                                                />
                                            ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </aside>

                        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden relative">
                            <div className="w-full p-5 border-b flex items-center justify-between shrink-0 z-20">
                                <CapacityGauge
                                    percent={capacityMetrics.percentUsed}
                                />
                                <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 uppercase">
                                    Ends: 6:00 PM
                                </div>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto bg-slate-50/20 relative min-h-0"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <div className="max-w-4xl mx-auto relative px-8 pb-40 pt-10 min-h-full">
                                    <div className="absolute left-[110px] top-0 bottom-0 w-px bg-slate-200 z-0" />
                                    <Reorder.Group
                                        axis="y"
                                        values={plan}
                                        onReorder={setPlan}
                                        className="space-y-8 relative z-10"
                                        layoutScroll
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {plan.map((item) => (
                                                <div
                                                    key={item.instanceId}
                                                    className="relative flex gap-10 group"
                                                >
                                                    <div className="w-14 pt-3 flex flex-col items-end shrink-0 select-none">
                                                        <span className="text-[12px] font-bold text-slate-900">
                                                            {item.displayStart}
                                                        </span>
                                                    </div>
                                                    <div className="absolute left-[73px] top-5 h-2.5 w-2.5 rounded-full border-2 border-indigo-600 bg-white z-20 shadow-sm" />
                                                    <div className="flex-1">
                                                        <ItemCard
                                                            id={item.instanceId}
                                                            title={item.name}
                                                            subtitle={`${item.durationSeconds / 60}m • Ends ${item.displayEnd}`}
                                                            imageSrc={resolveStrapiImage(
                                                                item,
                                                            )}
                                                            mode="delete"
                                                            actionIcon={
                                                                <Trash2
                                                                    size={16}
                                                                />
                                                            }
                                                            itemValue={item}
                                                            onActionClick={() =>
                                                                setPlan(
                                                                    plan.filter(
                                                                        (p) =>
                                                                            p.instanceId !==
                                                                            item.instanceId,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </AnimatePresence>
                                    </Reorder.Group>
                                </div>
                            </div>

                            <div className="p-6 border-t flex justify-end shrink-0 bg-white/80 backdrop-blur-sm z-30">
                                <Button
                                    className="px-12 font-semibold rounded-xl h-12 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => onConfirm(plan)}
                                    disabled={plan.length === 0 || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        'Confirm Session Plan'
                                    )}
                                </Button>
                            </div>
                        </main>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SessionPlanningModal;
