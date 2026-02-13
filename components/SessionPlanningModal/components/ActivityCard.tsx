'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
    id: string;
    title: string;
    subtitle: string;
    imageSrc?: string;
    disabled?: boolean;
}

const ActivityCard = ({
    title,
    subtitle,
    imageSrc,
    disabled,
}: ActivityCardProps) => {
    return (
        <div
            className={cn(
                'group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 w-full select-none min-h-[64px]',
                disabled
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'shadow-sm hover:shadow-md z-10 bg-white hover:border-indigo-300 border-slate-200',
            )}
        >
            <div
                className={cn(
                    'h-10 w-10 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center bg-slate-100 relative z-10',
                    'border-slate-100',
                )}
            >
                {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageSrc}
                        className="h-full w-full object-cover"
                        alt=""
                    />
                ) : (
                    <div className="text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-current opacity-20" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <h4 className="text-sm font-bold truncate leading-none text-slate-800">
                    {title}
                </h4>

                <div className="flex items-center gap-2">
                    <div className="flex items-center text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {subtitle}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;
