'use client';

import React from 'react';
import Link from 'next/link';
import {
    ChevronRight,
    ShieldCheck,
    ShieldAlert,
    Calendar,
    Mail,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

import { FormatService } from '@/utils/helpers';
import { UserAvatar } from './UserAvatar';
import { UserResponse } from '@/types';
import { cn } from '@/lib/utils';

export function StudentCard({ student }: { student: UserResponse }) {
    const studentId = student.id;

    // Dynamic status check based on Strapi's built-in blocked property
    const isActive = !student.blocked;

    return (
        <Link
            href={`/students/${studentId}`}
            className="group block outline-none h-full"
        >
            <Card
                className={cn(
                    'relative h-full rounded-[2rem] border bg-white pt-7 px-7 pb-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.98] overflow-hidden flex flex-col justify-between',
                    isActive
                        ? 'border-slate-200/60 hover:border-indigo-200'
                        : 'border-amber-200/50 hover:border-amber-300',
                )}
            >
                <div>
                    {/* --- TOP ROW: AVATAR & NAVIGATION --- */}
                    <div className="flex items-center justify-between mb-6">
                        <UserAvatar
                            src={FormatService.formatStrapiMedia(
                                student?.profilePicture,
                                'thumbnail',
                            )}
                            size="md"
                            showStatus={isActive}
                            name={student.firstName}
                            className={cn(
                                'transition-all duration-500 group-hover:rotate-6 group-hover:shadow-lg [&_[data-radix-avatar-fallback]]:group-hover:text-white',
                                isActive
                                    ? 'group-hover:bg-indigo-600 group-hover:shadow-indigo-200'
                                    : 'group-hover:bg-amber-500 group-hover:shadow-amber-200 grayscale-[0.2]',
                            )}
                        />

                        {/* Chevron Button */}
                        <div
                            className={cn(
                                'h-10 w-10 rounded-2xl border flex items-center justify-center transition-all duration-300 bg-white',
                                isActive
                                    ? 'border-slate-100 text-slate-300 group-hover:border-indigo-100 group-hover:text-indigo-600 group-hover:bg-indigo-50/50'
                                    : 'border-amber-100 text-amber-300 group-hover:border-amber-200 group-hover:text-amber-600 group-hover:bg-amber-50/50',
                            )}
                        >
                            <ChevronRight
                                size={18}
                                strokeWidth={2.5}
                                className="group-hover:translate-x-0.5 transition-transform"
                            />
                        </div>
                    </div>

                    {/* --- CENTER ROW: IDENTITY --- */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors duration-300 truncate">
                            {student.firstName} {student.lastName}
                        </h3>

                        {/* Badges Container */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* ID Badge */}
                            <div className="h-6 px-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                    ID {student.id.toString().padStart(4, '0')}
                                </span>
                            </div>

                            {/* Dynamic Status Badge */}
                            {isActive ? (
                                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 h-6 rounded-md border border-emerald-100">
                                    <ShieldCheck
                                        size={12}
                                        className="text-emerald-500"
                                    />
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none mt-0.5">
                                        Active
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 h-6 rounded-md border border-amber-200">
                                    <ShieldAlert
                                        size={12}
                                        className="text-amber-500"
                                    />
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none mt-0.5">
                                        Review
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- FOOTER: CONTEXTUAL DATA --- */}
                <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-2">
                    {/* Only render email if it exists and isn't a fake generated one */}
                    {student.email && !student.email.includes('fake') && (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Mail size={12} />
                            <span className="text-[10px] font-semibold truncate">
                                {student.email}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Enrolled{' '}
                            {student.createdAt
                                ? new Date(student.createdAt).getFullYear()
                                : 'Recently'}
                        </span>
                    </div>
                </div>

                {/* --- DECORATIVE BACKGROUND ACCENT --- */}
                <div
                    className={cn(
                        'absolute -bottom-8 -right-8 h-32 w-32 rounded-full blur-3xl transition-colors duration-700 opacity-0 group-hover:opacity-100',
                        isActive ? 'bg-indigo-400/10' : 'bg-amber-400/10',
                    )}
                />
            </Card>
        </Link>
    );
}
