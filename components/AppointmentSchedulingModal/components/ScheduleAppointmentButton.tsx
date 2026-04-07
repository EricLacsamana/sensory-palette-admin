'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CalendarPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScheduleAppointmentButtonProps {
    className?: string;
}

export const ScheduleAppointmentButton = ({
    className,
}: ScheduleAppointmentButtonProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleInitialize = () => {
        const params = new URLSearchParams(searchParams.toString());
        // Triggers the AppointmentSchedulingModal we built earlier
        params.set('isAppointmentModalOpen', 'true');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <Button
            onClick={handleInitialize}
            className={cn(
                // Layout
                'relative group flex items-center gap-3 pl-3 pr-5 h-11',
                // Shape & Border
                'rounded-xl border border-indigo-500/50',
                // Color & Background
                'bg-indigo-600 hover:bg-indigo-700 text-white',
                // Shadow / Glow
                'shadow-[0_4px_12px_-3px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_-4px_rgba(79,70,229,0.4)]',
                // Typography
                'font-semibold text-[11px] uppercase tracking-wider',
                // Transition
                'transition-all duration-300 active:scale-[0.98]',
                className,
            )}
        >
            {/* Top Shine Highlight (Glass effect) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Icon Container */}
            <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-white/20 shadow-inner group-hover:bg-white/25 transition-colors">
                <CalendarPlus
                    size={14}
                    strokeWidth={2.5}
                    className="text-white group-hover:scale-110 transition-transform duration-300"
                />
            </div>

            {/* Label */}
            <span>Book Appointment</span>

            {/* Decorator Icon */}
            <Sparkles
                size={12}
                className="absolute right-2 top-2 text-indigo-300 opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"
            />
        </Button>
    );
};
