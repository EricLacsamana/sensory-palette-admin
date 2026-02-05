'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Zap, AlertCircle } from 'lucide-react';

interface CapacityGaugeProps {
    percent: number;
}

const CapacityGauge = ({ percent }: CapacityGaugeProps) => {
    // Dynamic color logic based on usage
    const isOverCapacity = percent > 100;
    const isWarning = percent > 85 && percent <= 100;

    const statusColor = isOverCapacity
        ? 'text-rose-600'
        : isWarning
          ? 'text-amber-600'
          : 'text-emerald-600';

    const indicatorColor = isOverCapacity
        ? 'bg-rose-500'
        : isWarning
          ? 'bg-amber-500'
          : 'bg-emerald-500';

    return (
        <div className=" space-y-3 rounded-2xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'p-1.5 rounded-lg bg-slate-50',
                            statusColor,
                        )}
                    >
                        {isOverCapacity ? (
                            <AlertCircle size={14} className="animate-pulse" />
                        ) : (
                            <Zap size={14} className="fill-current" />
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Session Load
                    </span>
                </div>
                <div className="text-right">
                    <b
                        className={cn(
                            'text-lg font-black tracking-tight',
                            statusColor,
                        )}
                    >
                        {Math.floor(percent)}%
                    </b>
                </div>
            </div>

            <div className="relative">
                {/* Standardized Shadcn Progress Component */}
                <Progress
                    value={Math.min(percent, 100)}
                    className="h-2 bg-slate-100"
                    indicatorClassName={cn(
                        'transition-all duration-500',
                        indicatorColor,
                    )}
                />

                {/* Over-capacity overflow indicator */}
                {isOverCapacity && (
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase text-rose-500 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={10} />
                        Time Limit Exceeded
                    </div>
                )}
            </div>
        </div>
    );
};

export default CapacityGauge;
