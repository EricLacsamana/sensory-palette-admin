'use client';

import React from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Coffee, Trash2, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimelineItemProps {
    item: any;
    startTime: string;
    endTime: string;
    onRemove: (instanceId: string) => void;
}

const TimelineItem = ({
    item,
    startTime,
    endTime,
    onRemove,
}: TimelineItemProps) => {
    const controls = useDragControls();

    // 1. Resolve Backend Data
    const name = item.isBreak
        ? item.name || 'Rest Break'
        : (item.attributes?.name ?? item.name ?? 'Untitled');

    const durationMins = item.attributes?.duration ?? item.duration ?? 15;

    // 2. Resolve Banner Image URL
    const baseUrl =
        process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ||
        'http://localhost:1337';
    const bannerPath =
        item.attributes?.banner?.data?.attributes?.url ?? item.banner?.url;
    const fullImageUrl = bannerPath ? `${baseUrl}${bannerPath}` : null;

    return (
        <Reorder.Item
            value={item}
            id={item.instanceId}
            dragListener={false}
            dragControls={controls}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative list-none"
        >
            <motion.div
                whileDrag={{
                    scale: 1.02,
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    zIndex: 50,
                }}
                className={cn(
                    'flex items-center gap-3 p-3 rounded-[24px] transition-all duration-200 group',
                    'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200',
                    item.isBreak &&
                        'bg-amber-50/20 border-amber-100 shadow-none hover:bg-amber-50/40',
                )}
            >
                {/* Drag Handle - High Sensitivity */}
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded-xl shrink-0 touch-none transition-colors"
                >
                    <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                </div>

                {/* Thumbnail / Icon Block */}
                <div className="h-12 w-12 rounded-[18px] overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative">
                    {item.isBreak ? (
                        <div className="h-full w-full flex items-center justify-center text-amber-600 bg-amber-50">
                            <Coffee size={20} />
                        </div>
                    ) : fullImageUrl ? (
                        <img
                            src={fullImageUrl}
                            className="h-full w-full object-cover"
                            alt={name}
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-black text-xs uppercase">
                            {name.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Content Logic */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-[1000] text-slate-900 truncate tracking-tight">
                            {name}
                        </p>
                        {!item.isBreak && (
                            <Sparkles
                                size={10}
                                className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            <Clock size={10} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                {durationMins}m
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            Ends {endTime}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center pr-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(item.instanceId)}
                        className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </motion.div>
        </Reorder.Item>
    );
};

export default TimelineItem;
