'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ItemCard from '@/components/SessionPlanningModal/components/ItemCard';
import { cn } from '@/lib/utils';

interface PlanningSidebarProps {
    isOpen: boolean;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    activities: any[];
    onAddActivity: (activity: any) => void;
    onDragStart: (e: React.DragEvent, item: any) => void;
    baseUrl: string;
}

export const PlanningSidebar = ({
    isOpen,
    searchTerm,
    onSearchChange,
    activities,
    onAddActivity,
    onDragStart,
    baseUrl,
}: PlanningSidebarProps) => {
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
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 min-h-0 min-w-[380px]">
                <ScrollArea className="h-full">
                    <div className="p-5 space-y-6 pb-20">
                        {/* Quick Breaks Section */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                Quick Breaks
                            </h3>
                            <div
                                draggable
                                onDragStart={(e) =>
                                    onDragStart(e, {
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
                                    actionIcon={<Plus size={16} />}
                                    onActionClick={() =>
                                        onAddActivity({
                                            isBreak: true,
                                            duration: 5,
                                            name: '5m Rest Break',
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <Separator />
                        {/* Activities Section */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">
                                Learner Activities
                            </h3>
                            <div className="flex flex-col gap-3">
                                {activities
                                    .filter((a) =>
                                        a.name
                                            ?.toLowerCase()
                                            .includes(searchTerm.toLowerCase()),
                                    )
                                    .map((act) => {
                                        const bannerData =
                                            act.attributes?.banner?.data
                                                ?.attributes ||
                                            act.banner?.data?.attributes ||
                                            act.banner;
                                        const bannerPath =
                                            bannerData?.formats?.thumbnail
                                                ?.url || bannerData?.url;
                                        const sidebarImg = bannerPath
                                            ? bannerPath.startsWith('http')
                                                ? bannerPath
                                                : `${baseUrl}${bannerPath}`
                                            : null;

                                        return (
                                            <div
                                                key={act.id}
                                                draggable
                                                onDragStart={(e) =>
                                                    onDragStart(e, act)
                                                }
                                                className="cursor-grab active:cursor-grabbing"
                                            >
                                                <ItemCard
                                                    id={act.id}
                                                    title={act.name}
                                                    subtitle={`${act.duration || 30}m`}
                                                    imageSrc={sidebarImg}
                                                    mode="add"
                                                    actionIcon={
                                                        <Plus size={16} />
                                                    }
                                                    onActionClick={() =>
                                                        onAddActivity({
                                                            ...act,
                                                            imageUrl:
                                                                sidebarImg,
                                                        })
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
    );
};
