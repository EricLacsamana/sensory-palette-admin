'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronRight,
    MoreHorizontal,
    User,
    Mail,
    Calendar,
} from 'lucide-react';
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
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">
                            Learner
                        </TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">
                            Diagnostic
                        </TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">
                            Status
                        </TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 text-right">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                        <TableRow
                            key={student.id}
                            onClick={() => handleRowClick(student)}
                            className="group cursor-pointer border-slate-50 transition-colors hover:bg-slate-50/80"
                        >
                            <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 tracking-tight leading-none">
                                            {student.firstName}{' '}
                                            {student.lastName}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                            ID #
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
                                    className="bg-slate-100 text-slate-600 border-none font-black text-[9px] uppercase px-2 py-0.5"
                                >
                                    {student.diagnosis || 'Standard Profile'}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-6">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase">
                                        Active
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-lg h-8 w-8 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all"
                                    >
                                        <ChevronRight
                                            size={16}
                                            strokeWidth={3}
                                        />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
