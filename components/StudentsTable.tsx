'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, User } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types/index';

export default function StudentsTable({ students }: { students: Student[] }) {
    const router = useRouter();

    const handleRowClick = (student: Student) => {
        router.push(`/students/${student.id}`);
    };

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] px-6 py-4">
                            Learner
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] px-6">
                            Diagnostic
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] px-6">
                            Status
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] px-6 text-right">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                        <TableRow
                            key={student.id}
                            onClick={() => handleRowClick(student)}
                            className="group cursor-pointer border-slate-50 transition-colors hover:bg-slate-50/50"
                        >
                            <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <User size={16} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 tracking-tight leading-none">
                                            {student.firstName}{' '}
                                            {student.lastName}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-1.5 uppercase tracking-widest">
                                            UID:{' '}
                                            {student.id
                                                .toString()
                                                .padStart(4, '0')}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-6">
                                <Badge
                                    variant="secondary"
                                    className="bg-indigo-50/50 text-indigo-700 border border-indigo-100/30 font-semibold text-[9px] uppercase px-2 py-0.5 rounded-lg"
                                >
                                    {student.diagnosis || 'Standard Profile'}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">
                                        Active
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl h-8 w-8 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all"
                                >
                                    <ChevronRight size={16} strokeWidth={2} />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
