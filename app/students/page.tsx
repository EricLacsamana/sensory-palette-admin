'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    Users,
    FilterX,
    Loader2,
    Database,
    School,
    UserCheck,
    MoreHorizontal,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { getStudents } from '@/api/students';
import StudentsTable from '@/components/StudentsTable';
import { StudentCard } from '@/components/StudentCard';
import EnrollStudenModalForm from '@/components/EnrollStudentModalForm';
import { cn } from '@/lib/utils';
import type { User } from '@/types/index';

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// --- SUB-COMPONENT: Stat Badge ---
const StatBadge = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className={cn('p-1 rounded-md', colorClass)}>
            <Icon size={12} />
        </div>
        <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                {label}
            </span>
            <span className="text-xs font-bold text-slate-900 leading-none tabular-nums">
                {value}
            </span>
        </div>
    </div>
);

export default function StudentsDirectory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const {
        data: students = [],
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['students', { searchQuery: debouncedSearch }],
        queryFn: getStudents,
        placeholderData: keepPreviousData,
    });

    const isInitialLoading = isLoading && students.length === 0;

    if (isInitialLoading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="font-mono text-slate-400 text-xs uppercase tracking-widest">
                        Initializing Registry...
                    </p>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Background Grid Pattern - Matching Dashboard */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage:
                        'linear-gradient(to bottom, black 40%, transparent 100%)',
                }}
            />

            {/* MAIN WRAPPER: Changed to flex-col with gap-10 for vertical rhythm */}
            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-10">
                <Toaster position="top-right" richColors closeButton />

                {/* --- SECTION 1: TECHNICAL HEADER --- */}
                <header className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                                <Database size={12} /> Learner Database
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Master Roster
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex gap-3 mr-4">
                                <StatBadge
                                    icon={Users}
                                    label="Total"
                                    value={students.length}
                                    colorClass="bg-indigo-50 text-indigo-600"
                                />
                                <StatBadge
                                    icon={UserCheck}
                                    label="Active"
                                    value={
                                        students.filter((s) => !s.blocked)
                                            .length
                                    }
                                    colorClass="bg-emerald-50 text-emerald-600"
                                />
                                <StatBadge
                                    icon={School}
                                    label="Campus"
                                    value="QC-01"
                                    colorClass="bg-amber-50 text-amber-600"
                                />
                            </div>

                            <Separator
                                orientation="vertical"
                                className="h-8 hidden md:block bg-slate-200"
                            />

                            <Dialog
                                open={isDialogOpen}
                                onOpenChange={setIsDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button className="h-11 pl-4 pr-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold text-xs uppercase tracking-wide transition-all active:scale-95">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Enroll Learner
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none">
                                    <DialogHeader className="sr-only">
                                        <DialogTitle>
                                            Enroll New Learner
                                        </DialogTitle>
                                    </DialogHeader>
                                    <EnrollStudenModalForm
                                        onClose={() => setIsDialogOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* --- SECTION 2: TOOLBAR (Sticky) --- */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 bg-white/70 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200/50 shadow-sm">
                        {/* Search Field */}
                        <div className="relative w-full md:w-[450px] group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                {isFetching && debouncedSearch ? (
                                    <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                )}
                            </div>
                            <Input
                                className="pl-11 bg-slate-100/50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all rounded-xl h-11 text-sm font-medium placeholder:text-slate-400"
                                placeholder="Search by name, ID, or clinical keyword..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* View Toggles & Actions */}
                        <div className="flex items-center gap-2">
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchTerm('')}
                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-9 px-3 rounded-lg"
                                >
                                    <FilterX size={14} className="mr-1.5" />{' '}
                                    Clear Search
                                </Button>
                            )}
                            <Tabs
                                value={viewMode}
                                onValueChange={(v: any) => setViewMode(v)}
                            >
                                <TabsList className="h-11 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                                    <TabsTrigger
                                        value="grid"
                                        className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                                    >
                                        <LayoutGrid size={16} />
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="table"
                                        className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                                    >
                                        <List size={16} />
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                            >
                                <MoreHorizontal size={18} />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* --- SECTION 3: CONTENT AREA --- */}
                <main
                    className={cn(
                        'min-h-[50vh] transition-opacity duration-300',
                        isFetching && debouncedSearch
                            ? 'opacity-50'
                            : 'opacity-100',
                    )}
                >
                    {students.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {students.map((student) => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                                <StudentsTable students={students} />
                            </div>
                        )
                    ) : (
                        /* --- EMPTY STATE --- */
                        <div className="flex flex-col items-center justify-center py-40 text-center animate-in zoom-in-95 duration-500 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/30">
                            <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                                <Search size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">
                                No results found
                            </h3>
                            <p className="text-sm font-medium text-slate-400 mt-2 max-w-[320px]">
                                We couldn't find any learners matching your
                                current search parameters.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setSearchTerm('')}
                                className="mt-8 h-11 px-8 rounded-xl border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest transition-all hover:bg-white hover:text-indigo-600 hover:border-indigo-200"
                            >
                                Reset Registry View
                            </Button>
                        </div>
                    )}
                </main>

                {/* --- SECTION 4: AUTO GAP / FOOTER SPACER --- */}
                {/* Ensures the grid has room to breathe at the bottom of the screen */}
                <footer className="h-16 w-full shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}
