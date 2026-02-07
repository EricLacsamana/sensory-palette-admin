'use client';

import React from 'react';
import { useDragControls } from 'framer-motion';
import { GripVertical, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ItemCardProps {
    id: string;
    title: string;
    subtitle: string;
    imageSrc?: string | null;
    isLocked?: boolean;
    actionIcon: React.ReactNode;
    onActionClick: () => void;
    mode: 'add' | 'delete';
    itemValue: any;
    dragControls?: any; // Pass controls from parent
}

const ItemCard = ({
    id,
    title,
    subtitle,
    imageSrc,
    isLocked,
    actionIcon,
    onActionClick,
    mode,
    itemValue,
    dragControls,
}: ItemCardProps) => {
    const isDeleteMode = mode === 'delete';

    return (
        <div
            className={cn(
                'flex items-center gap-4 p-3 rounded-[22px] transition-all duration-300 group w-full select-none',
                'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200/60',
                isLocked && 'opacity-60 grayscale-[0.5] pointer-events-none',
            )}
        >
            {/* GRIP HANDLE: Now uses dragControls passed from the Modal's Reorder.Item */}
            <div
                onPointerDown={(e) => dragControls?.start(e)}
                className={cn(
                    'pl-1 shrink-0 text-slate-300 transition-colors',
                    !isLocked &&
                        'cursor-grab active:cursor-grabbing hover:text-slate-500',
                    !isDeleteMode && 'hidden', // Only show grip in the timeline
                )}
            >
                {!isLocked ? (
                    <GripVertical size={18} strokeWidth={1.5} />
                ) : (
                    <Lock size={16} />
                )}
            </div>

            <div className="h-10 w-10 rounded-[14px] overflow-hidden bg-slate-100 border border-slate-100 shrink-0 relative flex items-center justify-center">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        className="h-full w-full object-cover"
                        alt={title || 'Activity'}
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-indigo-50/50 text-indigo-600 font-bold text-[10px] uppercase">
                        {title?.charAt(0) || '?'}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-slate-900 truncate tracking-tight">
                    {title || 'Untitled Activity'}
                </p>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                    {subtitle}
                </p>
            </div>

            {!isLocked && (
                <div className="pr-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onActionClick();
                        }}
                        className={cn(
                            'h-8 w-8 rounded-xl transition-all',
                            isDeleteMode
                                ? 'text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100'
                                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
                        )}
                    >
                        {actionIcon}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ItemCard;
