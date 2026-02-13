'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Search,
    User,
    Badge,
    IdCard,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { Input } from '@base-ui/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getStudents } from '@/api/students';
import { FormatService } from '@/utils/helpers';
import { UserResponse } from '@/types';

export const UserSelector = ({}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState('');

    // Moved query here so it only fetches when this view is active
    const { data: studentsList = [] } = useQuery({
        queryKey: ['students', searchQuery],
        queryFn: getStudents,
    });

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return studentsList;
        return studentsList.filter(
            (s: UserResponse) =>
                s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.id?.toString().includes(searchQuery),
        );
    }, [studentsList, searchQuery]);

    const handleSelectStudent = (studentId: number) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set('studentId', studentId.toString());
        router.replace(`${pathname}?${p.toString()}`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Technical Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto w-full p-12">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center space-y-4 mb-10">
                    <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center mb-2">
                        <User
                            size={32}
                            className="text-indigo-600"
                            strokeWidth={1.5}
                        />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Select Learner
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Initiate a planning session by selecting a target
                            profile
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="w-full max-w-md relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <Input
                            className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-base"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <Badge className="h-6 bg-slate-100 text-slate-500 text-[10px] font-mono border-slate-200">
                                ESC to close
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20 pr-2">
                    {filteredStudents.map((s: UserResponse) => (
                        <button
                            key={s.id}
                            onClick={() => handleSelectStudent(s.id)}
                            className="group relative flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 text-left"
                        >
                            <Avatar className="h-12 w-12 rounded-lg border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                                <AvatarImage
                                    src={FormatService.formatStrapiMedia(
                                        s.profilePicture,
                                        'thumbnail',
                                    )}
                                />
                                <AvatarFallback className="bg-slate-50 text-slate-600 font-bold rounded-lg">
                                    {s.fullName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-700 transition-colors">
                                        {s.fullName}
                                    </h3>
                                    {/* Status Dot */}
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <IdCard
                                        size={12}
                                        className="text-slate-400"
                                    />
                                    <span className="text-xs font-mono text-slate-500">
                                        ID: {s.id.toString().padStart(4, '0')}
                                    </span>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                        Select Profile
                                    </span>
                                    <ArrowRight
                                        size={12}
                                        className="text-indigo-600"
                                    />
                                </div>
                            </div>
                        </button>
                    ))}

                    {filteredStudents.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                            <Sparkles size={32} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">
                                No learners found matching &quot;{searchQuery}
                                &quot;
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
