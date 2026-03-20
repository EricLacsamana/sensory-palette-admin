'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
    id: string;
    title: string;
    subtitle: string;
    imageSrc?: string;
    disabled?: boolean;
    showAddIcon?: boolean;
    onAddClick?: (e: React.MouseEvent) => void;
}

const ActivityCard = ({
    title,
    subtitle,
    imageSrc,
    disabled,
    showAddIcon,
    onAddClick,
}: ActivityCardProps) => {
    return (
        <div
            onClick={(e) => {
                if (!disabled && onAddClick) {
                    onAddClick(e);
                }
            }}
            className={cn(
                'group relative flex w-full select-none overflow-hidden transition-all duration-200 border rounded-xl',
                // Collapsed on Mobile and Medium (tablet) screens
                'items-center justify-center p-2 h-[60px]',
                // Full width on Large screens and above
                'lg:justify-between lg:p-2.5 lg:h-[68px]',
                disabled
                    ? 'border-slate-100 bg-slate-50/50 opacity-60'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 z-10 cursor-pointer lg:cursor-grab active:cursor-grabbing',
            )}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1 justify-center lg:justify-start">
                {/* NEW WRAPPER: Handles positioning without clipping */}
                <div className="relative shrink-0 mx-auto lg:mx-0">
                    {/* INNER CONTAINER: Handles the image and overflow-hidden */}
                    <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center bg-slate-100 shadow-sm">
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                className="h-full w-full object-cover"
                                alt={title}
                            />
                        ) : (
                            <div className="text-slate-400 font-bold text-xs uppercase">
                                {title.substring(0, 2)}
                            </div>
                        )}
                    </div>

                    {/* Plus Overlay Indicator for Collapsed View (Moved outside overflow-hidden) */}
                    {showAddIcon && !disabled && (
                        <div className="absolute -bottom-1.5 -right-1.5 z-20 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm lg:hidden border-2 border-white pointer-events-none">
                            <Plus size={12} strokeWidth={4} />
                        </div>
                    )}
                </div>

                {/* Text container (Hidden until Large screens) */}
                <div className="hidden lg:flex flex-col min-w-0 flex-1 items-start text-left">
                    <h4 className="text-[13px] font-bold truncate leading-tight text-slate-800 w-full">
                        {title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 min-w-0 w-full">
                        <div className="text-[10px] text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded font-medium truncate max-w-full">
                            {subtitle}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dedicated Add Button for Large Screens */}
            {showAddIcon && !disabled && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onAddClick?.(e);
                    }}
                    className="shrink-0 ml-2 h-8 w-8 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 hidden lg:flex items-center justify-center border border-slate-100 shadow-sm transition-colors active:scale-95"
                    aria-label="Add Activity"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

export default ActivityCard;
