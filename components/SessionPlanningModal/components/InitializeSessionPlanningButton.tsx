'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InitializeSessionButtonProps {
    className?: string;
}

export const InitializeSessionButton = ({
    className,
}: InitializeSessionButtonProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleInitialize = () => {
        // 1. Create a new URLSearchParams object from the current params
        const params = new URLSearchParams(searchParams.toString());

        // 2. Set the modal trigger flag
        // Note: Matches the key used in SessionPlanningModal
        params.set('isActivitySessionPlanningOpen', 'true');

        // 3. Push the new URL (pushes to history so back button closes modal)
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Button
            onClick={handleInitialize}
            className={cn(
                'flex-1 md:flex-none h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-semibold text-xs transition-all active:scale-95',
                className,
            )}
        >
            <Plus size={16} strokeWidth={2} className="mr-2" />
            Initialize Session
        </Button>
    );
};
