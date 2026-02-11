import React from 'react';
import { cn } from '@/lib/utils';

const CapacityGauge = ({
    percent,
    className,
}: {
    percent: number;
    className?: string;
}) => {
    // Color logic
    const getColor = () => {
        if (percent > 100) return 'bg-rose-500';
        if (percent > 90) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Session Capacity
                </span>
                <span
                    className={cn(
                        'text-xs font-mono font-bold',
                        percent > 100 ? 'text-rose-600' : 'text-slate-700',
                    )}
                >
                    {Math.round(percent)}%
                </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full transition-all duration-500 rounded-full',
                        getColor(),
                    )}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
        </div>
    );
};

export default CapacityGauge;
