'use client';

import React from 'react';
import Link from 'next/link';
import { User, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Student } from '@/types/index';

export function StudentCard({ student }: { student: Student }) {
    const studentId = student.id;

    return (
        <Link
            href={`/students/${studentId}`}
            className="group block outline-none h-full"
        >
            <Card className="relative h-full rounded-[38px] border border-slate-200/50 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] hover:-translate-y-2 active:scale-[0.97] overflow-hidden">
                {/* --- TOP ROW: AVATAR & NAVIGATION --- */}
                <div className="flex items-start justify-between mb-8">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm group-hover:shadow-indigo-200 group-hover:shadow-xl">
                            <User size={24} strokeWidth={1.5} />
                        </div>
                        {/* Live Status Indicator */}
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5 shadow-sm">
                            <div className="h-full w-full rounded-full bg-emerald-500 border-2 border-white" />
                        </div>
                    </div>

                    <div className="h-10 w-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all duration-300 bg-white">
                        <ChevronRight
                            size={18}
                            strokeWidth={2.5}
                            className="group-hover:translate-x-0.5 transition-transform"
                        />
                    </div>
                </div>

                {/* --- CENTER ROW: IDENTITY --- */}
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors duration-300">
                        {student.firstName} {student.lastName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100/80 flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                                ID {student.id.toString().padStart(4, '0')}
                            </span>
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-indigo-50/50 border border-indigo-100/30 flex items-center gap-1.5">
                            <Zap
                                size={10}
                                className="text-indigo-500 fill-indigo-500"
                            />
                            <span className="text-[10px] font-semibold text-indigo-600 uppercase">
                                Level 1
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER: CLINICAL METADATA --- */}
                <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                            Diagnosis
                        </p>
                        <Badge
                            variant="secondary"
                            className="bg-slate-50 text-slate-700 border border-slate-100 font-semibold text-[10px] px-2.5 py-0.5 rounded-lg"
                        >
                            {student.diagnosis || 'Standard'}
                        </Badge>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                            Quality
                        </p>
                        <div className="flex items-center gap-1.5 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100/30">
                            <ShieldCheck
                                size={12}
                                className="text-emerald-500"
                            />
                            <span className="text-[10px] font-semibold text-emerald-700 uppercase">
                                Verified
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- DECORATIVE BACKGROUND ACCENT --- */}
                <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-indigo-50/30 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-500" />
            </Card>
        </Link>
    );
}
