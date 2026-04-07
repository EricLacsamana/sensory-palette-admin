import React from 'react';
import { cn } from '@/lib/utils';
import { ClinicalSpecialty } from '@/types/clinical';

const SPECIALTY_COLORS: Record<ClinicalSpecialty | string, string> = {
    OT: 'bg-orange-100 text-orange-700 border-orange-200',
    BCBA: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    RBT: 'bg-sky-100 text-sky-700 border-sky-200',
    SLP: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PT: 'bg-rose-100 text-rose-700 border-rose-200',
    LCSW: 'bg-purple-100 text-purple-700 border-purple-200',
    Psychologist: 'bg-teal-100 text-teal-700 border-teal-200',
};

export const SpecialtyBadge = ({ specialty }: { specialty?: string }) => {
    if (!specialty) return null;

    return (
        <span
            className={cn(
                'px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border shadow-sm',
                SPECIALTY_COLORS[specialty] ||
                    'bg-slate-100 text-slate-600 border-slate-200',
            )}
        >
            {specialty}
        </span>
    );
};
