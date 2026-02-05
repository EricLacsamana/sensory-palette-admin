'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Plus,
    Search,
    GraduationCap,
    LayoutGrid,
    List,
    Users,
    FilterX,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';

import { getStudents } from '@/api/students';
import StudentsTable from '@/components/StudentsTable';
import { StudentCard } from '@/components/StudentCard';
import EnrollStudentForm from '@/components/EnrollStudentForm';
import type { Student } from '@/types/index';

export default function StudentsDirectory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: students = [], isLoading } = useQuery<Student[]>({
        queryKey: ['students'],
        queryFn: getStudents,
    });

    const filteredStudents = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return students.filter(
            (s) =>
                `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
                s.id.toString().includes(term),
        );
    }, [students, searchTerm]);

    if (isLoading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[9px]">
                        Syncing Directory...
                    </p>
                </div>
            </div>
        );

    return (
        <div className="p-6 lg:p-8 bg-slate-50/50 min-h-screen space-y-6 max-w-[1600px] mx-auto">
            <Toaster position="top-right" richColors closeButton />

            {/* --- COMPACT HEADER --- */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 transition-transform hover:scale-105">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-[1000] text-slate-900 tracking-tight leading-none">
                            Learner Directory
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {filteredStudents.length} of {students.length}{' '}
                                Found
                            </span>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
                                Active Hub
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            className="pl-9 w-full md:w-64 bg-white border-slate-200 rounded-xl h-10 shadow-sm focus-visible:ring-indigo-600 font-bold text-xs transition-all"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shrink-0">
                                <Plus className="mr-2 h-4 w-4 stroke-[3px]" />{' '}
                                Enroll
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Enroll New Learner</DialogTitle>
                            </DialogHeader>
                            <EnrollStudentForm
                                onClose={() => setIsDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* --- CONTROLS BAR --- */}
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 px-3">
                    <Users size={14} className="text-slate-400" />
                    <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Roster Management
                    </h2>
                    {searchTerm && (
                        <Badge
                            variant="secondary"
                            className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black uppercase px-2 py-0.5"
                        >
                            Filtered
                        </Badge>
                    )}
                </div>
                <Tabs
                    value={viewMode}
                    onValueChange={(v: any) => setViewMode(v)}
                >
                    <TabsList className="bg-slate-100/80 rounded-lg p-0.5">
                        <TabsTrigger
                            value="grid"
                            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1.5 transition-all"
                        >
                            <LayoutGrid size={14} className="mr-2" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                Grid
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="table"
                            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1.5 transition-all"
                        >
                            <List size={14} className="mr-2" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                List
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="min-h-[60vh] relative">
                {filteredStudents.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {filteredStudents.map((student) => (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-1.5 animate-in fade-in duration-300">
                            <StudentsTable students={filteredStudents} />
                        </div>
                    )
                ) : (
                    /* --- EMPTY STATE --- */
                    <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-300">
                        <div className="h-20 w-20 bg-slate-100 rounded-[32px] flex items-center justify-center mb-6 border border-slate-200 shadow-inner">
                            <FilterX size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            No learners found
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-2 max-w-[240px] leading-relaxed uppercase tracking-tighter">
                            Adjust your search or add a new learner to the
                            directory.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm('')}
                            className="mt-6 h-9 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest"
                        >
                            Clear Search
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
