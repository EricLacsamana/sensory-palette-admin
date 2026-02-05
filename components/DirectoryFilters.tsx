'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const filters = [
    { label: 'All Learners', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'On Leave', value: 'leave' },
];

export function DirectoryFilters({ currentFilter, onFilterChange }: any) {
    return (
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            {filters.map((f) => (
                <Button
                    key={f.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange(f.value)}
                    className={cn(
                        'rounded-lg text-xs font-bold px-4 transition-all',
                        currentFilter === f.value
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700',
                    )}
                >
                    {f.label}
                </Button>
            ))}
        </div>
    );
}
