'use client';

import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import ItemCard from './ItemCard';
import { useActivities } from '@/hooks/useActivities';
import { Activity } from '@/types/actitivity';
import { getStrapiMedia } from '@/utils/helpers';

interface ActivitiesSiderbarProps {
    isOpen: boolean;
    onDragStart: (e: React.DragEvent, item: Activity) => void;
    onDragEnd: () => void;
}

export const ActivitiesSiderbar = ({
    isOpen,
    onDragStart,
    onDragEnd,
}: ActivitiesSiderbarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: activities = [] } = useActivities();

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
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                Quick Breaks
                            </h3>
                            <div
                                draggable
                                onDragStart={(e) => {
                                    onDragStart(e, {
                                        id: 'break',
                                        documentId: 'break',
                                        name: '5m Rest Break',
                                        durationMinutes: 5,
                                        isBreak: true,
                                    } as unknown as Activity);
                                }}
                                onDragEnd={onDragEnd}
                                className="cursor-grab active:cursor-grabbing"
                            >
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
                                    onActionClick={() => {}}
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
                                    .filter((a: Activity) =>
                                        a.name
                                            ?.toLowerCase()
                                            .includes(searchTerm.toLowerCase()),
                                    )
                                    .map((act: Activity) => {
                                        return (
                                            <div
                                                key={act.documentId}
                                                draggable
                                                onDragStart={(e) =>
                                                    onDragStart(e, act)
                                                }
                                                onDragEnd={onDragEnd}
                                                className="cursor-grab active:cursor-grabbing"
                                            >
                                                <ItemCard
                                                    id={act.documentId}
                                                    title={act.name}
                                                    subtitle={`${act.durationMinutes}m`}
                                                    imageSrc={getStrapiMedia(
                                                        act.banner,
                                                        'thumbnail',
                                                    )}
                                                    mode="add"
                                                    actionIcon={
                                                        <Plus size={16} />
                                                    }
                                                    itemValue={act}
                                                    onActionClick={() => {}}
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
    );
};
