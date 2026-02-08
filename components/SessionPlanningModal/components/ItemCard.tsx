'use client';

import React from 'react';
import { GripVertical, Lock, Unlock } from 'lucide-react';
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
    onToggleLock?: () => void;
    mode: 'add' | 'delete';
    itemValue: any;
    dragControls?: any;
}

const ItemCard = ({
    title,
    subtitle,
    imageSrc,
    isLocked,
    actionIcon,
    onActionClick,
    onToggleLock,
    mode,
    dragControls,
}: ItemCardProps) => {
    const isDeleteMode = mode === 'delete';

    return (
        <div
            className={cn(
                'flex items-center gap-4 p-3 rounded-[22px] transition-all duration-300 group w-full select-none relative',
                'bg-white border shadow-sm',
                isLocked
                    ? 'bg-slate-50/50 border-slate-200 border-dashed opacity-80'
                    : 'border-slate-100 hover:shadow-md hover:border-slate-200/60',
                !isDeleteMode && 'cursor-grab active:cursor-grabbing',
            )}
        >
            {isDeleteMode && !isLocked && (
                <div
                    onPointerDown={(e) => dragControls && dragControls.start(e)}
                    className="pl-1 shrink-0 text-slate-300 transition-colors cursor-grab active:cursor-grabbing hover:text-slate-600"
                >
                    <GripVertical size={20} strokeWidth={2} />
                </div>
            )}

            <div
                className={cn(
                    'h-10 w-10 rounded-[14px] overflow-hidden border shrink-0 flex items-center justify-center transition-all',
                    isLocked
                        ? 'bg-slate-200 border-slate-200 grayscale'
                        : 'bg-slate-100 border-slate-100',
                )}
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        className="h-full w-full object-cover pointer-events-none"
                        alt={title}
                    />
                ) : (
                    <div className="text-indigo-600 font-bold text-[10px] uppercase">
                        {title?.charAt(0)}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        'text-[14px] font-semibold truncate tracking-tight',
                        isLocked ? 'text-slate-500' : 'text-slate-900',
                    )}
                >
                    {title}
                </p>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    {subtitle}
                </p>
            </div>

            <div className="flex items-center gap-1 pr-1">
                {isDeleteMode && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock?.();
                        }}
                        className={cn(
                            'h-8 w-8 rounded-xl transition-all',
                            isLocked
                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 opacity-100'
                                : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100',
                        )}
                    >
                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </Button>
                )}

                {!isLocked && (
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
                )}
            </div>
        </div>
    );
};

export default ItemCard;
