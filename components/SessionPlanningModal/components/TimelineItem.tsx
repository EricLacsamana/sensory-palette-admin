'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import ItemCard from './ItemCard';

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
            id={item.instanceId}
            layout="position" // Essential for stopping the 'jerking'
            dragListener={false}
            dragControls={isLocked ? undefined : dragControls}
            // Smooth transition configuration
            transition={{
                type: 'spring',
                stiffness: 500,
                damping: 40,
                mass: 1,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                'relative flex gap-5 group',
                isLocked ? 'opacity-80' : 'opacity-100',
            )}
        >
            {/* Time Side Area */}
            <div className="w-14 pt-3.5 flex flex-col items-end shrink-0 select-none">
                <span
                    className={cn(
                        'text-[11px] mt-3.5 font-black tabular-nums tracking-tighter uppercase transition-colors',
                        isLocked ? 'text-indigo-600' : 'text-slate-900',
                    )}
                >
                    {item.displayStart}
                </span>
            </div>

            <div
                className={cn(
                    'absolute left-[62px] top-7 h-4 w-4 rounded-full border-2 bg-white z-20 transition-all duration-500 ease-in-out',
                    isLocked
                        ? 'border-indigo-600 bg-indigo-600 scale-110 shadow-[0_0_0_4px_rgba(79,70,229,0.2)]'
                        : 'border-slate-300 group-hover:border-indigo-400 group-hover:scale-125 group-hover:bg-indigo-50',
                )}
            />

            <div className="w-14 pt-3.5 flex flex-col items-end shrink-0 select-none">
                <span
                    className={cn(
                        'text-[11px] mt-3.5 font-black tabular-nums tracking-tighter uppercase transition-colors',
                        isLocked ? 'text-indigo-600' : 'text-slate-900',
                    )}
                >
                    {item.displayEnd}
                </span>
            </div>

            {/* Main Card */}
            <div className="flex-1 pointer-events-auto">
                <ItemCard
                    id={item.instanceId}
                    title={item.name}
                    subtitle={
                        isLocked
                            ? `Fixed Time • Ends ${item.displayEnd}`
                            : `${item.duration || 30}m • Ends ${item.displayEnd}`
                    }
                    imageSrc={item.imageUrl}
                    mode="delete"
                    isLocked={isLocked}
                    actionIcon={<Trash2 size={16} />}
                    itemValue={item}
                    dragControls={isLocked ? undefined : dragControls}
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
