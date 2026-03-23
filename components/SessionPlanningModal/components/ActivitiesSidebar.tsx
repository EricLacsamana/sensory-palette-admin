'use client';

import React, { useState } from 'react';
import { Search, Coffee, ActivityIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useActivities } from '@/hooks/useActivities';
import { ActivityResponse } from '@/types/actitivity';
import { FormatService } from '@/utils/helpers';
import ActivityCard from './ActivityCard';

interface ActivitiesSidebarProps {
    remainingMinutes: number;
    onDragStart: (e: React.DragEvent, item: ActivityResponse) => void;
    onDragEnd: () => void;
    onActivityTap: (activity: ActivityResponse) => void;
    className?: string;
}

export const ActivitiesSiderbar = ({
    remainingMinutes,
    onDragStart,
    onDragEnd,
    onActivityTap,
    className,
}: ActivitiesSidebarProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: activities = [] } = useActivities();

    const renderActivityItem = (
        act: ActivityResponse,
        index: number | string,
        isBreak = false,
    ) => {
        const duration = isBreak ? 5 : act.durationMinutes || 30;

        // STRICT STATUS CHECK: Is the activity explicitly disabled or coming soon?
        const isStatusDisabled =
            act.activityStatus === 'disabled' ||
            act.activityStatus === 'coming_soon';

        // Final disabled flag: It's disabled if it's too long OR has a restricted status
        const isDisabled = duration > remainingMinutes || isStatusDisabled;

        return (
            <div
                // Stable fallback key to prevent React from unmounting elements (fixes the Math.random bug)
                key={act.documentId || act.id || `activity-fallback-${index}`}
                draggable={!isDisabled}
                onDragStart={(e) => {
                    // Block dragging if disabled
                    if (isDisabled) {
                        e.preventDefault();
                        return;
                    }
                    onDragStart(e, act);
                }}
                onDragEnd={onDragEnd}
                className={cn(
                    'w-full block transition-transform duration-200 touch-pan-y',
                    isDisabled
                        ? 'cursor-not-allowed opacity-60 grayscale'
                        : 'hover:-translate-y-0.5',
                )}
            >
                <ActivityCard
                    id={act.documentId}
                    title={act.name}
                    subtitle={isBreak ? 'Quick Break' : `${duration} min`}
                    imageSrc={
                        !isBreak
                            ? FormatService.formatStrapiMedia(
                                  act.banner,
                                  'thumbnail',
                              )
                            : undefined
                    }
                    disabled={isDisabled}
                    showAddIcon={!isDisabled}
                    activityStatus={act.activityStatus} // Passes status to show the Lock/Soon icons
                    onAddClick={() => {
                        // Double lock to prevent clicks if disabled
                        if (!isDisabled) {
                            onActivityTap(act);
                        }
                    }}
                />
            </div>
        );
    };

    const filteredActivities = activities.filter((a: ActivityResponse) =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <aside
            className={cn(
                'flex flex-col bg-slate-50 border-r border-slate-200 h-full shrink-0 z-40 transition-all duration-300',
                // Collapsed on medium (tablet) and below, expands on large (lg)
                'w-[84px] lg:w-[320px]',
                className,
            )}
        >
            <div className="h-14 p-2 lg:p-4 border-b border-slate-200 bg-white shrink-0 flex items-center justify-center lg:justify-start">
                <h3 className="hidden lg:block text-sm font-black text-slate-800 tracking-tight">
                    Activities
                </h3>
                <h3 className="lg:hidden text-[10px] font-black text-slate-800 tracking-widest uppercase">
                    <ActivityIcon size={14} className="inline mb-0.5 mr-1" />
                </h3>
            </div>

            {/* Search Bar: Hidden on collapsed views */}
            <div className="hidden lg:block px-4 py-3 bg-white shrink-0 border-b border-slate-100">
                <div className="relative group flex min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search activities..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white h-10 text-sm focus:ring-2 focus:ring-indigo-100 touch-auto select-text rounded-xl w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 relative w-full">
                <ScrollArea className="h-full w-full">
                    {/* Standardized padding, increasing only on lg */}
                    <div className="p-3 pr-3 lg:p-4 lg:pr-5 space-y-4 lg:space-y-6 w-full">
                        <div className="w-full">
                            <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2 px-1 mb-2 lg:mb-3">
                                <Coffee
                                    size={14}
                                    className="text-slate-400 hidden lg:block"
                                />
                                <h3 className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center lg:text-left w-full truncate">
                                    Quick{' '}
                                    <span className="hidden lg:inline">
                                        Insert
                                    </span>
                                </h3>
                            </div>
                            <div className="w-full flex flex-col items-stretch">
                                {renderActivityItem(
                                    {
                                        id: 'break-5',
                                        name: 'Short Break',
                                        durationMinutes: 5,
                                        banner: null,
                                        activityStatus: 'active',
                                    } as unknown as ActivityResponse,
                                    'static-break',
                                    true,
                                )}
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between px-1 mb-2 lg:mb-3">
                                <h3 className="hidden lg:block text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate pr-2">
                                    Activities ({filteredActivities.length})
                                </h3>
                                {/* Divider for the iconic view */}
                                <div className="h-px w-8 bg-slate-200 lg:hidden my-1 mx-auto" />
                            </div>
                            <div className="flex flex-col items-stretch gap-2.5 pb-20 w-full">
                                {filteredActivities.length > 0 ? (
                                    filteredActivities.map(
                                        (
                                            act: ActivityResponse,
                                            index: number,
                                        ) => renderActivityItem(act, index),
                                    )
                                ) : (
                                    <div className="text-center py-6 lg:py-8 text-slate-400 w-full bg-white rounded-xl border border-slate-100 border-dashed">
                                        <Search
                                            size={20}
                                            className="opacity-30 mx-auto mb-2 hidden lg:block"
                                        />
                                        <p className="text-[9px] lg:text-xs font-bold text-slate-400 text-center px-1">
                                            <span className="lg:hidden">
                                                Empty
                                            </span>
                                            <span className="hidden lg:inline">
                                                No activities found
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
            </div>
        </aside>
    );
};
