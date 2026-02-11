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
import EnrollStudentForm from '@/components/EnrollStudentForm';
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

import { cn } from '@/lib/utils'; // Ensure utility is imported

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
        <div className="p-6 lg:p-8 min-h-screen max-w-[1600px] mx-auto animate-in fade-in duration-500 font-sans">
            <Toaster position="top-right" richColors closeButton />

            {/* --- TECHNICAL HEADER --- */}
            <header className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                            <Database size={12} /> Learner Database
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Master Roster
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* KPI Stats in Header */}
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
                                    students.filter((s) => !s.blocked).length
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
                            className="h-8 hidden md:block"
                        />

                        <Dialog
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="h-10 pl-3 pr-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 font-semibold text-xs uppercase tracking-wide transition-all active:scale-95">
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
                                <EnrollStudentForm
                                    onClose={() => setIsDialogOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* --- TOOLBAR --- */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 py-2 -mx-2 px-2 rounded-xl">
                    {/* Search Field */}
                    <div className="relative w-full md:w-[400px] group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isFetching && debouncedSearch ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            )}
                        </div>
                        <Input
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all rounded-xl h-10 text-sm font-medium placeholder:text-slate-400"
                            placeholder="Search by name, ID, or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                <Badge
                                    variant="secondary"
                                    className="h-6 bg-white border border-slate-100 text-[10px] text-slate-500 font-mono"
                                >
                                    /
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* View Toggles */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchTerm('')}
                                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-9 mr-2"
                            >
                                <FilterX size={14} className="mr-1.5" /> Clear
                                Filters
                            </Button>
                        )}
                        <Tabs
                            value={viewMode}
                            onValueChange={(v: any) => setViewMode(v)}
                            className="h-10"
                        >
                            <TabsList className="h-10 bg-slate-100/80 p-1 rounded-lg border border-slate-200/50">
                                <TabsTrigger
                                    value="grid"
                                    className="h-8 rounded-md px-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    <LayoutGrid size={14} />
                                </TabsTrigger>
                                <TabsTrigger
                                    value="table"
                                    className="h-8 rounded-md px-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    <List size={14} />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-lg border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                        >
                            <MoreHorizontal size={16} />
                        </Button>
                    </div>
                </div>
            </header>

            {/* --- CONTENT AREA --- */}
            <div
                className={cn(
                    'min-h-[60vh] transition-opacity duration-300',
                    isFetching && debouncedSearch
                        ? 'opacity-50'
                        : 'opacity-100',
                )}
            >
                {students.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {students.map((student) => (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                            <StudentsTable students={students} />
                        </div>
                    )
                ) : (
                    /* --- EMPTY STATE --- */
                    <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-500 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                            <Search size={24} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                            No learners found
                        </h3>
                        <p className="text-sm font-medium text-slate-400 mt-1 max-w-[280px]">
                            We couldn't find any learners matching "{searchTerm}
                            "
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm('')}
                            className="mt-6 h-9 px-5 rounded-lg border-slate-200 text-slate-600 font-semibold text-xs transition-all hover:bg-white hover:text-indigo-600 hover:border-indigo-200"
                        >
                            Reset Search
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
