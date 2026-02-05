'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Plus, Lock, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
    activity?: any;
    onAdd: () => void;
    isLocked: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: () => void;
    isBreak?: boolean;
}

const ActivityCard = ({
    activity,
    onAdd,
    isLocked,
    onDragStart,
    onDragEnd,
    isBreak,
}: ActivityCardProps) => {
    const name = isBreak
        ? 'Rest Break'
        : (activity?.attributes?.name ?? activity?.name ?? 'Untitled Activity');

    const duration = activity?.attributes?.duration ?? activity?.duration ?? 0;

    const baseUrl =
        process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ||
        'http://localhost:1337';
    const bannerPath =
        activity?.attributes?.banner?.data?.attributes?.url ??
        activity?.banner?.url;
    const fullImageUrl = bannerPath ? `${baseUrl}${bannerPath}` : null;

    return (
        <motion.div layout className="relative isolate">
            <div
                draggable={!isLocked}
                onDragStart={(e) => {
                    e.currentTarget.classList.add('opacity-40');
                    onDragStart?.(e);
                }}
                onDragEnd={(e) => {
                    e.currentTarget.classList.remove('opacity-40');
                    onDragEnd?.();
                }}
                className={cn(
                    'group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
                    'bg-white ring-1 ring-slate-200 shadow-sm',
                    !isLocked &&
                        'hover:scale-[1.01] hover:ring-2 hover:ring-indigo-500 hover:shadow-md cursor-grab active:cursor-grabbing',
                    isLocked && 'opacity-60 grayscale cursor-not-allowed',
                    isBreak &&
                        'bg-amber-50/50 ring-amber-100 hover:ring-amber-400',
                )}
            >
                {/* Drag Handle Indicator */}
                {!isLocked && (
                    <GripVertical
                        size={14}
                        className="absolute left-1 opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity"
                    />
                )}

                {/* Left: Thumbnail/Icon */}
                <div className="flex-shrink-0 ml-1">
                    {isBreak ? (
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
                            <Coffee size={18} />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                            {fullImageUrl ? (
                                <img
                                    src={fullImageUrl}
                                    className="h-full w-full object-cover"
                                    alt={name}
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-500 font-bold uppercase">
                                    {name.charAt(0)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Middle: Name & Duration */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                        {name}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {duration}m • {isBreak ? 'Interval' : 'Goal'}
                    </p>
                </div>

                {/* Right: Actions */}
                {!isLocked ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                        className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                        <Plus size={14} />
                    </Button>
                ) : (
                    <div className="h-8 w-8 flex items-center justify-center">
                        <Lock size={12} className="text-slate-300" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ActivityCard;
