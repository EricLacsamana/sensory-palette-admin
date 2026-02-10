'use client';

import React, { useState } from 'react';
import { Search, Plus, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import ItemCard from './ItemCard';
import { useActivities } from '@/hooks/useActivities';
import { Activity } from '@/types/actitivity';
import { FormatService } from '@/utils/helpers';

interface ActivitiesSiderbarProps {
    isOpen: boolean;
    remainingMinutes: number; // New Prop
    onDragStart: (e: React.DragEvent, item: Activity) => void;
    onDragEnd: () => void;
}

export const ActivitiesSiderbar = ({
    isOpen,
    remainingMinutes,
    onDragStart,
    onDragEnd,
}: ActivitiesSiderbarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: activities = [] } = useActivities();

    const renderActivityItem = (act: Activity, isBreak = false) => {
        const duration = isBreak ? 5 : act.durationMinutes;
        const isDisabled = duration > remainingMinutes;

        return (
            <div
                key={act.documentId || act.activityId}
                draggable={!isDisabled}
                onDragStart={(e) => !isDisabled && onDragStart(e, act)}
                onDragEnd={onDragEnd}
                className={cn(
                    'transition-all',
                    isDisabled
                        ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none select-none'
                        : 'cursor-grab active:cursor-grabbing hover:scale-[1.01]',
                )}
            >
                <div className="relative">
                    <ItemCard
                        id={act.documentId || String(act.activityId)}
                        title={act.name}
                        subtitle={
                            isBreak
                                ? '5m'
                                : `Activity Duration: ${act.durationMinutes} mins`
                        }
                        imageSrc={
                            !isBreak
                                ? FormatService.formatStrapiMedia(
                                      act.banner,
                                      'thumbnail',
                                  )
                                : undefined
                        }
                        mode="add"
                        actionIcon={
                            isDisabled ? (
                                <Clock size={14} className="text-slate-400" />
                            ) : (
                                <Plus size={16} />
                            )
                        }
                        itemValue={act}
                        onActionClick={() => {}}
                    />
                </div>
            </div>
        );
    };

    return (
        <aside
            className={cn(
                'border-r bg-slate-50/40 flex flex-col transition-all duration-300 shrink-0',
                isOpen ? 'w-[380px]' : 'w-0 opacity-0',
            )}
        >
            <div className="p-5 pb-2 min-w-[380px] shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search activities..."
                        className="pl-9 bg-white border-slate-200 rounded-xl h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 min-h-0 min-w-[380px]">
                <ScrollArea className="h-full">
                    <div className="p-5 space-y-6 pb-20">
                        {/* Quick Breaks */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                Quick Breaks
                            </h3>
                            {renderActivityItem(
                                {
                                    id: 'break',
                                    documentId: 'break',
                                    name: '5m Rest Break',
                                    durationMinutes: 5,
                                    isBreak: true,
                                } as unknown as Activity,
                                true,
                            )}
                        </div>

                        <Separator />

                        {/* Learner Activities */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                Learner Activities
                            </h3>
                            <div className="flex flex-col gap-3">
                                {activities
                                    .filter((a: Activity) =>
                                        a.name
                                            ?.toLowerCase()
                                            .includes(searchTerm.toLowerCase()),
                                    )
                                    .map((act: Activity) =>
                                        renderActivityItem(act),
                                    )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </aside>
    );
};
