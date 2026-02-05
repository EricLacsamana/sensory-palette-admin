'use client';

import React from 'react';
import Link from 'next/link';
import { User, ChevronRight, Activity, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Student } from '@/types/index';

export function StudentCard({ student }: { student: Student }) {
    const studentId = student.id;

    return (
        <Link
            href={`/students/${studentId}`}
            className="group block outline-none"
        >
            <Card className="relative h-full rounded-[28px] border-none bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1.5 active:scale-[0.98] overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                </div>

                <div className="flex items-center justify-between mb-5">
                    <div className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300 shadow-inner">
                        <User size={20} />
                    </div>
                    <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors bg-white shadow-sm">
                        <ChevronRight size={14} strokeWidth={3} />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-lg font-[1000] text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                        {student.firstName} {student.lastName}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em]">
                            UID: {student.id.toString().padStart(4, '0')}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                            Level 1
                        </span>
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <Badge
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] uppercase px-2 py-0.5 rounded-lg"
                    >
                        {student.diagnosis || 'Standard'}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                            Verified
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
