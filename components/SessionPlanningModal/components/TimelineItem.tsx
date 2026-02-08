'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import ItemCard from '@/components/SessionPlanningModal/components/ItemCard';

interface TimelineItemProps {
    item: any;
    setPlan: React.Dispatch<React.SetStateAction<any[]>>;
    onToggleLock: (id: string) => void;
}

export const TimelineItem = ({
    item,
    setPlan,
    onToggleLock,
}: TimelineItemProps) => {
    const dragControls = useDragControls();
    const isLocked = item.isLocked;

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={dragControls}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            className={cn(
                'relative flex gap-10 group',
                isLocked && 'pointer-events-none',
            )}
        >
            <div className="w-14 pt-3.5 flex flex-col items-end shrink-0 select-none">
                <span
                    className={cn(
                        'text-[11px] mt-3 font-black tabular-nums tracking-tighter uppercase transition-colors',
                        isLocked ? 'text-slate-400' : 'text-slate-900',
                    )}
                >
                    {item.displayStart}
                </span>
            </div>
            <div
                className={cn(
                    'absolute left-[73px] top-7 h-2.5 w-2.5 rounded-full border-2 bg-white z-20 transition-all duration-300',
                    isLocked
                        ? 'border-slate-300 scale-75 shadow-none'
                        : 'border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)] group-hover:scale-125',
                )}
            />
            <div className="flex-1 pointer-events-auto">
                <ItemCard
                    id={item.instanceId}
                    title={item.name}
                    subtitle={
                        isLocked
                            ? `Locked • ${item.displayEnd}`
                            : `${(item.durationSeconds || 1800) / 60}m • Ends ${item.displayEnd}`
                    }
                    imageSrc={item.imageUrl}
                    mode="delete"
                    isLocked={isLocked}
                    actionIcon={<Trash2 size={16} />}
                    itemValue={item}
                    dragControls={dragControls}
                    onActionClick={() =>
                        setPlan((prev: any[]) =>
                            prev.filter(
                                (p) => p.instanceId !== item.instanceId,
                            ),
                        )
                    }
                    onToggleLock={() => onToggleLock(item.instanceId)}
                />
            </div>
        </Reorder.Item>
    );
};
