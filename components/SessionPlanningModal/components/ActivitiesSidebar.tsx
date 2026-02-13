'use client';

import React, { useState } from 'react';
import {
    Search,
    Plus,
    Clock,
    Coffee,
    AlertCircle,
    GripVertical,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ItemCard from './ItemCard';
import { useActivities } from '@/hooks/useActivities';
import { Activity } from '@/types/actitivity';
import { FormatService } from '@/utils/helpers';
import ActivityCard from './ActivityCard';

interface ActivitiesSidebarProps {
    isOpen: boolean;
    remainingMinutes: number;
    onDragStart: (e: React.DragEvent, item: Activity) => void;
    onDragEnd: () => void;
}

export const ActivitiesSiderbar = ({
    isOpen,
    remainingMinutes,
    onDragStart,
    onDragEnd,
}: ActivitiesSidebarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: activities = [] } = useActivities();

    const renderActivityItem = (act: Activity, isBreak = false) => {
        const duration = isBreak ? 5 : act.durationMinutes || 30;
        const isDisabled = duration > remainingMinutes;

        return (
            <div
                key={act.documentId || act.id || Math.random()}
                draggable={!isDisabled}
                onDragStart={(e) => {
                    if (isDisabled) {
                        e.preventDefault();
                        return;
                    }
                    onDragStart(e, act);
                }}
                onDragEnd={onDragEnd}
                className={cn(
                    'transition-all duration-200 group relative',
                    isDisabled
                        ? 'opacity-50 grayscale cursor-not-allowed'
                        : 'cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:z-10',
                )}
            >
                {/* Disabled Overlay Tooltip */}
                {isDisabled && (
                    <div className="absolute inset-0 z-30 bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-bold shadow-xl flex items-center gap-1.5">
                            <AlertCircle size={10} />
                            Time Limit Exceeded ({duration}m)
                        </div>
                    </div>
                )}

                <ActivityCard
                    id={act.documentId}
                    title={act.name}
                    subtitle={
                        isBreak ? 'Quick Break' : `${duration} min duration`
                    }
                    imageSrc={
                        !isBreak
                            ? FormatService.formatStrapiMedia(
                                  act.banner,
                                  'thumbnail',
                              )
                            : undefined
                    }
                    // actionIcon={
                    //     isDisabled ? (
                    //         <Clock size={14} className="text-slate-300" />
                    //     ) : (
                    //         <Plus size={16} />
                    //     )
                    // }
                    disabled={false}
                    // onActionClick={() => {}}
                />
            </div>
        );
    };

    // Filter Logic
    const filteredActivities = activities.filter((a: Activity) =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <aside
            className={cn(
                'border-r border-slate-200 bg-slate-50/60 flex flex-col transition-all duration-300 shrink-0 h-full',
                isOpen
                    ? 'w-[340px] translate-x-0'
                    : 'w-0 -translate-x-full opacity-0 overflow-hidden',
            )}
        >
            {/* Header / Search */}
            <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">
                    Library
                </h3>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search activities..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-10 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                        {/* Quick Breaks Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <Coffee size={12} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Quick Insert
                                </h3>
                            </div>

                            {renderActivityItem(
                                {
                                    id: 'break-5',
                                    name: 'Short Break',
                                    durationMinutes: 5,
                                    banner: null,
                                } as unknown as Activity,
                                true,
                            )}
                        </div>

                        {/* Main Activities Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Activities ({filteredActivities.length})
                                </h3>
                            </div>

                            <div className="flex flex-col gap-2.5 pb-20">
                                {filteredActivities.length > 0 ? (
                                    filteredActivities.map((act: Activity) =>
                                        renderActivityItem(act),
                                    )
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search
                                                size={20}
                                                className="opacity-50"
                                            />
                                        </div>
                                        <p className="text-xs font-medium">
                                            No activities found
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Bottom Fade Gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
            </div>
        </aside>
    );
};
